import { createAdminClient } from "@/lib/superadmin/admin-client";
import { PageHeader } from "@/components/superadmin/page-header";
import { ALL_MODULES, type ModuleKey } from "@/lib/permissions";
import { PermissionsManager } from "@/components/permissions/permissions-manager";
import { BulkApplyClienteExterno } from "./bulk-button";

export const dynamic = "force-dynamic";

type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
};

type MemberRow = {
  user_id: string;
  organization_id: string;
  role: string;
  organizations: { id: string; name: string; slug: string } | null;
};

type PermissionRow = {
  user_id: string;
  organization_id: string;
  module: ModuleKey;
  can_read: boolean;
  can_write: boolean;
};

export default async function PermissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; user?: string; org?: string }>;
}) {
  const sp = await searchParams;
  const admin = createAdminClient();

  let pq = admin
    .from("profiles")
    .select("id, email, full_name")
    .order("email", { ascending: true })
    .limit(200);

  if (sp.q) {
    pq = pq.or(`email.ilike.%${sp.q}%,full_name.ilike.%${sp.q}%`);
  }

  const { data: profiles } = await pq;
  const profileList = (profiles ?? []) as ProfileRow[];

  // Memberships com org
  const ids = profileList.map((p) => p.id);
  let memberships: MemberRow[] = [];
  if (ids.length > 0) {
    const { data: mems } = await admin
      .from("organization_members")
      .select("user_id, organization_id, role, organizations(id,name,slug)")
      .in("user_id", ids);
    memberships = (mems ?? []) as unknown as MemberRow[];
  }

  // Permissões atuais
  let perms: PermissionRow[] = [];
  if (ids.length > 0) {
    const { data: pr } = await admin
      // @ts-expect-error tabela nova
      .from("user_module_permissions")
      .select("user_id, organization_id, module, can_read, can_write")
      .in("user_id", ids);
    perms = (pr ?? []) as unknown as PermissionRow[];
  }

  const enriched = profileList.map((p) => {
    const userMems = memberships.filter((m) => m.user_id === p.id);
    const userPerms = perms.filter((pr) => pr.user_id === p.id);
    return { profile: p, memberships: userMems, permissions: userPerms };
  });

  return (
    <div>
      <PageHeader
        title="Permissões por módulo"
        description="Libere ou restrinja acesso de usuários a módulos específicos do Spotlog (CRM, tickets, área cliente, etc.)."
      />

      <BulkApplyClienteExterno />

      <form className="mb-4 flex gap-2" action="" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por email ou nome..."
          className="flex-1 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
        />
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-semibold"
          style={{ background: "#BA0102" }}
        >
          Buscar
        </button>
      </form>

      <div className="space-y-3">
        {enriched.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 text-center text-white/60">
            Nenhum usuário encontrado.
          </div>
        ) : (
          enriched.map(({ profile, memberships: mems, permissions }) => (
            <PermissionsManager
              key={profile.id}
              userId={profile.id}
              email={profile.email ?? "(sem email)"}
              fullName={profile.full_name}
              memberships={mems.map((m) => ({
                organization_id: m.organization_id,
                org_name: m.organizations?.name ?? "—",
                role: m.role,
              }))}
              modules={ALL_MODULES}
              permissions={permissions.map((p) => ({
                organization_id: p.organization_id,
                module: p.module,
                can_read: p.can_read,
                can_write: p.can_write,
              }))}
            />
          ))
        )}
      </div>
    </div>
  );
}
