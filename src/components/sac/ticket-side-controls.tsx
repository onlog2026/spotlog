"use client";
import { useTransition } from "react";
import { patchTicketAction } from "@/app/app/sac/actions";
import type { TicketStatus, TicketPriority } from "@/lib/types/operacao";

const STATUS: Array<{ value: TicketStatus; label: string }> = [
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "aguardando_cliente", label: "Aguardando cliente" },
  { value: "resolvido", label: "Resolvido" },
  { value: "fechado", label: "Fechado" },
];

const PRIORITY: Array<{ value: TicketPriority; label: string }> = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
];

const DEPT: Array<{ value: string; label: string }> = [
  { value: "sac", label: "SAC" },
  { value: "comercial", label: "Comercial" },
  { value: "financeiro", label: "Financeiro" },
  { value: "tecnico", label: "Técnico" },
];

export function TicketSideControls({
  ticketId,
  status,
  priority,
  department,
}: {
  ticketId: string;
  status: TicketStatus;
  priority: TicketPriority;
  department: string;
}) {
  const [isPending, startTransition] = useTransition();
  const baseSelect =
    "mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-xs disabled:opacity-60";

  function autoSubmit(formData: FormData) {
    startTransition(async () => {
      await patchTicketAction(formData);
    });
  }

  return (
    <div className="space-y-3" aria-busy={isPending}>
      <form action={autoSubmit}>
        <input type="hidden" name="ticket_id" value={ticketId} />
        <label
          htmlFor={`status-${ticketId}`}
          className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold"
        >
          Status
        </label>
        <select
          id={`status-${ticketId}`}
          name="status"
          defaultValue={status}
          disabled={isPending}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={baseSelect}
        >
          {STATUS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </form>

      <form action={autoSubmit}>
        <input type="hidden" name="ticket_id" value={ticketId} />
        <label
          htmlFor={`priority-${ticketId}`}
          className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold"
        >
          Prioridade
        </label>
        <select
          id={`priority-${ticketId}`}
          name="priority"
          defaultValue={priority}
          disabled={isPending}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={baseSelect}
        >
          {PRIORITY.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </form>

      <form action={autoSubmit}>
        <input type="hidden" name="ticket_id" value={ticketId} />
        <label
          htmlFor={`dept-${ticketId}`}
          className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold"
        >
          Departamento
        </label>
        <select
          id={`dept-${ticketId}`}
          name="department"
          defaultValue={department}
          disabled={isPending}
          onChange={(e) => e.currentTarget.form?.requestSubmit()}
          className={baseSelect}
        >
          {DEPT.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </form>
    </div>
  );
}
