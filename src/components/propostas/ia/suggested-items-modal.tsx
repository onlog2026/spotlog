"use client";

import { useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

export type SuggestedItem = {
  description: string;
  quantity: number;
  unit_price: number;
  justification: string;
};

export type SuggestedItemsModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Briefing pré-preenchido (opcional). */
  initialBriefing?: string;
  /** Chamado quando o usuário confirma os itens selecionados. */
  onApply: (items: SuggestedItem[]) => void;
};

export function SuggestedItemsModal({
  open,
  onOpenChange,
  initialBriefing = "",
  onApply,
}: SuggestedItemsModalProps) {
  const [briefing, setBriefing] = useState(initialBriefing);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SuggestedItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  async function suggest() {
    if (briefing.trim().length < 10) {
      setError("Descreva o briefing com pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    setError(null);
    setFallbackNotice(null);
    try {
      const res = await fetch("/api/ia/proposta-itens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ briefing }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        items?: SuggestedItem[];
        error?: string;
        usedFallback?: boolean;
      };
      if (!res.ok) {
        setError(data.error ?? "IA indisponível. Tente novamente.");
        return;
      }
      const list = data.items ?? [];
      setItems(list);
      setSelected(new Set(list.map((_, i) => i)));
      if (data.usedFallback) {
        setFallbackNotice(
          "Mostrando sugestão padrão — IA indisponível no momento.",
        );
      }
    } catch {
      setError("Erro de rede. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  function toggle(i: number) {
    const next = new Set(selected);
    if (next.has(i)) next.delete(i);
    else next.add(i);
    setSelected(next);
  }

  function apply() {
    const chosen = items.filter((_, i) => selected.has(i));
    onApply(chosen);
    onOpenChange(false);
  }

  function handleClose(value: boolean) {
    onOpenChange(value);
    if (!value) {
      // mantém o briefing pra reuso, mas limpa o resto
      setItems([]);
      setSelected(new Set());
      setError(null);
      setFallbackNotice(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#BA0102]" />
            Sugerir itens com IA
          </DialogTitle>
          <DialogDescription>
            Descreva rapidamente o que o cliente precisa. A IA sugere itens com
            preço estimado — você confirma e ajusta depois.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Briefing</Label>
            <Textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="Ex: cliente de cosméticos faz 200 entregas/mês em São Paulo capital, precisa de painel próprio e integração via API com a Shopify."
              rows={4}
            />
          </div>

          <Button
            type="button"
            variant="orange"
            size="sm"
            disabled={loading}
            onClick={suggest}
          >
            {loading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            {loading ? "Sugerindo..." : "Sugerir itens"}
          </Button>

          {error ? (
            <div className="text-xs text-destructive">{error}</div>
          ) : null}
          {fallbackNotice ? (
            <div className="text-xs text-amber-400">{fallbackNotice}</div>
          ) : null}

          {items.length > 0 ? (
            <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
              {items.map((it, i) => (
                <label
                  key={i}
                  className="flex items-start gap-3 rounded-lg border border-white/10 bg-white/5 p-3 cursor-pointer hover:bg-white/10 transition"
                >
                  <Checkbox
                    checked={selected.has(i)}
                    onCheckedChange={() => toggle(i)}
                    className="mt-1"
                  />
                  <div className="flex-1 space-y-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium text-sm">{it.description}</div>
                      <div className="text-xs text-muted-foreground whitespace-nowrap">
                        {it.quantity}× {formatCurrency(it.unit_price, "BRL")}
                      </div>
                    </div>
                    {it.justification ? (
                      <p className="text-xs text-muted-foreground">
                        {it.justification}
                      </p>
                    ) : null}
                  </div>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => handleClose(false)}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="orange"
            disabled={items.length === 0 || selected.size === 0}
            onClick={apply}
          >
            Adicionar {selected.size > 0 ? `(${selected.size})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
