import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Route as RouteIcon,
  User,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import {
  getOperacaoKpis,
  getProximasRotas,
  getUltimasOcorrencias,
} from "@/lib/queries/operacao";
import {
  RouteBadge,
  SeverityBadge,
  CategoryBadge,
} from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function OperacaoDashboardPage() {
  const ctx = await requireSession();
  const [kpis, rotas, ocorrencias] = await Promise.all([
    getOperacaoKpis(ctx.org.id),
    getProximasRotas(ctx.org.id),
    getUltimasOcorrencias(ctx.org.id),
  ]);

  const cards = [
    {
      label: "Remessas hoje",
      value: kpis.shipmentsHoje,
      icon: Package,
      tint: "bg-navy-900/10 text-navy-900 dark:text-white",
    },
    {
      label: "Em rota",
      value: kpis.emRota,
      icon: Truck,
      tint: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    },
    {
      label: "Entregues",
      value: kpis.entregues,
      icon: CheckCircle2,
      tint: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Devolvidas",
      value: kpis.devolvidas,
      icon: RotateCcw,
      tint: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    },
    {
      label: "Ocorrências abertas",
      value: kpis.ocorrenciasAbertas,
      icon: AlertTriangle,
      tint: "bg-spotorange-500/15 text-spotorange-500",
    },
    {
      label: "Rotas em andamento",
      value: kpis.routesEmAndamento,
      icon: RouteIcon,
      tint: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    },
    {
      label: "Motoristas ativos",
      value: kpis.driversAtivos,
      icon: User,
      tint: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
  ];

  return (
    <div className="space-y-6">
      <section
        aria-label="Indicadores operacionais"
        className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3"
      >
        {cards.map((c) => (
          <Card
            key={c.label}
            className="border-transparent bg-card/50 hover:border-spotorange-500 transition"
          >
            <CardContent className="p-4">
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${c.tint}`}
              >
                <c.icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold leading-tight">{c.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <Card className="border-transparent bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <RouteIcon className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
              Próximas rotas
            </CardTitle>
            <Button asChild variant="link" size="sm">
              <Link href="/app/operacao/routes">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {rotas.length === 0 ? (
              <EmptyState
                icon={RouteIcon}
                title="Nenhuma rota agendada"
                description="Crie uma rota para começar a despachar remessas."
              />
            ) : (
              rotas.map((r) => (
                <Link
                  key={r.id}
                  href={`/app/operacao/routes/${r.id}`}
                  className="block rounded-lg border border-white/5 bg-background/60 hover:border-spotorange-500 transition p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm">{r.code ?? r.id.slice(0, 8)}</div>
                      <div className="text-xs text-muted-foreground">
                        {r.driver?.full_name ?? "Sem motorista"}
                        {r.vehicle?.plate ? ` · ${r.vehicle.plate}` : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground">
                        {r.total_stops ?? 0} paradas
                      </span>
                      <RouteBadge status={r.status} />
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
              Últimas ocorrências
            </CardTitle>
            <Button asChild variant="link" size="sm">
              <Link href="/app/operacao/ocorrencias">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {ocorrencias.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Nenhuma ocorrência registrada"
                description="Quando algo acontecer com uma remessa, aparece aqui."
              />
            ) : (
              ocorrencias.map((o) => (
                <div
                  key={o.id}
                  className="rounded-lg border border-white/5 bg-background/60 p-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <CategoryBadge category={o.category} />
                      <SeverityBadge severity={o.severity} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(o.opened_at)}
                    </span>
                  </div>
                  <div className="mt-2 text-sm">
                    {o.shipment?.code && (
                      <span className="font-mono text-xs text-muted-foreground mr-2">
                        {o.shipment.code}
                      </span>
                    )}
                    {o.description ?? "(sem descrição)"}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
