// Helper de sessão pra CLIENTES EXTERNOS (portal). Diferente de requireSession()
// (que valida membership em organizations e direciona /onboarding). Aqui o user
// é uma pessoa de uma company atendida por uma transportadora.
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ClientRole = "owner" | "admin" | "member" | "viewer";

export type ClientContext = {
  user: {
    id: string;
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  };
  company: {
    id: string;
    name: string;
    cnpj: string | null;
    logo_url: string | null;
  };
  organization: {
    id: string;
    name: string;
    slug: string | null;
    logo_url: string | null;
  };
  role: ClientRole;
};

/**
 * Carrega contexto autenticado do CLIENTE EXTERNO (portal).
 * Redireciona pra /portal-login se sem sessão ou sem vínculo company_users.
 */
export async function requireClientSession(): Promise<ClientContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/portal-login");

  // @ts-expect-error RPC dinâmico — schema cache do PostgREST pode estar stale
  const { data, error } = await supabase.rpc("portal_get_context", {
    p_user: user.id,
  });
  if (error || !data || !(data as { company?: unknown }).company) {
    redirect("/portal-login?error=no_client");
  }
  const obj = data as {
    company: {
      id: string;
      name: string;
      cnpj: string | null;
      logo_url?: string | null;
    };
    organization: {
      id: string;
      name: string;
      slug?: string | null;
      logo_url?: string | null;
    };
    role: ClientRole;
    profile?: {
      full_name?: string | null;
      avatar_url?: string | null;
      email?: string | null;
    } | null;
  };

  return {
    user: {
      id: user.id,
      email: user.email ?? obj.profile?.email ?? null,
      full_name:
        obj.profile?.full_name ??
        (user.user_metadata as { full_name?: string } | null)?.full_name ??
        null,
      avatar_url:
        obj.profile?.avatar_url ??
        (user.user_metadata as { avatar_url?: string } | null)?.avatar_url ??
        null,
    },
    company: {
      id: obj.company.id,
      name: obj.company.name,
      cnpj: obj.company.cnpj ?? null,
      logo_url: obj.company.logo_url ?? null,
    },
    organization: {
      id: obj.organization.id,
      name: obj.organization.name,
      slug: obj.organization.slug ?? null,
      logo_url: obj.organization.logo_url ?? null,
    },
    role: obj.role,
  };
}
