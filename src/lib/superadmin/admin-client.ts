/**
 * Cliente Supabase com service_role para o SUPER ADMIN GLOBAL.
 *
 * IMPORTANTE: este arquivo NUNCA pode ser importado em código client.
 * Só rode em Server Components, Route Handlers e Server Actions.
 *
 * O fallback runtime garante o erro o mais cedo possível caso alguém
 * tente bundleá-lo no client (sem o pacote `server-only` instalado,
 * fazemos a checagem manual via `typeof window`).
 */

if (typeof window !== "undefined") {
  throw new Error(
    "[superadmin/admin-client] Este módulo é server-only. Não importe em components client.",
  );
}

import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types/database";

let _cached: ReturnType<typeof createSupabaseClient<Database>> | null = null;

/**
 * Cria (e cacheia) o admin client. Usa SUPABASE_SERVICE_ROLE_KEY para
 * bypassar RLS e listar dados de TODAS as organizações cruzadas.
 */
export function createAdminClient() {
  if (_cached) return _cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "[superadmin/admin-client] SUPABASE_SERVICE_ROLE_KEY ou NEXT_PUBLIC_SUPABASE_URL não configurados.",
    );
  }

  _cached = createSupabaseClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    db: { schema: "public" },
  });

  return _cached;
}

/**
 * Helper de uso comum: conta linhas de uma tabela em todas as orgs.
 */
export async function countAll(table: string): Promise<number> {
  const admin = createAdminClient();
  // @ts-expect-error tabela genérica
  const { count } = await admin.from(table).select("*", { count: "exact", head: true });
  return count ?? 0;
}
