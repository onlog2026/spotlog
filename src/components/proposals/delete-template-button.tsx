"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteProposalTemplate } from "@/app/app/propostas/modelos/actions";

export function DeleteTemplateButton({ templateId }: { templateId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, start] = useTransition();

  if (confirming) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
        <span className="text-red-500">Excluir este modelo e todos os dados dele?</span>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          disabled={pending}
          onClick={() => start(() => deleteProposalTemplate(templateId))}
        >
          {pending ? "Excluindo…" : "Confirmar"}
        </Button>
        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirming(false)}>
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
      className="text-red-500 hover:bg-red-500/10 hover:text-red-600"
    >
      <Trash2 className="h-4 w-4" /> Excluir modelo
    </Button>
  );
}
