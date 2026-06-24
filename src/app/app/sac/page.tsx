import Link from "next/link";
import {
  AlertTriangle,
  Clock,
  Inbox,
  MessageSquare,
  CheckCircle2,
  Timer,
  ArrowRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { getSacKpis, getTicketsUrgentes } from "@/lib/queries/sac";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/sac/status-badges";
import { MarkSeenOnMount } from "@/components/notifications/mark-seen-on-mount";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function SacDashboardPage() {
  const { org } = await requireSession();
  const [kpis, urgentes] = await Promise.all([
    getSacKpis(org.id),
    getTicketsUrgentes(org.id),
  ]);

  const cards = [
    {
      label: "Tickets abertos",
      value: kpis.abertos,
      icon: Inbox,
      tint: "bg-spotorange-500/15 text-spotorange-500",
    },
    {
      label: "Em análise",
      value: kpis.emAnalise,
      icon: MessageSquare,
      tint: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    {
      label: "Aguard. cliente",
      value: kpis.aguardandoCliente,
      icon: Clock,
      tint: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
    },
    {
      label: "Resolvidos hoje",
      value: kpis.resolvidosHoje,
      icon: CheckCircle2,
      tint: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "T. médio resposta",
      value:
        kpis.tempoMedioRespostaHoras === null
          ? "—"
          : `${kpis.tempoMedioRespostaHoras}h`,
      icon: Timer,
      tint: "bg-navy-900/10 text-navy-900 dark:text-white",
    },
    {
      label: "Críticos abertos",
      value: kpis.criticos,
      icon: AlertTriangle,
      tint: "bg-red-500/15 text-red-700 dark:text-red-300",
    },
  ];

  return (
    <div className="space-y-6">
      <MarkSeenOnMount module="tickets_sac" />
      <section
        aria-label="Indicadores do SAC"
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

      <Card className="border-transparent bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base">Mais urgentes</CardTitle>
            <p className="text-xs text-muted-foreground">
              Tickets de prioridade alta ou urgente ainda abertos
            </p>
          </div>
          <Button asChild variant="link" size="sm">
            <Link href="/app/sac/tickets">
              Ver todos <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {urgentes.length === 0 ? (
            <div className="px-6 pb-6 text-sm text-muted-foreground">
              Nenhum ticket crítico aberto agora. Bom trabalho.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Protocolo</th>
                    <th className="text-left py-2 px-4">Assunto</th>
                    <th className="text-left py-2 px-4">Empresa</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Prioridade</th>
                    <th className="text-left py-2 px-4">Aberto em</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {urgentes.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-3 px-4 font-mono text-xs">
                        {t.protocol}
                      </td>
                      <td className="py-3 px-4">{t.subject}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {t.companies?.name ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <TicketStatusBadge status={t.status} />
                      </td>
                      <td className="py-3 px-4">
                        <TicketPriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDateTime(t.opened_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/app/sac/tickets/${t.id}`}
                            aria-label={`Abrir ticket ${t.protocol}`}
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
