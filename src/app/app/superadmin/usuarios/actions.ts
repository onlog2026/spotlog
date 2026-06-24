"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin, SUPER_ADMIN_EMAIL } from "@/lib/superadmin/guard";
import { createAdminClient } from "@/lib/superadmin/admin-client";

const uuidSchema = z.string().uuid();
const emailSchema = z.string().email();

export async function promoteToSuperAdmin(userId: string) {
  await requireSuperAdmin();
  uuidSchema.parse(userId);
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    // @ts-expect-error coluna nova
    .update({ is_super_admin: true })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/app/superadmin/usuarios");
  return { ok: true };
}

export async function demoteFromSuperAdmin(userId: string) {
  await requireSuperAdmin();
  uuidSchema.parse(userId);

  // Acha o email pra impedir auto-demoção do email hardcoded
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.email === SUPER_ADMIN_EMAIL) {
    throw new Error(
      `Não dá pra remover super admin do email hardcoded (${SUPER_ADMIN_EMAIL}).`,
    );
  }

  const { error } = await admin
    .from("profiles")
    // @ts-expect-error coluna nova
    .update({ is_super_admin: false })
    .eq("id", userId);

  if (error) throw new Error(error.message);
  revalidatePath("/app/superadmin/usuarios");
  return { ok: true };
}

export async function banUser(userId: string) {
  await requireSuperAdmin();
  uuidSchema.parse(userId);
  const admin = createAdminClient();

  // ban_duration aceita string como '24h' ou 'none'/'876000h' (~100 anos)
  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/superadmin/usuarios");
  return { ok: true };
}

export async function unbanUser(userId: string) {
  await requireSuperAdmin();
  uuidSchema.parse(userId);
  const admin = createAdminClient();

  const { error } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "none",
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/superadmin/usuarios");
  return { ok: true };
}

export async function resetPasswordEmail(email: string) {
  await requireSuperAdmin();
  emailSchema.parse(email);
  const admin = createAdminClient();

  const redirectTo = (process.env.NEXT_PUBLIC_SITE_URL ?? "") + "/login/reset";
  const { error } = await admin.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) throw new Error(error.message);
  return { ok: true };
}

/** Gera magic link e retorna a URL pra copiar — USO RESTRITO A DEBUG. */
export async function generateImpersonateLink(email: string): Promise<{ link: string }> {
  await requireSuperAdmin();
  emailSchema.parse(email);
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });
  if (error) throw new Error(error.message);
  const link = data?.properties?.action_link;
  if (!link) throw new Error("Magic link não retornado pelo Supabase.");
  return { link };
}
