"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const REAJUSTE_OPTIONS = [0, 0.05, 0.055, 0.0576, 0.058, 0.059, 0.06, 0.061, 0.065, 0.07, 0.08, 0.09, 0.1, 0.11, 0.12, 0.13, 0.14, 0.15];

export function TemplateSelector({
  proposalId,
  templates,
  currentTemplateId,
  currentReajustePct,
}: {
  proposalId: string;
  templates: Array<{ id: string; name: string }>;
  currentTemplateId: string | null;
  currentReajustePct: number;
}) {
  const router = useRouter();
  const [templateId, setTemplateId] = useState(currentTemplateId ?? "__none");
  const [reajuste, setReajuste] = useState(currentReajustePct);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/proposals/${proposalId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        template_id: templateId === "__none" ? null : templateId,
        reajuste_pct: reajuste,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error ?? "Erro ao salvar modelo.");
      return;
    }
    toast.success("Modelo aplicado — a proposta pública já mostra a tabela completa.");
    router.refresh();
  }

  if (templates.length === 0) {
    return (
      <p className="text-xs text-muted-foreground">
        Nenhum modelo importado ainda —{" "}
        <a href="/app/propostas/modelos" className="text-spotorange-500 hover:underline">
          importe um em Propostas → Modelos
        </a>
        .
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label className="text-xs">Modelo de tabela</Label>
        <Select value={templateId} onValueChange={setTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder="Nenhum (itens manuais)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">Nenhum (só itens manuais)</SelectItem>
            {templates.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {templateId !== "__none" && (
        <div className="space-y-1.5">
          <Label className="text-xs">Reajuste sobre a tabela base</Label>
          <Select value={String(reajuste)} onValueChange={(v) => setReajuste(Number(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REAJUSTE_OPTIONS.map((r) => (
                <SelectItem key={r} value={String(r)}>
                  {(r * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <Button variant="orange" size="sm" onClick={save} disabled={saving}>
        {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        Aplicar modelo
      </Button>
    </div>
  );
}
