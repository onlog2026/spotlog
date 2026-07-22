"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { createAdminClient } from "@/lib/superadmin/admin-client";

const idSchema = z.string().uuid();
const moduleKeySchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9_]+$/);
const planKeySchema = moduleKeySchema;

function adminDb() {
  return createAdminClient() as unknown as { from: (t: string) => any };
}

/** Troca o plano da organização (Eixo A). */
export async function setOrgPlan(orgId: string, planKey: string) {
  await requireSuperAdmin();
  idSchema.parse(orgId);
  planKeySchema.parse(planKey);

  // valida que o plano existe no catálogo (evita órfã ao ligar enforcement)
  const { data: plan } = await adminDb()
    .from("plans")
    .select("key")
    .eq("key", planKey)
    .maybeSingle();
  if (!plan) throw new Error("Plano inexistente no catálogo.");

  const { error } = await adminDb()
    .from("organizations")
    .update({ plan: planKey })
    .eq("id", orgId);
  if (error) throw new Error(`Falha ao trocar plano: ${error.message}`);

  revalidatePath(`/app/superadmin/organizacoes/${orgId}`);
  return { ok: true };
}

/**
 * Define o override de um módulo para a org (org_modules — vence o plano).
 * mode: "plan" = segue o plano (remove override) · "on"/"off" = força.
 */
export async function setOrgModuleOverride(
  orgId: string,
  moduleKey: string,
  mode: "plan" | "on" | "off",
) {
  await requireSuperAdmin();
  idSchema.parse(orgId);
  moduleKeySchema.parse(moduleKey);
  const admin = adminDb();

  if (mode === "plan") {
    const { error } = await admin
      .from("org_modules")
      .delete()
      .eq("organization_id", orgId)
      .eq("module_key", moduleKey);
    if (error) throw new Error(`Falha ao remover override: ${error.message}`);
  } else {
    const { error } = await admin.from("org_modules").upsert(
      {
        organization_id: orgId,
        module_key: moduleKey,
        enabled: mode === "on",
        source: "manual",
        expires_at: null,
      },
      { onConflict: "organization_id,module_key" },
    );
    if (error) throw new Error(`Falha ao definir override: ${error.message}`);
  }

  revalidatePath(`/app/superadmin/organizacoes/${orgId}`);
  return { ok: true };
}

export async function suspendOrganization(orgId: string) {
  await requireSuperAdmin();
  idSchema.parse(orgId);
  const admin = createAdminClient();

  const { error } = await admin
    .from("organizations")
    // @ts-expect-error coluna status criada via migration 20260108
    .update({ status: "suspended" })
    .eq("id", orgId);

  if (error) throw new Error(`Falha ao suspender: ${error.message}`);

  revalidatePath(`/app/superadmin/organizacoes/${orgId}`);
  revalidatePath(`/app/superadmin/organizacoes`);
  return { ok: true };
}

export async function reactivateOrganization(orgId: string) {
  await requireSuperAdmin();
  idSchema.parse(orgId);
  const admin = createAdminClient();

  const { error } = await admin
    .from("organizations")
    // @ts-expect-error coluna status criada via migration 20260108
    .update({ status: "active" })
    .eq("id", orgId);

  if (error) throw new Error(`Falha ao reativar: ${error.message}`);

  revalidatePath(`/app/superadmin/organizacoes/${orgId}`);
  revalidatePath(`/app/superadmin/organizacoes`);
  return { ok: true };
}

export async function deleteOrganization(orgId: string) {
  await requireSuperAdmin();
  idSchema.parse(orgId);
  const admin = createAdminClient();

  // Safety check — só apaga orgs sem dado real. Antes só contava
  // leads/deals/tickets; companies/proposals/integrations (com credenciais
  // salvas) caíam junto via ON DELETE CASCADE sem nenhum aviso.
  const [
    { count: leads },
    { count: deals },
    { count: tickets },
    { count: companies },
    { count: proposals },
    { count: integrations },
  ] = await Promise.all([
    admin.from("leads").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    admin.from("deals").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    admin
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
    admin.from("companies").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    admin.from("proposals").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    admin
      .from("integrations")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  const total =
    (leads ?? 0) + (deals ?? 0) + (tickets ?? 0) + (companies ?? 0) + (proposals ?? 0) + (integrations ?? 0);
  if (total > 0) {
    throw new Error(
      `Org tem dado real (leads:${leads ?? 0} deals:${deals ?? 0} tickets:${tickets ?? 0} empresas:${companies ?? 0} propostas:${proposals ?? 0} integrações:${integrations ?? 0}). Use 'Suspender' ou exclua os dados antes (operação manual).`,
    );
  }

  const { error } = await admin.from("organizations").delete().eq("id", orgId);
  if (error) throw new Error(`Falha ao excluir: ${error.message}`);

  revalidatePath(`/app/superadmin/organizacoes`);
  redirect("/app/superadmin/organizacoes");
}

export async function promoteOwnerToSuperAdmin(orgId: string) {
  await requireSuperAdmin();
  idSchema.parse(orgId);
  const admin = createAdminClient();

  // Acha o owner da org
  const { data: owner } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .eq("role", "owner")
    .maybeSingle();

  if (!owner) throw new Error("Org sem owner cadastrado.");

  const { error } = await admin
    .from("profiles")
    // @ts-expect-error coluna nova
    .update({ is_super_admin: true })
    .eq("id", owner.user_id);

  if (error) throw new Error(`Falha ao promover: ${error.message}`);

  revalidatePath(`/app/superadmin/organizacoes/${orgId}`);
  revalidatePath(`/app/superadmin/usuarios`);
  return { ok: true };
}
