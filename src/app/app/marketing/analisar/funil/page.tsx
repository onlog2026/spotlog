import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getFunnel } from "@/lib/queries/marketing-ana";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Users, Sparkles, Target, Trophy } from "lucide-react";

export const dynamic = "force-dynamic";

const PERIODS = [
  { v: 7, l: "7 dias" },
  { v: 30, l: "30 dias" },
  { v: 90, l: "90 dias" },
  { v: 365, l: "12 meses" },
];

function pct(num: number, den: number): string {
  if (den <= 0) return "—";
  return `${((num / den) * 100).toFixed(1)}%`;
}

export default async function FunilPage({
  searchParams,
}: {
  searchParams: Promise<{ d?: string }>;
}) {
  const ctx = await requireSession();
  const { d } = await searchParams;
  const days = Number(d ?? 30) || 30;
  const f = await getFunnel(ctx.org.id, days);

  const stages = [
    { key: "visitors", label: "Visitantes", value: f.visitors, icon: Eye, color: "#94a3b8" },
    { key: "leads", label: "Leads", value: f.leads, icon: Users, color: "#011960" },
    { key: "qualified", label: "Qualificados", value: f.qualified, icon: Sparkles, color: "#6366f1" },
    { key: "opportunities", label: "Oportunidades", value: f.opportunities, icon: Target, color: "#BA0102" },
    { key: "won", label: "Vendas", value: f.won, icon: Trophy, color: "#10b981" },
  ];

  const max = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold">Funil de Conversão</h2>
          <p className="text-sm text-muted-foreground">
            Acompanhe a jornada do visitante até a venda.
          </p>
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

      {f.visitors === 0 && (
        <div className="text-xs bg-yellow-500/10 border border-yellow-500/40 text-neutral-900 px-3 py-2 rounded-md">
          Visitantes ainda não integrados — conecte Google Analytics em Integrações pra ver o topo do funil.
        </div>
      )}

      <div className="space-y-2">
        {stages.map((s, i) => {
          const Icon = s.icon;
          const width = (s.value / max) * 100;
          const prev = i > 0 ? stages[i - 1]!.value : null;
          const fromTop = i > 0 ? pct(s.value, stages[1]!.value || 1) : "100%";
          return (
            <Card key={s.key} className="border-white/10 bg-card/50 overflow-hidden">
              <CardContent className="p-0">
                <div className="relative">
                  <div
                    className="h-16 transition-all"
                    style={{
                      width: `${Math.max(width, 8)}%`,
                      background: `linear-gradient(90deg, ${s.color}50, ${s.color}20)`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-9 w-9 rounded-md inline-flex items-center justify-center text-white"
                        style={{ background: s.color }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold">{s.label}</p>
                        <p className="text-[11px] text-muted-foreground">
                          {fromTop} dos leads
                          {prev !== null && prev > 0 && (
                            <span> · {pct(s.value, prev)} da etapa anterior</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-2xl font-bold tabular-nums">
                      {s.value.toLocaleString("pt-BR")}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-4">
          <h3 className="text-sm font-semibold mb-3">Taxas globais</h3>
          <div className="grid sm:grid-cols-3 gap-3 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Lead → Qualificado</p>
              <p className="text-lg font-bold">{pct(f.qualified, f.leads)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Qualificado → Oportunidade</p>
              <p className="text-lg font-bold">{pct(f.opportunities, f.qualified)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Oportunidade → Venda</p>
              <p className="text-lg font-bold">{pct(f.won, f.opportunities)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
