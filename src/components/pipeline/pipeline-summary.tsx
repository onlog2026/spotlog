"use client";
import { TrendingUp, Target, BarChart3, Clock } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import type { PipelineDeal, PipelineStage } from "@/lib/queries/pipeline";

export function PipelineSummary({
  stages,
  deals,
  conversionStats,
}: {
  stages: PipelineStage[];
  deals: PipelineDeal[];
  conversionStats: { won: number; lost: number; conversion: number };
}) {
  // `deals` inclui ganho/perdido dos últimos 30 dias (pro board não ficar
  // vazio) — os cards de "aberto" precisam filtrar isso, senão contam
  // negócio já fechado como se ainda estivesse em andamento.
  const wonStages = new Set(stages.filter((s) => s.is_won).map((s) => s.id));
  const lostStages = new Set(stages.filter((s) => s.is_lost).map((s) => s.id));
  const openDeals = deals.filter(
    (d) => !wonStages.has(d.stage_id) && !lostStages.has(d.stage_id),
  );
  const total = openDeals.length;
  const totalValue = openDeals.reduce((acc, d) => acc + d.amount, 0);
  const conversion = conversionStats.conversion;

  // Tempo médio: diferença entre created_at e hoje (proxy enquanto não temos stage_history)
  const avgDays =
    total > 0
      ? Math.round(
          openDeals.reduce((acc, d) => {
            const ms = Date.now() - new Date(d.created_at).getTime();
            return acc + ms / (1000 * 60 * 60 * 24);
          }, 0) / total,
        )
      : 0;

  const items = [
    {
      label: "Deals em aberto",
      value: String(total),
      Icon: Target,
      tone: "text-brand-400",
    },
    {
      label: "Valor pipeline",
      value: formatCurrency(totalValue),
      Icon: TrendingUp,
      tone: "text-emerald-400",
    },
    {
      label: "Conversão (won/fechado)",
      value: `${conversion}%`,
      Icon: BarChart3,
      tone: "text-amber-400",
    },
    {
      label: "Idade média",
      value: `${avgDays}d`,
      Icon: Clock,
      tone: "text-sky-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((it) => (
        <div
          key={it.label}
          className="rounded-xl border border-white/10 bg-card/50 p-4"
        >
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-1.5">
            <it.Icon className={`h-3.5 w-3.5 ${it.tone}`} />
            {it.label}
          </div>
          <div className="text-xl lg:text-2xl font-bold">{it.value}</div>
        </div>
      ))}
    </div>
  );
}
