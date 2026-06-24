import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getBySource } from "@/lib/queries/marketing-ana";
import { Card, CardContent } from "@/components/ui/card";
import { Radio } from "lucide-react";

export const dynamic = "force-dynamic";

const PERIODS = [
  { v: 7, l: "7 dias" },
  { v: 30, l: "30 dias" },
  { v: 90, l: "90 dias" },
];

export default async function CanaisPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const ctx = await requireSession();
  const { d } = await searchParams;
  const days = Number(d ?? 30) || 30;
  const rows = await getBySource(ctx.org.id, days);
  const max = Math.max(...rows.map((r) => r.count), 1);
  const totalLeads = rows.reduce((a, r) => a + r.count, 0);
  const totalConv = rows.reduce((a, r) => a + r.converted, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Análise de Canais</h2>
          <p className="text-sm text-muted-foreground">De onde seus leads chegam.</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <Link
              key={p.v}
              href={`?d=${p.v}`}
              className={`px-3 h-8 inline-flex items-center text-xs rounded-md border ${
                days === p.v
                  ? "bg-[#BA0102] text-white border-[#BA0102]"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              {p.l}
            </Link>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-3 gap-3">
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Total de leads</p>
            <p className="text-2xl font-bold">{totalLeads.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Convertidos</p>
            <p className="text-2xl font-bold">{totalConv.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Taxa global</p>
            <p className="text-2xl font-bold">
              {totalLeads > 0 ? `${((totalConv / totalLeads) * 100).toFixed(1)}%` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-12 text-center">
            <Radio className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Sem leads no período</p>
            <p className="text-sm text-muted-foreground">
              Ainda não há leads nos últimos {days} dias.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <div className="space-y-3">
              {rows.map((r) => {
                const w = (r.count / max) * 100;
                const conv = r.count > 0 ? (r.converted / r.count) * 100 : 0;
                return (
                  <div key={r.source}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{r.source}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.count} leads · {r.converted} conv ({conv.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full bg-[#BA0102] rounded-full transition-all"
                        style={{ width: `${w}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
