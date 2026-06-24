import { requireSession } from "@/lib/auth";
import { getBySource, getRevenue } from "@/lib/queries/marketing-ana";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, TrendingUp } from "lucide-react";

export const dynamic = "force-dynamic";

function fmt(v: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(v);
}

export default async function MidiasPage() {
  const ctx = await requireSession();
  const [sources, revenue] = await Promise.all([
    getBySource(ctx.org.id, 90),
    getRevenue(ctx.org.id, 6),
  ]);

  const totalRevenue = revenue.reduce((a, r) => a + Number(r.revenue ?? 0), 0);
  const totalDeals = revenue.reduce((a, r) => a + r.won_deals, 0);
  const top5 = sources.slice(0, 5);
  const maxConv = Math.max(...top5.map((s) => s.converted), 1);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Análise de Mídias e Vendas</h2>
        <p className="text-sm text-muted-foreground">
          Cruzamento entre canal de origem e receita gerada (últimos 90 dias).
        </p>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Receita total (6m)</p>
            <p className="text-2xl font-bold">{fmt(totalRevenue)}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Vendas fechadas</p>
            <p className="text-2xl font-bold">{totalDeals}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Ticket médio</p>
            <p className="text-2xl font-bold">
              {totalDeals > 0 ? fmt(totalRevenue / totalDeals) : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Top 5 canais (por conversões)
          </h3>
          {top5.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Sem dados de canal no período
            </p>
          ) : (
            <div className="space-y-3">
              {top5.map((s) => {
                const w = (s.converted / maxConv) * 100;
                return (
                  <div key={s.source}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{s.source}</span>
                      <span className="text-xs text-muted-foreground">
                        {s.converted} conv · {s.count} leads
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-[#011960] rounded-full"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3 inline-flex items-center gap-2">
            <TrendingUp className="h-4 w-4" /> Receita por mês
          </h3>
          {revenue.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">
              Sem vendas fechadas nos últimos 6 meses
            </p>
          ) : (
            <div className="space-y-3">
              {revenue.map((r) => {
                const max = Math.max(...revenue.map((x) => Number(x.revenue ?? 0)), 1);
                const w = (Number(r.revenue ?? 0) / max) * 100;
                return (
                  <div key={r.month}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium">{r.month}</span>
                      <span className="text-xs text-muted-foreground">
                        {fmt(Number(r.revenue ?? 0))} · {r.won_deals} vendas
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
