"use client";
import { useTransition } from "react";
import { alterarStatusTicketAction } from "@/app/app/sac/actions";
import type { TicketStatus } from "@/lib/types/operacao";

const OPTIONS: Array<{ value: TicketStatus; label: string }> = [
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "aguardando_cliente", label: "Aguardando cliente" },
  { value: "resolvido", label: "Resolvido" },
  { value: "fechado", label: "Fechado" },
];

export function StatusControl({
  ticketId,
  current,
}: {
  ticketId: string;
  current: TicketStatus;
}) {
  const [isPending, startTransition] = useTransition();
  return (
    <form
      action={(formData) =>
        startTransition(async () => {
          await alterarStatusTicketAction(formData);
        })
      }
      className="inline-flex items-center gap-2"
    >
      <input type="hidden" name="ticket_id" value={ticketId} />
      <label htmlFor={`status-${ticketId}`} className="sr-only">
        Alterar status do ticket
      </label>
      <select
        id={`status-${ticketId}`}
        name="status"
        defaultValue={current}
        disabled={isPending}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        className="h-9 rounded-md border border-input bg-background px-3 text-xs"
      >
        {OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </form>
  );
}
