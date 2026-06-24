"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  label = "Excluir",
  confirmText = "Tem certeza que deseja excluir? Esta ação não pode ser desfeita.",
}: {
  action: () => Promise<unknown> | void;
  label?: string;
  confirmText?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
        <span className="text-red-700 dark:text-red-300">{confirmText}</span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await action();
            })
          }
        >
          {pending ? "Excluindo…" : "Confirmar"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setConfirming(false)}
          disabled={pending}
        >
          Cancelar
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      onClick={() => setConfirming(true)}
      className="text-red-600 hover:bg-red-500/10 hover:text-red-700"
    >
      <Trash2 className="h-4 w-4" />
      {label}
    </Button>
  );
}
