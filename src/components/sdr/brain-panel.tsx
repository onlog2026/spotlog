import { Brain, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { BrainStats } from "@/lib/sdr/brain";

/** Painel do Cérebro Comercial — conversão por canal + recomendações aprendidas. */
export function BrainPanel({ stats }: { stats: BrainStats }) {
  if (!stats.available) return null;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  const canalLabel = stats.recommendedChannel === "email" ? "E-mail" : "WhatsApp";

  return (
    <Card className="border-fuchsia-500/30 bg-fuchsia-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-fuchsia-400" />
          Cérebro Comercial — o que está convertendo
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Aprendizado com dados reais: {stats.totalSent} envios · {stats.totalReply}{" "}
          respostas · {stats.totalMeeting} reuniões.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-3">
          {stats.byChannel
            .filter((c) => c.sent > 0)
            .map((c) => (
              <div
                key={c.channel}
                className="rounded-lg border border-white/10 bg-background/60 p-3"
              >
                <div className="text-sm font-semibold capitalize mb-1">
                  {c.channel === "email" ? "E-mail" : "WhatsApp"}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <div className="text-lg font-bold">{c.sent}</div>
                    <div className="text-muted-foreground">enviados</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-emerald-400">
                      {pct(c.replyRate)}
                    </div>
                    <div className="text-muted-foreground">responderam</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-fuchsia-400">
                      {pct(c.meetingRate)}
                    </div>
                    <div className="text-muted-foreground">viraram reunião</div>
                  </div>
                </div>
              </div>
            ))}
        </div>

        <div className="flex items-center gap-2 text-sm rounded-md bg-fuchsia-500/10 border border-fuchsia-500/25 px-3 py-2">
          <TrendingUp className="h-4 w-4 text-fuchsia-400 shrink-0" />
          <span>
            Recomendação do Cérebro: priorizar <strong>{canalLabel}</strong>
            {stats.recommendedHour !== null ? (
              <>
                {" "}
                e disparar por volta das <strong>{stats.recommendedHour}h</strong>
              </>
            ) : null}{" "}
            — é onde a conversão está melhor.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
