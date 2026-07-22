"use client";

import { useTransition } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { cancelEnrollment } from "@/app/app/cadencias/actions";

export type EnrollmentRow = {
  id: string;
  contact_name: string;
  contact_detail: string;
  current_step: number;
  status: string;
  next_action_at: string | null;
};

const STATUS_LABEL: Record<string, string> = {
  active: "Ativo",
  paused: "Pausado",
  replied: "Respondeu",
  bounced: "Retornou",
  opted_out: "Saiu (opt-out)",
};

function EnrollmentRowItem({
  row,
  sequenceId,
}: {
  row: EnrollmentRow;
  sequenceId: string;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <tr className="border-b border-white/5 last:border-0">
      <td className="p-3">
        <div className="font-medium">{row.contact_name}</div>
        <div className="text-xs text-muted-foreground">{row.contact_detail}</div>
      </td>
      <td className="p-3 text-center">{row.current_step + 1}</td>
      <td className="p-3">
        <Badge variant={row.status === "active" ? "success" : "secondary"}>
          {STATUS_LABEL[row.status] ?? row.status}
        </Badge>
      </td>
      <td className="p-3 text-xs text-muted-foreground">
        {row.next_action_at ? formatDateTime(row.next_action_at) : "—"}
      </td>
      <td className="p-3 text-right">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={pending}
          onClick={() => startTransition(() => cancelEnrollment(row.id, sequenceId))}
          className="text-red-500 hover:text-red-600"
        >
          <X className="h-3.5 w-3.5 mr-1" /> Cancelar
        </Button>
      </td>
    </tr>
  );
}

export function EnrollmentsList({
  rows,
  sequenceId,
}: {
  rows: EnrollmentRow[];
  sequenceId: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        Ninguém inscrito nesta cadência no momento.
      </p>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-xs text-muted-foreground border-b border-white/10">
          <tr>
            <th className="text-left p-3 font-medium">Contato</th>
            <th className="text-center p-3 font-medium">Passo</th>
            <th className="text-left p-3 font-medium">Status</th>
            <th className="text-left p-3 font-medium">Próxima ação</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <EnrollmentRowItem key={r.id} row={r} sequenceId={sequenceId} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
