import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const SUPER_ADMIN_EMAIL = "onlogjf@gmail.com";

export type SuperAdminUser = {
  id: string;
  email: string;
  full_name: string | null;
};

/**
 * Garante que o usuário logado é super admin global do Spotlog.
 * Critério: email === SUPER_ADMIN_EMAIL OU profiles.is_super_admin === true.
 *
 * Se não autenticado → /login
 * Se autenticado mas não é super admin → /app?error=forbidden
 */
export async function requireSuperAdmin(): Promise<SuperAdminUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const email = user.email ?? "";

  // Checa profile.is_super_admin (a coluna foi criada via migration 20260108).
  let isFlagged = false;
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_super_admin, full_name")
      .eq("id", user.id)
      .maybeSingle();
    isFlagged = (profile as { is_super_admin?: boolean } | null)?.is_super_admin === true;
  } catch {
    isFlagged = false;
  }

  const isAllowed = email === SUPER_ADMIN_EMAIL || isFlagged;

  if (!isAllowed) redirect("/app?error=forbidden");

  // Re-busca o full_name de forma segura (sem depender da coluna nova)
  const { data: baseProfile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  return {
    id: user.id,
    email,
    full_name: baseProfile?.full_name ?? null,
  };
}
