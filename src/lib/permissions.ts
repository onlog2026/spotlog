import { redirect } from "next/navigation";
import { requireSession, type SessionContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type ModuleKey =
  | "crm"
  | "pipeline"
  | "propostas"
  | "prospeccao"
  | "cadencias"
  | "tickets_comercial"
  | "tickets_financeiro"
  | "tickets_sac"
  | "tickets_tecnico"
  | "operacao"
  | "cms"
  | "sdr"
  | "admin"
  | "superadmin"
  | "cliente_remessas"
  | "cliente_chamados"
  | "cliente_financeiro";

export type ModuleDef = {
  key: ModuleKey;
  label: string;
  group:
    | "Comercial"
    | "Atendimento"
    | "Operações"
    | "Conteúdo"
    | "Administração"
    | "Cliente";
};

export const ALL_MODULES: ModuleDef[] = [
  { key: "crm", label: "CRM", group: "Comercial" },
  { key: "pipeline", label: "Pipeline Kanban", group: "Comercial" },
  { key: "propostas", label: "Propostas", group: "Comercial" },
  { key: "prospeccao", label: "Prospecção", group: "Comercial" },
  { key: "cadencias", label: "Cadências", group: "Comercial" },
  { key: "sdr", label: "SDR / IA", group: "Comercial" },

  { key: "tickets_comercial", label: "Tickets Comercial", group: "Atendimento" },
  { key: "tickets_financeiro", label: "Tickets Financeiro", group: "Atendimento" },
  { key: "tickets_sac", label: "Tickets SAC", group: "Atendimento" },
  { key: "tickets_tecnico", label: "Tickets Técnico", group: "Atendimento" },

  { key: "operacao", label: "Operações / Logística", group: "Operações" },
  { key: "cms", label: "CMS", group: "Conteúdo" },

  { key: "admin", label: "Admin da organização", group: "Administração" },
  { key: "superadmin", label: "Super Admin Global", group: "Administração" },

  { key: "cliente_remessas", label: "Área Cliente — Remessas", group: "Cliente" },
  { key: "cliente_chamados", label: "Área Cliente — Chamados", group: "Cliente" },
  { key: "cliente_financeiro", label: "Área Cliente — Financeiro", group: "Cliente" },
];

/**
 * Checa se o usuário tem permissão sobre um módulo.
 * Fallback: owner/admin têm acesso completo automaticamente.
 */
export async function userCanAccessModule(
  orgId: string,
  module: ModuleKey,
  requireWrite = false,
): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  // @ts-expect-error RPC nova fora dos types gerados
  const { data, error } = await supabase.rpc("has_module_permission", {
    p_user: user.id,
    p_org: orgId,
    p_module: module,
    p_write: requireWrite,
  });
  if (error) return false;
  return data === true;
}

/**
 * requireSession + checagem de módulo. Redireciona em caso de falha.
 */
export async function requireModule(
  module: ModuleKey,
  write = false,
): Promise<SessionContext> {
  const ctx = await requireSession();
  const ok = await userCanAccessModule(ctx.org.id, module, write);
  if (!ok) {
    redirect(`/app?error=forbidden_module&m=${module}`);
  }
  return ctx;
}

export type UserModuleGrant = {
  module: ModuleKey;
  can_read: boolean;
  can_write: boolean;
};

/**
 * Lista permissões de um usuário em uma org. Usa admin client (super admin).
 */
export async function getUserModules(
  userId: string,
  orgId: string,
): Promise<UserModuleGrant[]> {
  const admin = createAdminClient();
  const { data } = await admin
    // @ts-expect-error tabela nova fora dos types gerados
    .from("user_module_permissions")
    .select("module, can_read, can_write")
    .eq("user_id", userId)
    .eq("organization_id", orgId);
  return (data ?? []) as UserModuleGrant[];
}
