"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2 } from "lucide-react";
import { excluirFluxo, setFlowStatus } from "@/lib/flows/actions";

export function DeleteFlowButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  function onClick() {
    if (!window.confirm("Excluir este fluxo? Não dá pra desfazer.")) return;
    const fd = new FormData();
    fd.set("id", id);
    start(async () => {
      try {
        await excluirFluxo(fd);
        toast.success("Fluxo excluído");
      } catch (e) {
        const m = e instanceof Error ? e.message : "Falha";
        if (!/NEXT_REDIRECT/.test(m)) toast.error(m);
      }
    });
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="text-red-400 hover:text-red-300 inline-flex items-center gap-1"
    >
      {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
      Excluir
    </button>
  );
}

export function FlowStatusToggle({
  id,
  status,
}: {
  id: string;
  status: "draft" | "active" | "paused";
}) {
  const [pending, start] = useTransition();
  const next = status === "active" ? "paused" : "active";
  function onClick() {
    start(async () => {
      try {
        await setFlowStatus(id, next);
        toast.success(next === "active" ? "Fluxo ativado" : "Fluxo pausado");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha");
      }
    });
  }
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={
        "rounded-md px-3 py-1.5 text-xs font-semibold " +
        (status === "active"
          ? "border border-amber-500/40 text-amber-300 hover:bg-amber-500/10"
          : "bg-emerald-600 hover:bg-emerald-500 text-white")
      }
    >
      {pending ? "..." : status === "active" ? "Pausar" : "Ativar"}
    </button>
  );
}
