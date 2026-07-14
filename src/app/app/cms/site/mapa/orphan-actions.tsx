"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Trash2, EyeOff } from "lucide-react";
import { excluirOrfao, desativarOrfao } from "./actions";

/** Botões Excluir/Desativar de um card órfão, com confirmação (regra do dono). */
export function OrphanActions({ id, label, active }: { id: string; label: string; active: boolean }) {
  const [pending, start] = useTransition();

  const run = (fn: (id: string) => Promise<void>, ok: string) =>
    start(async () => {
      try {
        await fn(id);
        toast.success(ok);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha");
      }
    });

  return (
    <div className="flex items-center gap-2">
      {active && (
        <button
          type="button"
          disabled={pending}
          onClick={() => run(desativarOrfao, "Card desativado")}
          className="inline-flex items-center gap-1 rounded-md border border-white/15 px-2.5 py-1.5 text-xs hover:bg-white/5"
        >
          <EyeOff className="h-3 w-3" /> Desativar
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!window.confirm(`Excluir DE VEZ o card "${label}"? Não dá pra desfazer.`)) return;
          run(excluirOrfao, "Card excluído");
        }}
        className="inline-flex items-center gap-1 rounded-md border border-red-500/40 text-red-400 px-2.5 py-1.5 text-xs hover:bg-red-500/10"
      >
        {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />} Excluir
      </button>
    </div>
  );
}
