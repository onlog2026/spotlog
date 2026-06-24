import Link from "next/link";
import { createAdminClient } from "@/lib/superadmin/admin-client";
import { PageHeader } from "@/components/superadmin/page-header";

export const dynamic = "force-dynamic";

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  created_at: string;
  members: number;
  leads: number;
  tickets: number;
};

export default async function OrganizacoesPage({
  searchParams,
}: {
  searchParams: Promise<{ plan?: string; q?: string; status?: string }>;
}) {
  const sp = await searchParams;
  const admin = createAdminClient();

  let query = admin
    .from("organizations")
    .select("id, name, slug, plan, status, created_at")
    .order("created_at", { ascending: false });

  if (sp.plan && sp.plan !== "all") {
    query = query.eq("plan", sp.plan);
  }
  if (sp.status && sp.status !== "all") {
    query = query.eq("status", sp.status);
  }
  if (sp.q) {
    query = query.or(`name.ilike.%${sp.q}%,slug.ilike.%${sp.q}%`);
  }

  const { data: orgs, error } = await query.limit(200);
  const list = (orgs ?? []) as Array<Omit<OrgRow, "members" | "leads" | "tickets">>;

  // Enriquece com contagens reais
  const enriched: OrgRow[] = await Promise.all(
    list.map(async (o) => {
      const [{ count: members }, { count: leads }, { count: tickets }] = await Promise.all([
        admin
          .from("organization_members")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", o.id),
        admin
          .from("leads")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", o.id),
        admin
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .eq("organization_id", o.id),
      ]);
      return {
        ...o,
        members: members ?? 0,
        leads: leads ?? 0,
        tickets: tickets ?? 0,
      };
    }),
  );

  return (
    <div>
      <PageHeader
        title="Organizações"
        description={`${enriched.length} org${enriched.length !== 1 ? "s" : ""} ${sp.plan && sp.plan !== "all" ? `no plano ${sp.plan}` : "no total"}.`}
      />

      {error ? (
        <div className="mb-4 rounded-md border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-200">
          Erro ao carregar: {error.message}
        </div>
      ) : null}

      <form className="mb-4 flex flex-wrap gap-2 items-center" action="" method="get">
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por nome ou slug..."
          className="flex-1 min-w-[200px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm focus:outline-none focus:border-white/30"
        />
        <select
          name="plan"
          defaultValue={sp.plan ?? "all"}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="all">Todos planos</option>
          <option value="free">Free</option>
          <option value="starter">Starter</option>
          <option value="pro">Pro</option>
          <option value="business">Business</option>
          <option value="enterprise">Enterprise</option>
        </select>
        <select
          name="status"
          defaultValue={sp.status ?? "all"}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="all">Todos status</option>
          <option value="active">Ativas</option>
          <option value="suspended">Suspensas</option>
          <option value="archived">Arquivadas</option>
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
              <th className="py-3 px-4">Nome</th>
              <th className="py-3 px-4">Slug</th>
              <th className="py-3 px-4">Plano</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Membros</th>
              <th className="py-3 px-4">Leads</th>
              <th className="py-3 px-4">Tickets</th>
              <th className="py-3 px-4">Criada em</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {enriched.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 px-4 text-center text-white/50">
                  Nenhuma organização encontrada.
                </td>
              </tr>
            ) : (
              enriched.map((o) => (
                <tr key={o.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 font-medium">{o.name}</td>
                  <td className="py-3 px-4 text-white/60 font-mono text-xs">{o.slug}</td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs uppercase">
                      {o.plan}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className="rounded px-2 py-0.5 text-xs"
                      style={{
                        background:
                          o.status === "active"
                            ? "rgba(34,197,94,0.2)"
                            : o.status === "suspended"
                              ? "rgba(186,1,2,0.2)"
                              : "rgba(255,255,255,0.1)",
                        color:
                          o.status === "active"
                            ? "#86efac"
                            : o.status === "suspended"
                              ? "#ff6b6c"
                              : "white",
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{o.members}</td>
                  <td className="py-3 px-4">{o.leads}</td>
                  <td className="py-3 px-4">{o.tickets}</td>
                  <td className="py-3 px-4 text-white/60 text-xs">
                    {new Date(o.created_at).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Link
                      href={`/app/superadmin/organizacoes/${o.id}`}
                      className="text-xs font-semibold underline-offset-2 hover:underline"
                      style={{ color: "#ff6b6c" }}
                    >
                      Ver detalhes →
                    </Link>
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
