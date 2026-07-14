/**
 * Leituras do sistema de entitlements (Eixo A) para o SUPER ADMIN.
 * Usa o admin client (service_role, bypassa RLS) — server-only.
 * As tabelas (modules/plans/plan_modules/org_modules/platform_settings) não
 * estão nos types gerados do Supabase → client destipado via `as any`.
 */
import { createAdminClient } from "@/lib/superadmin/admin-client";

export type ModuleRow = {
  key: string;
  label: string;
  description: string | null;
  module_group: string | null;
  is_addon: boolean;
  active: boolean;
  sort_order: number;
};

export type PlanRow = {
  key: string;
  name: string;
  price_cents: number;
  billing_period: string;
  active: boolean;
  sort_order: number;
};

export type OrgModuleRow = {
  module_key: string;
  enabled: boolean;
  source: string;
  expires_at: string | null;
};

function db() {
  return createAdminClient() as unknown as { from: (t: string) => any };
}

export async function listModules(): Promise<ModuleRow[]> {
  const { data } = await db()
    .from("modules")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as ModuleRow[];
}

export async function listPlans(): Promise<PlanRow[]> {
  const { data } = await db()
    .from("plans")
    .select("*")
    .order("sort_order", { ascending: true });
  return (data ?? []) as PlanRow[];
}

export async function listPlanModules(): Promise<
  Array<{ plan_key: string; module_key: string }>
> {
  const { data } = await db().from("plan_modules").select("plan_key, module_key");
  return (data ?? []) as Array<{ plan_key: string; module_key: string }>;
}

export async function listOrgModules(orgId: string): Promise<OrgModuleRow[]> {
  const { data } = await db()
    .from("org_modules")
    .select("module_key, enabled, source, expires_at")
    .eq("organization_id", orgId);
  return (data ?? []) as OrgModuleRow[];
}

/** Quantas orgs usam cada plano (para bloquear exclusão de plano em uso). */
export async function countOrgsByPlan(): Promise<Record<string, number>> {
  const { data } = await db().from("organizations").select("plan");
  const out: Record<string, number> = {};
  for (const row of (data ?? []) as Array<{ plan: string | null }>) {
    const p = row.plan ?? "";
    if (!p) continue;
    out[p] = (out[p] ?? 0) + 1;
  }
  return out;
}

export async function isEnforcementOn(): Promise<boolean> {
  const { data } = await db()
    .from("platform_settings")
    .select("value")
    .eq("key", "entitlements_enforced")
    .maybeSingle();
  const v = (data as { value?: unknown } | null)?.value;
  return v === true || v === "true";
}

/**
 * Estado EFETIVO de cada módulo para uma org (espelha has_org_module):
 *   override (org_modules, respeitando expiração) vence o plano.
 * Retorna, por módulo: se está no plano, o override (ou null) e o efetivo.
 */
export type OrgModuleEffective = {
  module: ModuleRow;
  inPlan: boolean;
  override: boolean | null; // null = sem override (segue o plano)
  effective: boolean;
  expiresAt: string | null;
};

export async function getOrgModuleMatrix(
  orgId: string,
  orgPlan: string | null,
): Promise<OrgModuleEffective[]> {
  const [modules, planModules, orgModules] = await Promise.all([
    listModules(),
    listPlanModules(),
    listOrgModules(orgId),
  ]);
  const inPlanSet = new Set(
    planModules.filter((pm) => pm.plan_key === orgPlan).map((pm) => pm.module_key),
  );
  const nowMs = Date.now();
  const overrideMap = new Map<string, { enabled: boolean; expires_at: string | null }>();
  for (const om of orgModules) {
    if (om.expires_at && Date.parse(om.expires_at) <= nowMs) continue; // expirado
    overrideMap.set(om.module_key, { enabled: om.enabled, expires_at: om.expires_at });
  }

  return modules.map((m) => {
    const ov = overrideMap.get(m.key);
    const inPlan = inPlanSet.has(m.key);
    const override = ov ? ov.enabled : null;
    const effective = !m.active ? false : override !== null ? override : inPlan;
    return {
      module: m,
      inPlan,
      override,
      effective,
      expiresAt: ov?.expires_at ?? null,
    };
  });
}
