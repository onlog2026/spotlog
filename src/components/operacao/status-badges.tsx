import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  DriverStatus,
  OccurrenceSeverity,
  OccurrenceStatus,
  RouteStatus,
  RouteStopStatus,
  ShipmentStatus,
  TicketPriority,
  TicketStatus,
  VehicleStatus,
} from "@/lib/types/operacao";

type Variant = { label: string; className: string };

const SHIPMENT: Record<ShipmentStatus, Variant> = {
  criada: { label: "Criada", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  coletada: { label: "Coletada", className: "bg-navy-900/10 text-navy-900 dark:text-navy-200" },
  triagem: { label: "Em triagem", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  em_rota: { label: "Em rota", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  saiu_entrega: { label: "Saiu p/ entrega", className: "bg-blue-500/20 text-blue-700 dark:text-blue-300" },
  entregue: { label: "Entregue", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  devolvida: { label: "Devolvida", className: "bg-spotorange-500/15 text-spotorange-500" },
  extraviada: { label: "Extraviada", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

export function ShipmentBadge({
  status,
  className,
}: {
  status: ShipmentStatus;
  className?: string;
}) {
  const v = SHIPMENT[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className, className)}>
      {v.label}
    </Badge>
  );
}

const ROUTE: Record<RouteStatus, Variant> = {
  planejada: { label: "Planejada", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  em_andamento: { label: "Em andamento", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  concluida: { label: "Concluída", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  cancelada: { label: "Cancelada", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

export function RouteBadge({ status }: { status: RouteStatus }) {
  const v = ROUTE[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}

const STOP: Record<RouteStopStatus, Variant> = {
  pendente: { label: "Pendente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  visitada: { label: "Visitada", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  falhou: { label: "Falhou", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

export function StopBadge({ status }: { status: RouteStopStatus }) {
  const v = STOP[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}

const DRIVER: Record<DriverStatus, Variant> = {
  ativo: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  inativo: { label: "Inativo", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  suspenso: { label: "Suspenso", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

export function DriverBadge({ status }: { status: DriverStatus }) {
  const v = DRIVER[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}

const VEHICLE: Record<VehicleStatus, Variant> = {
  disponivel: { label: "Disponível", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  em_uso: { label: "Em uso", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  manutencao: { label: "Manutenção", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
};

export function VehicleBadge({ status }: { status: VehicleStatus }) {
  const v = VEHICLE[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}

const SEVERITY: Record<OccurrenceSeverity, Variant> = {
  baixa: { label: "Baixa", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  media: { label: "Média", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  alta: { label: "Alta", className: "bg-spotorange-500/15 text-spotorange-500" },
  critica: { label: "Crítica", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

export function SeverityBadge({ severity }: { severity: OccurrenceSeverity }) {
  const v = SEVERITY[severity];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}

const OCC_STATUS: Record<OccurrenceStatus, Variant> = {
  aberta: { label: "Aberta", className: "bg-spotorange-500/15 text-spotorange-500" },
  em_analise: { label: "Em análise", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  resolvida: { label: "Resolvida", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  cancelada: { label: "Cancelada", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
};

export function OccurrenceStatusBadge({ status }: { status: OccurrenceStatus }) {
  const v = OCC_STATUS[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}

const CAT_LABEL: Record<string, string> = {
  avaria: "Avaria",
  extravio: "Extravio",
  atraso: "Atraso",
  recusa: "Recusa",
  endereco_incorreto: "Endereço",
  outro: "Outro",
};

export function CategoryBadge({ category }: { category: string }) {
  return (
    <Badge
      variant="outline"
      className="border-transparent font-medium bg-navy-900/10 text-navy-900 dark:text-navy-200"
    >
      {CAT_LABEL[category] ?? category}
    </Badge>
  );
}

const TICKET_STATUS: Record<TicketStatus, Variant> = {
  aberto: { label: "Aberto", className: "bg-spotorange-500/15 text-spotorange-500" },
  em_analise: { label: "Em análise", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  aguardando_cliente: { label: "Aguardando cliente", className: "bg-blue-500/15 text-blue-700 dark:text-blue-300" },
  resolvido: { label: "Resolvido", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  fechado: { label: "Fechado", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const v = TICKET_STATUS[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}

const TICKET_PRIORITY: Record<TicketPriority, Variant> = {
  baixa: { label: "Baixa", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
  media: { label: "Média", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  alta: { label: "Alta", className: "bg-spotorange-500/15 text-spotorange-500" },
  urgente: { label: "Urgente", className: "bg-red-500/15 text-red-700 dark:text-red-300" },
};

export function TicketPriorityBadge({ priority }: { priority: TicketPriority }) {
  const v = TICKET_PRIORITY[priority];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}
