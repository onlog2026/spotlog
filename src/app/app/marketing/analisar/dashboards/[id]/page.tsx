import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Hash, BarChart3, Table2, Filter as FunnelIcon } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listDashboards } from "@/lib/queries/marketing-ana";
import {
  getWidgetData,
  type WidgetKind,
  type WidgetSource,
} from "@/lib/queries/marketing-dashboard-widgets";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const KIND_ICON: Record<WidgetKind, React.ComponentType<{ className?: string }>> = {
  kpi: Hash,
  chart: BarChart3,
  table: Table2,
  funnel: FunnelIcon,
};

const KIND_LABEL: Record<WidgetKind, string> = {
  kpi: "KPI",
  chart: "Gráfico",
  table: "Tabela",
  funnel: "Funil",
};

export default async function DashboardDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireSession();
  const list = await listDashboards(ctx.org.id);
  const dashboard = list.find((d) => d.id === id);
  if (!dashboard) notFound();

  const widgets = (dashboard.layout_json ?? []) as Array<{
    widget: WidgetKind;
    source: WidgetSource;
    title: string;
  }>;

  const widgetData = await Promise.all(
    widgets.map((w) => getWidgetData(ctx.org.id, w.source)),
  );

  return (
    <div className="space-y-6">
      <Link
        href="/app/marketing/analisar/dashboards"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{dashboard.name}</h1>
        {dashboard.description && (
          <p className="text-muted-foreground mt-1">{dashboard.description}</p>
        )}
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Este dashboard não tem widgets.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {widgets.map((w, i) => {
            const Icon = KIND_ICON[w.widget] ?? Hash;
            const data = widgetData[i];
            return (
              <Card key={i} className="border-white/10 bg-card/50">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold">
                    <Icon className="h-4 w-4 text-[#BA0102]" />
                    {w.title}
                    <span className="text-[10px] font-normal text-muted-foreground ml-auto">
                      {KIND_LABEL[w.widget]} · {w.source}
                    </span>
                  </div>

                  {w.widget === "kpi" && (
                    <div>
                      <div className="text-3xl font-bold">
                        {data.value.toLocaleString("pt-BR")}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {data.valueLabel}
                      </div>
                    </div>
                  )}

                  {(w.widget === "chart" || w.widget === "funnel") && (
                    <div className="space-y-1.5">
                      {data.breakdown.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem dados ainda.</p>
                      ) : (
                        data.breakdown.map((b) => {
                          const max = Math.max(...data.breakdown.map((x) => x.count), 1);
                          return (
                            <div key={b.label} className="flex items-center gap-2 text-xs">
                              <span className="w-24 truncate text-muted-foreground capitalize">
                                {b.label}
                              </span>
                              <div className="flex-1 h-2 rounded bg-white/5 overflow-hidden">
                                <div
                                  className="h-full bg-[#BA0102]"
                                  style={{ width: `${(b.count / max) * 100}%` }}
                                />
                              </div>
                              <span className="w-8 text-right font-medium">{b.count}</span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {w.widget === "table" && (
                    <div className="space-y-1">
                      {data.rows.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Sem registros ainda.</p>
                      ) : (
                        data.rows.map((r) => (
                          <div
                            key={r.id}
                            className="flex items-center justify-between text-xs py-1 border-b border-white/5 last:border-0"
                          >
                            <span className="truncate">{r.title}</span>
                            <span className="text-muted-foreground shrink-0 ml-2">
                              {r.extra}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
