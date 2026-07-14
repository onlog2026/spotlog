"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { setEnforcement } from "./actions";

/**
 * Interruptor mestre do controle de acesso por cliente (Eixo A).
 * DESLIGADO: liberações por org ficam salvas mas não bloqueiam.
 * LIGADO: cada cliente vê só os módulos que você liberou.
 */
export function EnforcementToggle({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    if (next && !confirm(
      "Ligar o controle de acesso por cliente?\n\n" +
      "A partir de agora, cada organização vai ver SÓ os módulos que você liberou na tela dela. " +
      "As orgs existentes já foram liberadas em tudo, então nada some agora — você restringe cada cliente quando quiser.",
    )) return;
    startTransition(async () => {
      try {
        await setEnforcement(next);
        setOn(next);
        toast.success(next ? "Controle de acesso LIGADO." : "Controle de acesso desligado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao alternar.");
      }
    });
  }

  return (
    <div
      className={`rounded-lg border p-4 flex items-start justify-between gap-4 ${
        on ? "border-emerald-500/40 bg-emerald-500/5" : "border-amber-500/40 bg-amber-500/5"
      }`}
    >
      <div className="flex items-start gap-3">
        {on ? (
          <ShieldCheck className="h-5 w-5 text-emerald-400 mt-0.5 shrink-0" />
        ) : (
          <ShieldAlert className="h-5 w-5 text-amber-400 mt-0.5 shrink-0" />
        )}
        <div>
          <div className="font-semibold">
            Controle de acesso por cliente:{" "}
            <span className={on ? "text-emerald-400" : "text-amber-400"}>
              {on ? "LIGADO" : "DESLIGADO"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            {on
              ? "Cada organização vê só os módulos que você liberou na tela dela. Restrinja um cliente em Organizações → abrir a org → Módulos."
              : "As liberações por organização ficam salvas, mas ainda NÃO bloqueiam nada. Ligue para os limites por cliente passarem a valer."}
          </p>
        </div>
      </div>
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        className={`shrink-0 inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition ${
          on
            ? "bg-white/10 hover:bg-white/15 text-foreground"
            : "bg-emerald-600 hover:bg-emerald-500 text-white"
        }`}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {on ? "Desligar" : "Ligar controle"}
      </button>
    </div>
  );
}
