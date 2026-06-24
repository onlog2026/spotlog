import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Membership = {
  organization_id: string;
  role: "owner" | "admin" | "manager" | "sdr" | "closer" | "viewer";
  organizations: {
    id: string;
    name: string;
    slug: string;
    logo_url: string | null;
    plan: string;
    trial_ends_at: string | null;
  } | null;
};

export type SessionContext = {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    is_super_admin?: boolean;
    theme_preference?: string | null;
  };
  org: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    role: Membership["role"];
    logo_url: string | null;
    trial_ends_at: string | null;
  };
  memberships: Membership[];
};

const SUPER_ADMIN_EMAIL_FALLBACK = "onlogjf@gmail.com";

/**
 * Carrega contexto autenticado completo. Redireciona pra login se não tiver
 * sessão ou pra /onboarding se não houver organização.
 */
export async function requireSession(): Promise<SessionContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, current_org_id, email")
    .eq("id", user.id)
    .maybeSingle();

  // Best-effort: lê flags opcionais (podem não existir em todos os ambientes)
  let isSuperAdmin = (user.email ?? "") === SUPER_ADMIN_EMAIL_FALLBACK;
  let themePreference: string | null = null;
  try {
    const { data: extra } = await supabase
      .from("profiles")
      .select("is_super_admin, theme_preference")
      .eq("id", user.id)
      .maybeSingle();
    if (extra) {
      if ((extra as { is_super_admin?: boolean }).is_super_admin === true) {
        isSuperAdmin = true;
      }
      themePreference =
        (extra as { theme_preference?: string | null }).theme_preference ?? null;
    }
  } catch {
    // colunas opcionais inexistentes — ignora
  }

  const { data: memberships } = await supabase
    .from("organization_members")
    .select(
      "organization_id, role, organizations(id,name,slug,logo_url,plan,trial_ends_at)",
    )
    .eq("user_id", user.id);

  const list = (memberships ?? []) as unknown as Membership[];

  if (list.length === 0) redirect("/onboarding");

  const currentId =
    (profile as { current_org_id?: string } | null)?.current_org_id ??
    list[0].organization_id;
  const active = list.find((m) => m.organization_id === currentId) ?? list[0];
  const org = active.organizations!;

  return {
    user: {
      id: user.id,
      email: user.email ?? (profile as { email?: string } | null)?.email ?? null,
      full_name:
        (profile as { full_name?: string } | null)?.full_name ??
        user.user_metadata?.full_name ??
        null,
      avatar_url:
        (profile as { avatar_url?: string } | null)?.avatar_url ??
        user.user_metadata?.avatar_url ??
        null,
      is_super_admin: isSuperAdmin,
      theme_preference: themePreference,
    },
    org: {
      id: org.id,
      name: org.name,
      slug: org.slug,
      plan: org.plan,
      role: active.role,
      logo_url: org.logo_url,
      trial_ends_at: org.trial_ends_at,
    },
    memberships: list,
  };
}

export async function requireRole(
  roles: Membership["role"][],
): Promise<SessionContext> {
  const ctx = await requireSession();
  if (!roles.includes(ctx.org.role)) redirect("/app?error=forbidden");
  return ctx;
}
