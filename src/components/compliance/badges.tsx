import { Badge } from "@/components/ui/badge";
import type {
  RegulatoryDocStatus,
  RegulatoryDocType,
} from "@/lib/queries/compliance";
import type { InvoiceStatus } from "@/lib/types/operacao";

const DOC_TYPE_LABEL: Record<RegulatoryDocType, string> = {
  anvisa_aut: "Anvisa",
  contrato_cliente: "Contrato",
  sat_motorista: "SAT motorista",
  seguro_carga: "Seguro carga",
  outro: "Outro",
};

const DOC_TYPE_CLASSES: Record<RegulatoryDocType, string> = {
  anvisa_aut: "border-transparent bg-blue-500/15 text-blue-700 dark:text-blue-300",
  contrato_cliente:
    "border-transparent bg-navy-900/15 text-navy-900 dark:text-white",
  sat_motorista:
    "border-transparent bg-purple-500/15 text-purple-700 dark:text-purple-300",
  seguro_carga:
    "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
  outro: "border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export function DocTypeBadge({ type }: { type: RegulatoryDocType }) {
  return (
    <Badge className={DOC_TYPE_CLASSES[type]}>{DOC_TYPE_LABEL[type]}</Badge>
  );
}

const DOC_STATUS_LABEL: Record<RegulatoryDocStatus, string> = {
  vigente: "Vigente",
  vencido: "Vencido",
  em_renovacao: "Em renovação",
};

const DOC_STATUS_CLASSES: Record<RegulatoryDocStatus, string> = {
  vigente:
    "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  vencido: "border-transparent bg-red-500/15 text-red-700 dark:text-red-300",
  em_renovacao:
    "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
};

export function DocStatusBadge({ status }: { status: RegulatoryDocStatus }) {
  return (
    <Badge className={DOC_STATUS_CLASSES[status]}>
      {DOC_STATUS_LABEL[status]}
    </Badge>
  );
}

const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  pendente: "Pendente",
  paga: "Paga",
  vencida: "Vencida",
  cancelada: "Cancelada",
};

const INVOICE_STATUS_CLASSES: Record<InvoiceStatus, string> = {
  pendente:
    "border-transparent bg-amber-500/15 text-amber-700 dark:text-amber-300",
  paga: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  vencida: "border-transparent bg-red-500/15 text-red-700 dark:text-red-300",
  cancelada:
    "border-transparent bg-slate-500/15 text-slate-700 dark:text-slate-300",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <Badge className={INVOICE_STATUS_CLASSES[status]}>
      {INVOICE_STATUS_LABEL[status]}
    </Badge>
  );
}

export const DOC_TYPE_OPTIONS: Array<{
  value: RegulatoryDocType;
  label: string;
}> = (Object.keys(DOC_TYPE_LABEL) as RegulatoryDocType[]).map((value) => ({
  value,
  label: DOC_TYPE_LABEL[value],
}));

export const DOC_STATUS_OPTIONS: Array<{
  value: RegulatoryDocStatus;
  label: string;
}> = (Object.keys(DOC_STATUS_LABEL) as RegulatoryDocStatus[]).map((value) => ({
  value,
  label: DOC_STATUS_LABEL[value],
}));

export const INVOICE_STATUS_OPTIONS: Array<{
  value: InvoiceStatus;
  label: string;
}> = (Object.keys(INVOICE_STATUS_LABEL) as InvoiceStatus[]).map((value) => ({
  value,
  label: INVOICE_STATUS_LABEL[value],
}));
