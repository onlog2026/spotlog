"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { REWRITE_LABELS, REWRITE_MODES, type RewriteMode } from "@/lib/ai/rewrite-types";

export type RewriteButtonsProps = {
  /** Texto atual sendo editado. */
  text: string;
  /** Callback após reescrita aplicada com sucesso. */
  onRewritten: (newText: string) => void;
  /** Modos a exibir (default: todos). */
  modes?: RewriteMode[];
  /** Desabilita os botões quando o texto está vazio ou loading externo. */
  disabled?: boolean;
};

export function RewriteButtons({
  text,
  onRewritten,
  modes = REWRITE_MODES,
  disabled = false,
}: RewriteButtonsProps) {
  const [loadingMode, setLoadingMode] = useState<RewriteMode | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(mode: RewriteMode) {
    if (!text.trim()) {
      setError("Digite algum texto antes de reescrever.");
      return;
    }
    setLoadingMode(mode);
    setError(null);
    try {
      const res = await fetch("/api/ia/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, mode }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        text?: string;
        error?: string;
        usedFallback?: boolean;
      };
      if (!res.ok) {
        setError(
          data.error ??
            "IA indisponível. Tente novamente em alguns segundos.",
        );
        return;
      }
      if (typeof data.text === "string") {
        onRewritten(data.text);
        if (data.usedFallback) {
          setError(
            "IA indisponível no momento. Texto não foi alterado.",
          );
        }
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoadingMode(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => (
          <Button
            key={mode}
            type="button"
            variant="outline"
            size="sm"
            disabled={disabled || loadingMode !== null}
            onClick={() => run(mode)}
          >
            {loadingMode === mode ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            {REWRITE_LABELS[mode]}
          </Button>
        ))}
      </div>
      {error ? (
        <div className="text-xs text-destructive">{error}</div>
      ) : null}
    </div>
  );
}
