import { requireSession } from "@/lib/auth";
import { getBySource } from "@/lib/queries/marketing-ana";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PerformancePage() {
  const ctx = await requireSession();
  const [curr, prev] = await Promise.all([
    getBySource(ctx.org.id, 30),
    getBySource(ctx.org.id, 60),
  ]);

  // prev é cumulativo até 60d → subtrai o atual (últimos 30) pra ter "30d anteriores"
  const prevMap = new Map<string, number>();
  prev.forEach((r) => prevMap.set(r.source, r.count));
  const currMap = new Map<string, number>();
  curr.forEach((r) => currMap.set(r.source, r.count));

  const sources = new Set([...currMap.keys(), ...prevMap.keys()]);
  const rows = Array.from(sources).map((src) => {
    const c = currMap.get(src) ?? 0;
    const totalPrev60 = prevMap.get(src) ?? 0;
    const p = Math.max(totalPrev60 - c, 0);
    let delta = 0;
    if (p > 0) delta = ((c - p) / p) * 100;
    else if (c > 0) delta = 100;
    return { source: src, curr: c, prev: p, delta };
  });
  rows.sort((a, b) => b.curr - a.curr);
  const max = Math.max(...rows.map((r) => Math.max(r.curr, r.prev)), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Performance de Canais</h2>
        <p className="text-sm text-muted-foreground">
          Últimos 30 dias vs 30 dias anteriores.
        </p>
      </div>

      {rows.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-12 text-center">
            <p className="font-semibold mb-1">Sem dados pra comparar</p>
            <p className="text-sm text-muted-foreground">
              Ainda não há leads suficientes nos últimos 60 dias.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const wCurr = (r.curr / max) * 100;
            const wPrev = (r.prev / max) * 100;
            const Icon = r.delta > 0 ? TrendingUp : r.delta < 0 ? TrendingDown : Minus;
            const color =
              r.delta > 0 ? "text-emerald-400" : r.delta < 0 ? "text-red-400" : "text-muted-foreground";
            return (
              <Card key={r.source} className="border-white/10 bg-card/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-sm">{r.source}</span>
                    <span className={`text-xs inline-flex items-center gap-1 ${color}`}>
                      <Icon className="h-3 w-3" />
                      {r.delta >= 0 ? "+" : ""}
                      {r.delta.toFixed(0)}%
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-muted-foreground">Atual (30d)</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-[#BA0102] rounded-full"
                          style={{ width: `${wCurr}%` }}
                        />
                      </div>
                      <span className="w-12 text-right tabular-nums">{r.curr}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="w-20 text-muted-foreground">Anterior</span>
                      <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-[#011960] rounded-full"
                          style={{ width: `${wPrev}%` }}
                        />
                      </div>
                      <span className="w-12 text-right tabular-nums">{r.prev}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
