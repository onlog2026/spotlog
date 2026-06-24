import { requireSession } from "@/lib/auth";
import { listAllCampaigns, type CampaignRow } from "@/lib/queries/marketing-ana";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Megaphone, MessageSquare, Mail, Bell, Target, Workflow } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_ICON: Record<CampaignRow["type"], React.ComponentType<{ className?: string }>> = {
  sms: MessageSquare,
  email: Mail,
  push: Bell,
  ads: Target,
  cadencia: Workflow,
};

const TYPE_COLOR: Record<CampaignRow["type"], string> = {
  sms: "bg-purple-500/20 text-purple-300",
  email: "bg-blue-500/20 text-blue-300",
  push: "bg-yellow-500/20 text-yellow-300",
  ads: "bg-pink-500/20 text-pink-300",
  cadencia: "bg-emerald-500/20 text-emerald-300",
};

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const ctx = await requireSession();
  const { type, status } = await searchParams;
  let all = await listAllCampaigns(ctx.org.id);
  if (type) all = all.filter((c) => c.type === type);
  if (status) all = all.filter((c) => c.status === status);

  const types = ["sms", "email", "push", "ads", "cadencia"] as const;
  const counts = types.map((t) => ({
    type: t,
    count: all.filter((c) => c.type === t).length,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Gerenciador de Campanhas</h2>
        <p className="text-sm text-muted-foreground">
          Todas as campanhas (SMS, e-mail, push, anúncios, cadências) num só lugar.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {counts.map((c) => {
          const Icon = TYPE_ICON[c.type];
          return (
            <a
              key={c.type}
              href={`?type=${c.type}`}
              className="block"
            >
              <Card
                className={`border-white/10 bg-card/50 hover:border-[#BA0102]/40 transition ${
                  type === c.type ? "border-[#BA0102]" : ""
                }`}
              >
                <CardContent className="p-3 text-center">
                  <Icon className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                  <p className="text-xl font-bold">{c.count}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{c.type}</p>
                </CardContent>
              </Card>
            </a>
          );
        })}
      </div>

      {type && (
        <a href="?" className="text-xs text-muted-foreground hover:text-foreground">
          ← Limpar filtro
        </a>
      )}

      {all.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-12 text-center">
            <Megaphone className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Nenhuma campanha</p>
            <p className="text-sm text-muted-foreground">
              Crie campanhas em SMS, E-mail, Push, Ads ou Cadências.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Métrica</th>
                    <th className="text-left p-3">Criado</th>
                  </tr>
                </thead>
                <tbody>
                  {all.map((c) => {
                    const Icon = TYPE_ICON[c.type];
                    return (
                      <tr key={c.type + c.id} className="border-t border-white/5">
                        <td className="p-3 font-medium">{c.name}</td>
                        <td className="p-3">
                          <Badge className={`${TYPE_COLOR[c.type]} text-[10px]`}>
                            <Icon className="h-3 w-3 mr-1 inline" />
                            {c.type}
                          </Badge>
                        </td>
                        <td className="p-3 text-xs capitalize">{c.status}</td>
                        <td className="p-3 text-xs text-muted-foreground">{c.metric_label}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
