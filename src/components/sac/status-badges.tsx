import { Badge } from "@/components/ui/badge";
import type { TicketStatus, TicketPriority } from "@/lib/types/operacao";

const STATUS_LABEL: Record<TicketStatus, string> = {
  aberto: "Aberto",
  em_analise: "Em análise",
  aguardando_cliente: "Aguard. cliente",
  resolvido: "Resolvido",
  fechado: "Fechado",
};

const STATUS_CLASSES: Record<TicketStatus, string> = {
  aberto:
    "border-transparent bg-spotorange-500/15 text-spotorange-500",
  em_analise:
    "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
  aguardando_cliente:
    "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300",
  resolvido:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  fechado:
    "border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  return (
    <Badge className={STATUS_CLASSES[status]}>{STATUS_LABEL[status]}</Badge>
  );
}

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
  urgente: "Urgente",
};

const PRIORITY_CLASSES: Record<TicketPriority, string> = {
  baixa: "border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300",
  media: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300",
  alta: "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
  urgente: "border-transparent bg-spotorange-500/20 text-spotorange-500",
};

export function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  return (
    <Badge className={PRIORITY_CLASSES[priority]}>
      {PRIORITY_LABEL[priority]}
    </Badge>
  );
}
