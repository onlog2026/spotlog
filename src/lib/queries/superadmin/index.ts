/**
 * Helpers de query do Super Admin Global. Tudo via service_role.
 * NUNCA importar em código client — apenas Server Components / Server Actions.
 */
import "server-only";
import { createAdminClient } from "@/lib/superadmin/admin-client";

/** Conta linhas de uma tabela com fallback seguro. */
export async function safeCount(table: string, filter?: { column: string; value: string }): Promise<number> {
  try {
    const admin = createAdminClient();
    // @ts-expect-error tabela dinâmica
    let q = admin.from(table).select("*", { count: "exact", head: true });
    if (filter) q = q.eq(filter.column, filter.value);
    const { count } = await q;
    return count ?? 0;
  } catch {
    return 0;
  }
}

/** Lista nomes das organizações por ids, em map. */
export async function getOrgNamesMap(orgIds: string[]): Promise<Map<string, string>> {
  if (orgIds.length === 0) return new Map();
  const admin = createAdminClient();
  const { data } = await admin
    .from("organizations")
    .select("id, name")
    .in("id", orgIds);
  return new Map((data ?? []).map((o) => [o.id, o.name]));
}

/** Lista emails de profiles por ids, em map. */
export async function getUserEmailsMap(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, email")
    .in("id", userIds);
  return new Map((data ?? []).map((p) => [p.id, p.email ?? "—"]));
}

/** Lista últimos N registros de auth.users via admin API. Retorna [] em caso de erro. */
export async function listAuthUsers(limit = 200): Promise<
  Array<{ id: string; email: string | undefined; created_at: string; last_sign_in_at: string | null; banned_until: string | null }>
> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.auth.admin.listUsers({ perPage: limit, page: 1 });
    return (data?.users ?? []).map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at ?? null,
      // @ts-expect-error banned_until exists on admin payload
      banned_until: u.banned_until ?? null,
    }));
  } catch {
    return [];
  }
}
