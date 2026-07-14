"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Save, Zap } from "lucide-react";
import { setFlowTrigger } from "@/lib/flows/actions";

/**
 * Editor do gatilho do fluxo: palavras que fazem o robô responder + opção
 * "pega tudo" (catch-all). O motor usa isso pra escolher qual fluxo dispara.
 */
export function TriggerEditor({
  flowId,
  keywords,
  catchAll,
}: {
  flowId: string;
  keywords: string[];
  catchAll: boolean;
}) {
  const [kw, setKw] = useState(keywords.join(", "));
  const [all, setAll] = useState(catchAll);
  const [pending, start] = useTransition();

  function save() {
    const list = kw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    start(async () => {
      try {
        await setFlowTrigger(flowId, list, all);
        toast.success("Gatilho salvo");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao salvar gatilho");
      }
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-card/50 p-4 space-y-3">
      <div className="flex items-center gap-2 text-sm font-semibold">
        <Zap className="h-4 w-4 text-amber-400" /> Quando o robô deve responder?
      </div>

      <div className="space-y-1">
        <label className="text-[11px] text-muted-foreground">
          Palavras-gatilho (separe por vírgula). Se a mensagem do cliente contém
          uma delas, este fluxo dispara.
        </label>
        <input
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          placeholder="orçamento, frete, quero, preço"
          className="w-full rounded-md bg-white/5 border border-white/10 px-3 py-2 text-sm"
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={all}
          onChange={(e) => setAll(e.target.checked)}
          className="mt-0.5"
        />
        <span>
          <strong className="text-foreground">Pega tudo (catch-all).</strong>{" "}
          Responde qualquer mensagem que não casar com outro fluxo por
          palavra-chave. Use em no máximo 1 fluxo.
        </span>
      </label>

      <button
        type="button"
        onClick={save}
        disabled={pending}
        className="rounded-md bg-[#BA0102] hover:bg-[#a10002] text-white text-xs font-semibold px-3 py-2 inline-flex items-center gap-2"
      >
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Save className="h-3 w-3" />
        )}
        Salvar gatilho
      </button>
    </div>
  );
}
