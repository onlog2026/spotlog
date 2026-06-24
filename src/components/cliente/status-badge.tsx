import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RemessaStatus =
  | "coletado"
  | "triagem"
  | "em_rota"
  | "entregue"
  | "devolvido"
  | "ocorrencia";

const STATUS_MAP: Record<
  RemessaStatus,
  { label: string; className: string }
> = {
  coletado: {
    label: "Coletado",
    className: "bg-navy-900/10 text-navy-900 dark:text-navy-200",
  },
  triagem: {
    label: "Em triagem",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  em_rota: {
    label: "Em rota",
    className: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  },
  entregue: {
    label: "Entregue",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  devolvido: {
    label: "Devolvido",
    className: "bg-slate-500/15 text-slate-700 dark:text-slate-300",
  },
  ocorrencia: {
    label: "Ocorrência",
    className: "bg-spotorange-500/15 text-spotorange-500",
  },
};

export function RemessaStatusBadge({
  status,
  className,
}: {
  status: RemessaStatus;
  className?: string;
}) {
  const info = STATUS_MAP[status];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", info.className, className)}
    >
      {info.label}
    </Badge>
  );
}

export type ChamadoStatus = "aberto" | "em_analise" | "resolvido";

const CHAMADO_MAP: Record<
  ChamadoStatus,
  { label: string; className: string }
> = {
  aberto: {
    label: "Aberto",
    className: "bg-spotorange-500/15 text-spotorange-500",
  },
  em_analise: {
    label: "Em análise",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  resolvido: {
    label: "Resolvido",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
};

export function ChamadoStatusBadge({ status }: { status: ChamadoStatus }) {
  const info = CHAMADO_MAP[status];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", info.className)}
    >
      {info.label}
    </Badge>
  );
}

export type FaturaStatus = "pago" | "em_aberto" | "vencido";

const FATURA_MAP: Record<FaturaStatus, { label: string; className: string }> = {
  pago: {
    label: "Pago",
    className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  },
  em_aberto: {
    label: "Em aberto",
    className: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  vencido: {
    label: "Vencido",
    className: "bg-spotorange-500/15 text-spotorange-500",
  },
};

export function FaturaStatusBadge({ status }: { status: FaturaStatus }) {
  const info = FATURA_MAP[status];
  return (
    <Badge
      variant="outline"
      className={cn("border-transparent font-medium", info.className)}
    >
      {info.label}
    </Badge>
  );
}
