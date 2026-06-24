"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { createAdminClient } from "@/lib/superadmin/admin-client";

const idSchema = z.string().uuid();

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

  // Safety check — só apaga orgs sem leads/deals/tickets
  const [{ count: leads }, { count: deals }, { count: tickets }] = await Promise.all([
    admin.from("leads").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    admin.from("deals").select("*", { count: "exact", head: true }).eq("organization_id", orgId),
    admin
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", orgId),
  ]);

  if ((leads ?? 0) + (deals ?? 0) + (tickets ?? 0) > 0) {
    throw new Error(
      "Org tem leads/deals/tickets. Use 'Suspender' ou exclua os dados antes (operação manual).",
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
