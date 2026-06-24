import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/superadmin/page-header";
import { BroadcastForm } from "@/components/superadmin/broadcast-form";

export const dynamic = "force-dynamic";

type BroadcastRow = {
  id: string;
  title: string;
  body: string;
  audience: string;
  target_company_id: string | null;
  target_organization_id: string | null;
  created_at: string;
};

export default async function SuperAdminBroadcastPage() {
  const supabase = await createClient();

  const [{ data: orgs }, { data: companies }, { data: broadcasts }] =
    await Promise.all([
      supabase.from("organizations").select("id, name").order("name"),
      supabase
        .from("companies")
        .select("id, name, organization_id")
        .order("name"),
      supabase
        .from("client_broadcasts")
        .select(
          "id, title, body, audience, target_company_id, target_organization_id, created_at",
        )
        .order("created_at", { ascending: false })
        .limit(50),
    ]);

  const orgList = (orgs ?? []) as Array<{ id: string; name: string }>;
  const companyList = (companies ?? []) as Array<{
    id: string;
    name: string;
    organization_id: string;
  }>;
  const broadcastList = (broadcasts ?? []) as BroadcastRow[];

  const audienceLabel: Record<string, string> = {
    all_clients: "Todos os clientes",
    all_orgs: "Todas as transportadoras",
    specific_company: "Empresa específica",
    specific_org: "Transportadora específica",
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Broadcast"
        description="Envie um aviso pra clientes ou admins de transportadoras"
      />

      <div className="rounded-lg border border-white/10 bg-[#010f3d] p-6">
        <BroadcastForm
          organizations={orgList}
          companies={companyList}
        />
      </div>

      <div className="rounded-lg border border-white/10 bg-[#010f3d]">
        <div className="px-4 py-3 border-b border-white/10 font-semibold">
          Broadcasts anteriores
        </div>
        <div className="divide-y divide-white/5">
          {broadcastList.length === 0 ? (
            <div className="p-6 text-center text-white/60 text-sm">
              Nenhum broadcast enviado ainda.
            </div>
          ) : (
            broadcastList.map((b) => (
              <div key={b.id} className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold">{b.title}</div>
                    <div className="text-xs text-white/60 mt-0.5">
                      {audienceLabel[b.audience] ?? b.audience} ·{" "}
                      {new Date(b.created_at).toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-sm text-white/80 whitespace-pre-wrap line-clamp-4">
                  {b.body}
                </p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
