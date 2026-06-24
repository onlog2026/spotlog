"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2, Mail, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RewriteButtons } from "@/components/propostas/ia/rewrite-buttons";
import {
  SuggestedItemsModal,
  type SuggestedItem,
} from "@/components/propostas/ia/suggested-items-modal";

export type AssistantPanelProps = {
  proposalId: string;
  initialIntro: string;
  initialScope: string;
  proposalTitle: string;
};

export function AssistantPanel({
  proposalId,
  initialIntro,
  initialScope,
  proposalTitle,
}: AssistantPanelProps) {
  const [intro, setIntro] = useState(initialIntro);
  const [scope, setScope] = useState(initialScope);
  const [saving, setSaving] = useState(false);

  const [followupOpen, setFollowupOpen] = useState(false);
  const [followupLoading, setFollowupLoading] = useState(false);
  const [followup, setFollowup] = useState<{ subject: string; body: string } | null>(null);
  const [followupFallback, setFollowupFallback] = useState<string | null>(null);

  const [itemsModalOpen, setItemsModalOpen] = useState(false);
  const [addedItemsCount, setAddedItemsCount] = useState(0);
  const [appliedItems, setAppliedItems] = useState<SuggestedItem[]>([]);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/proposals/${proposalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intro_text: intro, scope }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(data.error ?? "Não foi possível salvar.");
        return;
      }
      toast.success("Alterações salvas.");
    } catch {
      toast.error("Erro de rede ao salvar.");
    } finally {
      setSaving(false);
    }
  }

  async function generateFollowup() {
    setFollowupOpen(true);
    setFollowupLoading(true);
    setFollowup(null);
    setFollowupFallback(null);
    try {
      const res = await fetch("/api/ia/email-followup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proposalId }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        subject?: string;
        body?: string;
        error?: string;
        usedFallback?: boolean;
        fallbackReason?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "IA indisponível. Tente novamente.");
        setFollowupOpen(false);
        return;
      }
      setFollowup({ subject: data.subject ?? "", body: data.body ?? "" });
      if (data.usedFallback) {
        setFollowupFallback(
          "Mostrando rascunho padrão — IA indisponível no momento.",
        );
      }
    } catch {
      toast.error("Erro de rede ao gerar follow-up.");
      setFollowupOpen(false);
    } finally {
      setFollowupLoading(false);
    }
  }

  async function copyFollowup() {
    if (!followup) return;
    const full = `Assunto: ${followup.subject}\n\n${followup.body}`;
    try {
      await navigator.clipboard.writeText(full);
      toast.success("Follow-up copiado!");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  function applyItems(items: SuggestedItem[]) {
    setAppliedItems((prev) => [...prev, ...items]);
    setAddedItemsCount((c) => c + items.length);
    toast.success(
      `${items.length} ${items.length === 1 ? "item sugerido" : "itens sugeridos"} prontos pra revisão.`,
    );
  }

  async function copyItems() {
    if (appliedItems.length === 0) return;
    const text = appliedItems
      .map(
        (it) =>
          `• ${it.description} — ${it.quantity}× R$ ${it.unit_price.toFixed(2)}\n  ${it.justification}`,
      )
      .join("\n\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Itens copiados! Cole na sua proposta.");
    } catch {
      toast.error("Não foi possível copiar.");
    }
  }

  return (
    <div className="grid lg:grid-cols-[1fr_360px] gap-4">
      <div className="space-y-4">
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Introdução / contexto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="Texto de introdução da proposta..."
            />
            <RewriteButtons
              text={intro}
              onRewritten={(t) => setIntro(t)}
            />
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Escopo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={scope}
              onChange={(e) => setScope(e.target.value)}
              rows={8}
              className="font-mono text-xs"
              placeholder="Descreva o que está incluso no serviço..."
            />
            <RewriteButtons
              text={scope}
              onRewritten={(t) => setScope(t)}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            type="button"
            variant="orange"
            disabled={saving}
            onClick={save}
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {saving ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>

        {appliedItems.length > 0 ? (
          <Card className="border-white/10 bg-card/50">
            <CardHeader>
              <CardTitle className="flex items-center justify-between gap-2">
                <span>Itens sugeridos prontos pra revisar</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyItems}
                >
                  <Copy className="h-3 w-3" /> Copiar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {appliedItems.map((it, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-medium">{it.description}</div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap">
                      {it.quantity}× R$ {it.unit_price.toFixed(2)}
                    </div>
                  </div>
                  {it.justification ? (
                    <p className="text-xs text-muted-foreground mt-1">
                      {it.justification}
                    </p>
                  ) : null}
                </div>
              ))}
              <p className="text-xs text-muted-foreground">
                Esses itens são sugestões. Para adicioná-los oficialmente à
                proposta, copie e cole na tela de edição de itens.
              </p>
            </CardContent>
          </Card>
        ) : null}
      </div>

      <aside className="space-y-4">
        <Card className="border-white/10 bg-card/50 sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#BA0102]" />
              Assistente IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                Ações
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => setItemsModalOpen(true)}
              >
                <Sparkles className="h-3 w-3" />
                Sugerir itens com IA
                {addedItemsCount > 0 ? (
                  <span className="ml-auto text-xs text-muted-foreground">
                    +{addedItemsCount}
                  </span>
                ) : null}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full justify-start"
                disabled={followupLoading}
                onClick={generateFollowup}
              >
                {followupLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Mail className="h-3 w-3" />
                )}
                Gerar follow-up por e-mail
              </Button>
            </div>

            <div className="text-xs text-muted-foreground leading-relaxed">
              Use os botões de reescrita ao lado de cada bloco para deixar o
              texto mais curto, formal, persuasivo ou corrigir gramática.
            </div>
          </CardContent>
        </Card>
      </aside>

      <SuggestedItemsModal
        open={itemsModalOpen}
        onOpenChange={setItemsModalOpen}
        initialBriefing={`Proposta: ${proposalTitle}`}
        onApply={applyItems}
      />

      {/* Preview do follow-up: dialog inline simples */}
      {followupOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xl rounded-xl border border-white/10 bg-card p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold flex items-center gap-2">
                <Mail className="h-4 w-4 text-[#BA0102]" />
                Follow-up sugerido
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setFollowupOpen(false)}
              >
                Fechar
              </Button>
            </div>
            {followupLoading ? (
              <div className="py-8 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Gerando...
              </div>
            ) : followup ? (
              <div className="space-y-3">
                {followupFallback ? (
                  <div className="text-xs text-amber-400">{followupFallback}</div>
                ) : null}
                <div className="space-y-1.5">
                  <Label className="text-xs">Assunto</Label>
                  <Textarea
                    value={followup.subject}
                    onChange={(e) =>
                      setFollowup({ ...followup, subject: e.target.value })
                    }
                    rows={1}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Corpo</Label>
                  <Textarea
                    value={followup.body}
                    onChange={(e) =>
                      setFollowup({ ...followup, body: e.target.value })
                    }
                    rows={10}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="orange"
                    size="sm"
                    onClick={copyFollowup}
                  >
                    <Copy className="h-3 w-3" /> Copiar
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
