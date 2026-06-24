"use client";
import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  excluirCampanha,
  reexecutarCampanha,
} from "@/lib/prospeccao/actions";

export function DeleteCampaignButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    if (
      !window.confirm(
        "Excluir essa campanha apaga todos os resultados. Confirma?",
      )
    )
      return;
    const fd = new FormData();
    fd.set("id", id);
    start(async () => {
      try {
        await excluirCampanha(fd);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha";
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={pending}
      className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
    >
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <Trash2 className="h-3 w-3" />
      )}
      Excluir
    </Button>
  );
}

export function RerunCampaignButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    const fd = new FormData();
    fd.set("id", id);
    start(async () => {
      try {
        await reexecutarCampanha(fd);
        toast.success("Reexecução iniciada");
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Falha";
        if (!/NEXT_REDIRECT/.test(msg)) toast.error(msg);
      }
    });
  }
  return (
    <Button variant="ghost" size="sm" onClick={onClick} disabled={pending}>
      {pending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <RefreshCw className="h-3 w-3" />
      )}
      Reexecutar
    </Button>
  );
}
