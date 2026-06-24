import { Card, CardContent } from "@/components/ui/card";
import { Eye, Users, MousePointerClick, Repeat } from "lucide-react";

export const dynamic = "force-dynamic";

export default function AlcancePage() {
  // Placeholders enquanto integração com Meta/Google/LinkedIn Ads não está conectada
  const stats = [
    { label: "Alcance estimado", value: "—", icon: Eye, hint: "Conecte mídias sociais" },
    { label: "Alcance único", value: "—", icon: Users, hint: "Pessoas distintas" },
    { label: "Impressões", value: "—", icon: Repeat, hint: "Visualizações totais" },
    { label: "CTR médio", value: "—", icon: MousePointerClick, hint: "Cliques / impressões" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Alcance</h2>
        <p className="text-sm text-muted-foreground">
          Métricas de alcance e exposição das suas campanhas.
        </p>
      </div>

      <div className="text-xs bg-blue-500/10 border border-blue-500/30 text-blue-300 px-3 py-2 rounded-md">
        Conecte Meta Ads, Google Ads ou LinkedIn Ads em{" "}
        <a href="/app/admin/integracoes" className="underline font-semibold">
          Integrações
        </a>{" "}
        pra ver dados reais de alcance.
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="border-white/10 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground">{s.hint}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-bold">{s.value}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-8 text-center">
          <Eye className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">Nada pra mostrar ainda</p>
          <p className="text-sm text-muted-foreground">
            Métricas de alcance virão automaticamente quando você conectar uma plataforma de anúncios.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
