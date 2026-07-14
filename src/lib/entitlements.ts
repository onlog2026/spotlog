import { cache } from "react";
import { redirect } from "next/navigation";
import { requireSession, type SessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Eixo A — Entitlements por ORGANIZAÇÃO ("a org comprou/tem este módulo?").
 * Complementa o Eixo B (permissions.ts → user_module_permissions, "este usuário
 * pode usar o módulo?"). Acesso final de uma feature = Eixo A AND Eixo B.
 *
 * Fonte da verdade no banco: função SQL `has_org_module(org, module)` e as
 * tabelas platform_settings / modules / plans / plan_modules / org_modules
 * (migration 20260630120000_entitlements.sql).
 *
 * ESTADO ATUAL = NEUTRO. O flag global `entitlements_enforced` nasce DESLIGADO,
 * então tudo é liberado (default-allow). Estas funções são fail-open: qualquer
 * erro de leitura also libera o módulo, para NUNCA quebrar produção. Só passam a
 * "fechar" módulos quando o super admin ligar o enforcement (passo futuro),
 * depois do back-fill dos planos das orgs.
 */

/**
 * Catálogo de módulos vendáveis (Eixo A). Espelha a tabela public.modules.
 * Mantido aqui para:
 *   1) servir de fallback fail-open (quando não dá pra ler o banco);
 *   2) o guard de navegação saber QUAIS módulos são "gerenciáveis" por
 *      entitlement — módulos fora desta lista nunca são bloqueados pelo Eixo A
 *      (espelha has_org_module, que libera módulo não-catalogado).
 *
 * ⚠️ Antes de LIGAR o enforcement, alinhar esta lista + a tabela `modules`
 * com as chaves checadas no Eixo B (permissions.ts → ModuleKey).
 */
export const MANAGED_MODULE_KEYS = [
  "crm",
  "pipeline",
  "propostas",
  "cadencias",
  "prospeccao",
  "sdr",
  "inbox",
  "flow_builder",
  "tickets_comercial",
  "tickets_financeiro",
  "tickets_sac",
  "tickets_tecnico",
  "marketing",
  "cms",
  "operacao",
  "cliente_remessas",
  "cliente_chamados",
  "cliente_financeiro",
] as const;

export type ManagedModuleKey = (typeof MANAGED_MODULE_KEYS)[number];

function isManaged(moduleKey: string): boolean {
  return (MANAGED_MODULE_KEYS as readonly string[]).includes(moduleKey);
}

/** Aceita jsonb boolean (true) OU string ("true"), à prova de erro. */
function settingIsTrue(value: unknown): boolean {
  return value === true || value === "true";
}

/**
 * Lista as chaves de módulo que a ORGANIZAÇÃO tem habilitadas (Eixo A).
 * Usada para renderizar a navegação (mostrar/ocultar itens). É COSMÉTICA:
 * o gate real de rota/ação é `requireOrgModule` (abaixo).
 *
 * React.cache → roda no máximo 1x por request, mesmo chamada em vários lugares.
 * FAIL-OPEN: qualquer falha → retorna todos os módulos (estado neutro atual).
 */
export const getOrgModules = cache(async (orgId: string): Promise<string[]> => {
  const ALL = [...MANAGED_MODULE_KEYS];
  try {
    const supabase = await createClient();
    // Tabelas novas fora dos types gerados — leitura via client destipado.
    const db = supabase as unknown as {
      from: (t: string) => any;
    };

    // 1) Enforcement ligado? Desligado (estado atual) → libera tudo, 1 query só.
    const { data: setting } = await db
      .from("platform_settings")
      .select("value")
      .eq("key", "entitlements_enforced")
      .maybeSingle();
    if (!settingIsTrue(setting?.value)) return ALL;

    // 2) Enforcement LIGADO → calcula de verdade (precedência: override → plano).
    const { data: org } = await supabase
      .from("organizations")
      .select("plan")
      .eq("id", orgId)
      .maybeSingle();
    const plan = (org as { plan?: string } | null)?.plan ?? null;

    const [modsRes, planModsRes, overridesRes] = await Promise.all([
      db.from("modules").select("key,active"),
      plan
        ? db.from("plan_modules").select("module_key").eq("plan_key", plan)
        : Promise.resolve({ data: [] as Array<{ module_key: string }> }),
      db
        .from("org_modules")
        .select("module_key,enabled,expires_at")
        .eq("organization_id", orgId),
    ]);

    const active = new Map<string, boolean>(
      ((modsRes.data ?? []) as Array<{ key: string; active: boolean | null }>).map(
        (m) => [m.key, m.active !== false] as const,
      ),
    );
    const inPlan = new Set(
      ((planModsRes.data ?? []) as Array<{ module_key: string }>).map(
        (p) => p.module_key,
      ),
    );
    const override = new Map<string, boolean>();
    const nowMs = Date.now();
    for (const o of (overridesRes.data ?? []) as Array<{
      module_key: string;
      enabled: boolean;
      expires_at: string | null;
    }>) {
      if (o.expires_at && Date.parse(o.expires_at) <= nowMs) continue; // expirado
      override.set(o.module_key, o.enabled === true);
    }

    // Considera o catálogo do banco ∪ o fallback local (evita item sumir se a
    // tabela `modules` divergir da constante).
    const keys = new Set<string>([...active.keys(), ...MANAGED_MODULE_KEYS]);
    const enabled: string[] = [];
    for (const key of keys) {
      // catalogado e inativo → nega; não-catalogado → não gerenciado (libera)
      if (active.has(key) && active.get(key) === false) continue;
      if (override.has(key)) {
        if (override.get(key)) enabled.push(key);
        continue; // override vence o plano
      }
      if (inPlan.has(key)) {
        enabled.push(key);
        continue;
      }
      if (!active.has(key)) {
        enabled.push(key); // módulo não catalogado → não gerenciado pelo Eixo A
        continue;
      }
      // gerenciado, sem override, fora do plano, enforcement ON → nega (não inclui)
    }
    return enabled;
  } catch {
    return ALL; // fail-open
  }
});

/**
 * A ORGANIZAÇÃO tem o módulo? (Eixo A, autoritativo — usa a função SQL).
 * Módulo fora do catálogo → sempre TRUE (não é gerenciado por entitlement).
 * FAIL-OPEN: erro → TRUE.
 */
export async function orgHasModule(
  orgId: string,
  moduleKey: string,
): Promise<boolean> {
  if (!isManaged(moduleKey)) return true;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      // @ts-expect-error RPC nova fora dos types gerados
      .rpc("has_org_module", { p_org: orgId, p_module: moduleKey });
    if (error) return true; // fail-open
    return data === true;
  } catch {
    return true; // fail-open
  }
}

/**
 * requireSession + checagem de entitlement da ORG. Redireciona se a org não tem
 * o módulo. Gate REAL de rotas/server actions de um módulo (Eixo A).
 * Combine com requireModule (Eixo B) onde também houver permissão por usuário.
 */
export async function requireOrgModule(
  moduleKey: string,
): Promise<SessionContext> {
  const ctx = await requireSession();
  const ok = await orgHasModule(ctx.org.id, moduleKey);
  if (!ok) {
    redirect(`/app?error=forbidden_org_module&m=${moduleKey}`);
  }
  return ctx;
}
