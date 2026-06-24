import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/superadmin/page-header";

export const dynamic = "force-dynamic";

type ClientRow = {
  company: {
    id: string;
    name: string;
    cnpj: string | null;
    industry: string | null;
    city: string | null;
    state: string | null;
    created_at: string;
  };
  organization_name: string;
  users_count: number;
  tickets_count: number;
};

export default async function SuperAdminClientesPage() {
  const supabase = await createClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("sa_list_all_clients");
  const rows = ((data ?? []) as ClientRow[]) || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clientes (Todos)"
        description={`Lista de TODAS as companies de TODAS as transportadoras. Total: ${rows.length}`}
      />

      {error ? (
        <div className="rounded-md bg-red-500/20 border border-red-400/40 p-4 text-sm">
          {error.message}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-white/10 bg-[#010f3d]">
        <table className="min-w-full text-sm">
          <thead className="bg-white/5 text-xs uppercase tracking-wide text-white/70">
            <tr>
              <th className="px-4 py-3 text-left">Cliente</th>
              <th className="px-4 py-3 text-left">Transportadora</th>
              <th className="px-4 py-3 text-left">Localização</th>
              <th className="px-4 py-3 text-right">Users</th>
              <th className="px-4 py-3 text-right">Tickets</th>
              <th className="px-4 py-3 text-right">Criado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-white/60">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.company.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="font-semibold">{r.company.name}</div>
                    <div className="text-xs text-white/60">
                      {r.company.cnpj ?? "—"}
                      {r.company.industry ? ` · ${r.company.industry}` : ""}
                    </div>
                  </td>
                  <td className="px-4 py-3">{r.organization_name}</td>
                  <td className="px-4 py-3 text-white/80">
                    {[r.company.city, r.company.state].filter(Boolean).join("/") || "—"}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.users_count}
                  </td>
                  <td className="px-4 py-3 text-right tabular-nums">
                    {r.tickets_count}
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-white/60">
                    {new Date(r.company.created_at).toLocaleDateString("pt-BR")}
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
