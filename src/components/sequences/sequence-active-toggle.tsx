"use client";

import { useTransition } from "react";
import { Badge } from "@/components/ui/badge";
import { toggleSequenceActive } from "@/app/app/cadencias/actions";

export function SequenceActiveToggle({
  sequenceId,
  isActive,
}: {
  sequenceId: string;
  isActive: boolean;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        startTransition(() => toggleSequenceActive(sequenceId, !isActive));
      }}
      title={isActive ? "Clique para pausar" : "Clique para ativar"}
      className="disabled:opacity-50"
    >
      <Badge variant={isActive ? "success" : "secondary"}>
        {pending ? "…" : isActive ? "Ativa" : "Pausada"}
      </Badge>
    </button>
  );
}
