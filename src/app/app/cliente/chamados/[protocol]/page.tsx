import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/operacao/status-badges";
import { TicketChat } from "@/components/sac/ticket-chat";
import { ChamadoReplyForm } from "@/components/cliente/chamado-reply-form";
import { requireSession } from "@/lib/auth";
import { getFullTicketByProtocol } from "@/lib/queries/sac";

export const dynamic = "force-dynamic";

const DEPT_LABEL: Record<string, string> = {
  sac: "SAC",
  comercial: "Comercial",
  financeiro: "Financeiro",
  tecnico: "Técnico",
};

export default async function ChamadoConversaPage({
  params,
  searchParams,
}: {
  params: Promise<{ protocol: string }>;
  searchParams: Promise<{ created?: string }>;
}) {
  const { org } = await requireSession();
  const { protocol } = await params;
  const sp = await searchParams;

  const data = await getFullTicketByProtocol(org.id, protocol);
  if (!data) notFound();

  const { ticket, messages } = data;
  const dept = (ticket as unknown as { department?: string }).department ?? "sac";
  const encerrado = ticket.status === "fechado" || ticket.status === "resolvido";

  return (
    <div className="space-y-5">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-3">
          <Link href="/app/cliente/chamados" aria-label="Voltar para chamados">
            <ArrowLeft className="h-4 w-4" />
            Voltar para chamados
          </Link>
        </Button>
      </div>

      {sp.created === "1" && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          Chamado <span className="font-mono">{ticket.protocol}</span> aberto
          com sucesso. Acompanhe a conversa abaixo.
        </div>
      )}

      <div className="rounded-xl border border-white/10 bg-card/50 p-4 md:p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-3">
        <div className="space-y-1">
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

      <section
        className="flex flex-col bg-card/30 rounded-xl border border-white/5 overflow-hidden"
        aria-label="Conversa do chamado"
      >
        <TicketChat
          messages={messages}
          emptyLabel="Aguardando a primeira resposta do atendente."
        />
        {encerrado ? (
          <div
            role="status"
            className="border-t border-white/10 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200 flex items-start gap-3"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden />
            <div>
              <p className="font-semibold">Este chamado foi encerrado.</p>
              <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                Para uma nova solicitação, abra um novo chamado.{" "}
                <Link
                  href="/app/cliente/chamados/novo"
                  className="underline font-semibold"
                >
                  Abrir novo chamado →
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <ChamadoReplyForm protocol={ticket.protocol} />
        )}
      </section>
    </div>
  );
}
