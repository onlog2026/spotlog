"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RewriteButtons } from "@/components/propostas/ia/rewrite-buttons";

export type BriefingFormProps = {
  contacts: Array<{ id: string; full_name: string; email: string | null }>;
  companies: Array<{ id: string; name: string }>;
  priceTables: Array<{ id: string; name: string; currency: string }>;
};

type Section = {
  key: string;
  label: string;
  body: string;
};

/**
 * Extrai seções markdown (## Heading) de um texto em seções editáveis.
 * Se não houver headings, devolve uma seção única "Rascunho".
 */
function splitMarkdownSections(markdown: string): Section[] {
  const lines = markdown.split("\n");
  const sections: Section[] = [];
  let current: Section | null = null;
  for (const line of lines) {
    const h2 = line.match(/^##\s+(.+)$/);
    if (h2) {
      if (current) sections.push(current);
      const label = h2[1].trim();
      current = { key: label.toLowerCase().replace(/\s+/g, "-"), label, body: "" };
    } else if (current) {
      current.body += (current.body ? "\n" : "") + line;
    } else {
      // pré-cabeçalho — junta numa intro
      current = { key: "intro", label: "Introdução", body: line };
    }
  }
  if (current) sections.push(current);
  return sections
    .map((s) => ({ ...s, body: s.body.trim() }))
    .filter((s) => s.body.length > 0 || s.label.length > 0);
}

function sectionsToMarkdown(sections: Section[]): string {
  return sections.map((s) => `## ${s.label}\n${s.body}`).join("\n\n");
}

export function BriefingForm({
  contacts,
  companies,
  priceTables,
}: BriefingFormProps) {
  const router = useRouter();
  const [briefing, setBriefing] = useState("");
  const [contactId, setContactId] = useState("");
  const [companyId, setCompanyId] = useState("");
  const [priceTableId, setPriceTableId] = useState(priceTables[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [fallbackNotice, setFallbackNotice] = useState<string | null>(null);

  async function generate() {
    if (briefing.trim().length < 10) {
      toast.error("Descreva o briefing com pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    setFallbackNotice(null);
    try {
      const res = await fetch("/api/ia/proposta-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          briefing,
          contactId: contactId || undefined,
          companyId: companyId || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        markdown?: string;
        error?: string;
        usedFallback?: boolean;
      };
      if (!res.ok) {
        toast.error(data.error ?? "IA indisponível. Tente novamente.");
        return;
      }
      const parts = splitMarkdownSections(data.markdown ?? "");
      setSections(parts);
      if (!title) {
        const company = companies.find((c) => c.id === companyId);
        const contact = contacts.find((c) => c.id === contactId);
        setTitle(
          company
            ? `Proposta comercial — ${company.name}`
            : contact
              ? `Proposta comercial — ${contact.full_name}`
              : "Proposta comercial",
        );
      }
      if (data.usedFallback) {
        setFallbackNotice(
          "Mostrando esqueleto padrão — IA indisponível no momento. Edite à vontade.",
        );
      }
    } catch {
      toast.error("Erro de rede ao gerar a proposta.");
    } finally {
      setLoading(false);
    }
  }

  function updateSection(i: number, body: string) {
    setSections(sections.map((s, idx) => (idx === i ? { ...s, body } : s)));
  }

  async function createProposal() {
    if (!title.trim()) {
      toast.error("Informe um título para a proposta.");
      return;
    }
    if (sections.length === 0) {
      toast.error("Gere o rascunho com a IA antes de criar a proposta.");
      return;
    }
    const introSection = sections[0];
    const scopeSection =
      sections.find((s) => /escopo/i.test(s.label)) ?? null;
    const introBody = sectionsToMarkdown(
      scopeSection
        ? sections.filter((s) => s !== scopeSection)
        : sections,
    );
    setCreating(true);
    try {
      // Cria com 1 item placeholder pra atender o schema (subtotal/total > 0 não é obrigatório, mas items.min(1) é)
      const placeholderItem = {
        name: "Serviço Spotlog (a detalhar)",
        description: "Item gerado por IA — ajuste valor e quantidade na próxima etapa.",
        quantity: 1,
        unit_price: 0,
        discount_pct: 0,
      };
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price_table_id: priceTableId || null,
          contact_id: contactId || null,
          company_id: companyId || null,
          intro_text: introBody || introSection?.body || "",
          scope: scopeSection?.body ?? "",
          payment_terms: "À vista no aceite, via PIX ou boleto.",
          delivery_terms: "Início em até 5 dias úteis após o aceite.",
          validity_days: 15,
          discount_pct: 0,
          items: [placeholderItem],
          subtotal: 0,
          total: 0,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        id?: string;
        error?: string;
      };
      if (!res.ok || !data.id) {
        toast.error(data.error ?? "Erro ao criar proposta.");
        return;
      }
      toast.success("Proposta criada! Ajuste os itens e o valor.");
      router.push(`/app/propostas/${data.id}`);
    } catch {
      toast.error("Erro de rede ao criar a proposta.");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#BA0102]" />
            Briefing do cliente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa</Label>
              <Select value={companyId} onValueChange={setCompanyId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Contato</Label>
              <Select value={contactId} onValueChange={setContactId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">
              Briefing — o que o cliente pediu, qual a dor, contexto
            </Label>
            <Textarea
              value={briefing}
              onChange={(e) => setBriefing(e.target.value)}
              placeholder="Ex: e-commerce de cosméticos com 200 pedidos/mês em São Paulo. Está perdendo cliente por falta de visibilidade da entrega. Quer integração com Shopify e painel próprio."
              rows={6}
            />
          </div>

          <Button
            type="button"
            variant="orange"
            disabled={loading}
            onClick={generate}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Gerando rascunho..." : "Gerar rascunho com IA"}
          </Button>

          {fallbackNotice ? (
            <div className="text-xs text-amber-400">{fallbackNotice}</div>
          ) : null}
        </CardContent>
      </Card>

      {sections.length > 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Rascunho — edite cada seção</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Título da proposta *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Proposta comercial — Cliente Acme"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Tabela de preço (opcional)</Label>
                <Select value={priceTableId} onValueChange={setPriceTableId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {priceTables.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {sections.map((s, i) => (
                <div
                  key={`${s.key}-${i}`}
                  className="space-y-2 rounded-lg border border-white/10 bg-white/[0.03] p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <Label className="text-xs font-semibold">{s.label}</Label>
                  </div>
                  <Textarea
                    value={s.body}
                    onChange={(e) => updateSection(i, e.target.value)}
                    rows={6}
                    className="font-mono text-xs"
                  />
                  <RewriteButtons
                    text={s.body}
                    onRewritten={(t) => updateSection(i, t)}
                  />
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
              <Button
                type="button"
                variant="orange"
                disabled={creating}
                onClick={createProposal}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {creating ? "Criando..." : "Criar proposta com esse rascunho"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Depois de criada, você ajusta os itens, o valor e envia para o
              cliente.
            </p>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
