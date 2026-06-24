import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { requireSession } from "@/lib/auth";
import { getFullTicket } from "@/lib/queries/sac";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/operacao/status-badges";
import { ReplyForm } from "@/components/sac/reply-form";
import { TicketChat } from "@/components/sac/ticket-chat";
import { TicketSideControls } from "@/components/sac/ticket-side-controls";
import {
  alterarStatusTicketAction,
  atribuirTicketAction,
} from "@/app/app/sac/actions";

export const dynamic = "force-dynamic";

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const DEPT_LABEL: Record<string, string> = {
  sac: "SAC",
  comercial: "Comercial",
  financeiro: "Financeiro",
  tecnico: "Técnico",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { org } = await requireSession();
  const { id } = await params;

  const data = await getFullTicket(org.id, id);
  if (!data) notFound();
  const { ticket, messages, company } = data;
  const dept = (ticket as unknown as { department?: string }).department ?? "sac";
  const encerrado = ticket.status === "resolvido" || ticket.status === "fechado";

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/sac/tickets" aria-label="Voltar para lista">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
              {ticket.protocol}
            </p>
            <h2 className="text-xl font-bold">{ticket.subject}</h2>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <TicketStatusBadge status={ticket.status} />
              <TicketPriorityBadge priority={ticket.priority} />
              <Badge
                variant="outline"
                className="border-transparent bg-navy-900/10 text-navy-900 dark:text-navy-200"
              >
                {DEPT_LABEL[dept] ?? dept}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <form action={atribuirTicketAction}>
            <input type="hidden" name="ticket_id" value={ticket.id} />
            <Button type="submit" size="sm" variant="soft">
              <UserPlus className="h-4 w-4" />
              Atribuir a mim
            </Button>
          </form>
          {encerrado ? (
            <form action={alterarStatusTicketAction}>
              <input type="hidden" name="ticket_id" value={ticket.id} />
              <input type="hidden" name="status" value="em_analise" />
              <Button type="submit" size="sm" variant="outline">
                <RotateCcw className="h-4 w-4" />
                Reabrir
              </Button>
            </form>
          ) : (
            <form action={alterarStatusTicketAction}>
              <input type="hidden" name="ticket_id" value={ticket.id} />
              <input type="hidden" name="status" value="resolvido" />
              <Button type="submit" size="sm" variant="orange">
                <CheckCircle2 className="h-4 w-4" />
                Resolver
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <section
          className="lg:col-span-2 flex flex-col bg-card/30 rounded-xl border border-white/5 overflow-hidden min-h-[60vh]"
          aria-label="Conversa do ticket"
        >
          <TicketChat messages={messages} />
          {encerrado ? (
            <div
              role="status"
              className="border-t border-white/10 bg-slate-500/10 p-4 text-sm text-slate-700 dark:text-slate-200"
            >
              Ticket encerrado. Reabra acima para voltar a responder ao cliente.
            </div>
          ) : (
            <ReplyForm ticketId={ticket.id} />
          )}
        </section>

        <aside className="lg:col-span-1 space-y-4">
          <Card className="border-transparent bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Status do ticket</CardTitle>
            </CardHeader>
            <CardContent>
              <TicketSideControls
                ticketId={ticket.id}
                status={ticket.status}
                priority={ticket.priority}
                department={dept}
              />
            </CardContent>
          </Card>

          <Card className="border-transparent bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {company ? (
                <>
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Empresa</span>
                    <span className="font-medium text-right">
                      {company.name}
                    </span>
                  </div>
                  <Button asChild variant="link" size="sm" className="px-0 h-auto">
                    <Link
                      href={`/app/empresas/${company.id}`}
                      aria-label="Ver detalhe da empresa"
                    >
                      Ver empresa →
                    </Link>
                  </Button>
                </>
              ) : (
                <p className="text-muted-foreground text-xs">
                  Sem empresa vinculada.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-transparent bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Aberto em</span>
                <span className="font-medium text-right">
                  {formatDateTime(ticket.opened_at)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Última resposta</span>
                <span className="font-medium text-right">
                  {formatDateTime(ticket.last_response_at)}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-muted-foreground">Fechado em</span>
                <span className="font-medium text-right">
                  {formatDateTime(ticket.closed_at)}
                </span>
              </div>
              {ticket.description && (
                <div className="pt-2 border-t border-white/10">
                  <p className="text-muted-foreground text-xs mb-1">
                    Descrição inicial
                  </p>
                  <p className="whitespace-pre-wrap text-xs">
                    {ticket.description}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
