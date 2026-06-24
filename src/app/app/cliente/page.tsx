import Link from "next/link";
import {
  Package,
  Truck,
  CheckCircle2,
  RotateCcw,
  AlertTriangle,
  Gauge,
  ArrowRight,
  Plus,
  MessageSquarePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentBadge } from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { requireSession } from "@/lib/auth";
import {
  getClienteDashboardKpis,
  getClienteShipments,
  getVolume7Dias,
} from "@/lib/queries/cliente";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClienteDashboardPage() {
  const ctx = await requireSession();
  const [kpi, semana, ultimas] = await Promise.all([
    getClienteDashboardKpis(ctx.org.id),
    getVolume7Dias(ctx.org.id),
    getClienteShipments(ctx.org.id),
  ]);
  const top = ultimas.slice(0, 10);
  const maxVol = Math.max(1, ...semana.map((d) => d.valor));

  const cards = [
    {
      label: "Coletas/triagem",
      value: kpi.hoje,
      icon: Package,
      tint: "bg-navy-900/10 text-navy-900 dark:text-white",
    },
    {
      label: "Em rota",
      value: kpi.emRota,
      icon: Truck,
      tint: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    },
    {
      label: "Entregues",
      value: kpi.entregues,
      icon: CheckCircle2,
      tint: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Devolvidas",
      value: kpi.devolvidas,
      icon: RotateCcw,
      tint: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
    },
    {
      label: "Ocorrências abertas",
      value: kpi.ocorrenciasAbertas,
      icon: AlertTriangle,
      tint: "bg-spotorange-500/15 text-spotorange-500",
    },
    {
      label: "SLA cumprido",
      value: `${kpi.slaPct}%`,
      icon: Gauge,
      tint: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
  ];

  return (
    <div className="space-y-6">
      <section
        aria-label="Indicadores de entrega"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
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
              <div className="text-[11px] text-muted-foreground mt-1">
                {c.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-transparent bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">
              Volume nos últimos 7 dias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-3 h-40">
              {semana.map((d, i) => {
                const h = Math.max(8, Math.round((d.valor / maxVol) * 100));
                return (
                  <div
                    key={`${d.dia}-${i}`}
                    className="flex-1 flex flex-col items-center gap-2"
                  >
                    <div className="text-[10px] font-semibold text-muted-foreground">
                      {d.valor}
                    </div>
                    <div
                      role="img"
                      aria-label={`${d.valor} remessas em ${d.dia}`}
                      className="w-full rounded-md bg-gradient-to-t from-navy-900 to-spotorange-500"
                      style={{ height: `${h}%` }}
                    />
                    <div className="text-[10px] text-muted-foreground">
                      {d.dia}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Ações rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button asChild variant="orange" className="w-full" size="lg">
              <Link href="/app/cliente/coleta/nova" aria-label="Solicitar nova coleta">
                <Plus className="h-4 w-4" />
                Solicitar nova coleta
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full" size="lg">
              <Link href="/app/cliente/chamados/novo" aria-label="Abrir chamado no SAC">
                <MessageSquarePlus className="h-4 w-4" />
                Abrir chamado
              </Link>
            </Button>
            <Button asChild variant="ghost" className="w-full" size="lg">
              <Link href="/app/cliente/remessas" aria-label="Ver todas as remessas">
                Ver todas as remessas
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section>
        <Card className="border-transparent bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Últimas remessas</CardTitle>
            <Button asChild variant="link" size="sm">
              <Link href="/app/cliente/remessas">
                Ver todas <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {top.length === 0 ? (
              <EmptyState
                icon={Package}
                title="Nenhuma remessa ainda"
                description="Quando sua primeira coleta for criada, ela aparece aqui."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                    <tr>
                      <th className="text-left py-2 px-4">Código</th>
                      <th className="text-left py-2 px-4">Destinatário</th>
                      <th className="text-left py-2 px-4">Destino</th>
                      <th className="text-left py-2 px-4">Status</th>
                      <th className="text-left py-2 px-4">Prazo</th>
                      <th className="text-right py-2 px-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {top.map((r) => {
                      const addr = (r.destination_address ?? {}) as {
                        city?: string;
                        uf?: string;
                        state?: string;
                      };
                      return (
                        <tr
                          key={r.id}
                          className="border-b border-white/5 last:border-0"
                        >
                          <td className="py-3 px-4 font-mono text-xs">{r.code}</td>
                          <td className="py-3 px-4">{r.recipient_name ?? "—"}</td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {addr.city ?? "—"}
                            {addr.uf || addr.state ? ` - ${addr.uf ?? addr.state}` : ""}
                          </td>
                          <td className="py-3 px-4">
                            <ShipmentBadge status={r.status} />
                          </td>
                          <td className="py-3 px-4 text-muted-foreground">
                            {r.sla_deadline ? formatDate(r.sla_deadline) : "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button asChild variant="ghost" size="sm">
                              <Link
                                href={`/app/cliente/remessas/${r.code}`}
                                aria-label={`Ver detalhes da remessa ${r.code}`}
                              >
                                Rastrear
                                <ArrowRight className="h-3 w-3" />
                              </Link>
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
