import { createAdminClient } from "@/lib/superadmin/admin-client";
import { listAuthUsers } from "@/lib/queries/superadmin";
import { PageHeader } from "@/components/superadmin/page-header";
import { UserActions } from "./user-actions";
import { ShieldAlert } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function UsuariosPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filter?: string }>;
}) {
  const sp = await searchParams;
  const admin = createAdminClient();

  // Lista todos via auth.users (fonte canônica — inclui banned + last_sign_in)
  const authUsers = await listAuthUsers(500);

  // Profiles pra full_name + is_super_admin
  const ids = authUsers.map((u) => u.id);
  const { data: profiles } = await admin
    .from("profiles")
    .select("id, full_name, email, is_super_admin")
    .in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const profileMap = new Map(
    (profiles ?? []).map((p) => [
      p.id,
      {
        full_name: (p as { full_name: string | null }).full_name,
        is_super_admin:
          (p as { is_super_admin?: boolean }).is_super_admin === true,
      },
    ]),
  );

  // Memberships pra contar orgs
  const { data: mems } = await admin
    .from("organization_members")
    .select("user_id, organization_id")
    .in("user_id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
  const orgCountMap = new Map<string, number>();
  (mems ?? []).forEach((m) => {
    orgCountMap.set(m.user_id, (orgCountMap.get(m.user_id) ?? 0) + 1);
  });

  // Enriquece + aplica filtros
  let enriched = authUsers.map((u) => {
    const prof = profileMap.get(u.id);
    return {
      id: u.id,
      email: u.email ?? "",
      full_name: prof?.full_name ?? null,
      is_super_admin: prof?.is_super_admin ?? false,
      orgs: orgCountMap.get(u.id) ?? 0,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned_until: u.banned_until,
      is_banned: u.banned_until
        ? new Date(u.banned_until).getTime() > Date.now()
        : false,
    };
  });

  if (sp.q) {
    const q = sp.q.toLowerCase();
    enriched = enriched.filter(
      (u) =>
        u.email.toLowerCase().includes(q) ||
        (u.full_name ?? "").toLowerCase().includes(q),
    );
  }
  if (sp.filter === "super") enriched = enriched.filter((u) => u.is_super_admin);
  if (sp.filter === "noorg") enriched = enriched.filter((u) => u.orgs === 0);
  if (sp.filter === "banned") enriched = enriched.filter((u) => u.is_banned);

  enriched.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <div>
      <PageHeader
        title="Usuários"
        description={`${enriched.length} usuário${enriched.length !== 1 ? "s" : ""} (filtro ${sp.filter ?? "todos"}).`}
      />

      <form className="mb-4 flex flex-wrap gap-2" action="" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por email ou nome..."
          className="flex-1 min-w-[200px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
        />
        <select
          name="filter"
          defaultValue={sp.filter ?? ""}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="">Todos</option>
          <option value="super">Só super admins</option>
          <option value="noorg">Sem organização</option>
          <option value="banned">Banidos</option>
        </select>
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-semibold"
          style={{ background: "#BA0102" }}
        >
          Filtrar
        </button>
      </form>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 text-xs uppercase">
              <th className="py-3 px-4">Email</th>
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Orgs</th>
              <th className="py-3 px-4">Criado em</th>
              <th className="py-3 px-4">Último login</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {enriched.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 px-4 text-center text-white/50">
                  Nenhum usuário encontrado.
                </td>
              </tr>
            ) : (
              enriched.map((u) => (
                <tr key={u.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 font-medium">
                    <div className="flex items-center gap-2">
                      {u.email || "(sem email)"}
                      {u.is_super_admin ? (
                        <ShieldAlert
                          className="h-3.5 w-3.5"
                          style={{ color: "#ff6b6c" }}
                          aria-label="super admin"
                        />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-white/70">{u.full_name ?? "—"}</td>
                  <td className="py-3 px-4">{u.orgs}</td>
                  <td className="py-3 px-4 text-white/60 text-xs">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-white/60 text-xs">
                    {u.last_sign_in_at
                      ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR")
                      : "nunca"}
                  </td>
                  <td className="py-3 px-4">
                    {u.is_banned ? (
                      <span className="rounded bg-red-500/20 text-red-300 px-2 py-0.5 text-xs">
                        banido
                      </span>
                    ) : (
                      <span className="rounded bg-green-500/20 text-green-300 px-2 py-0.5 text-xs">
                        ativo
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <UserActions
                      userId={u.id}
                      email={u.email}
                      isSuper={u.is_super_admin}
                      isBanned={u.is_banned}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
