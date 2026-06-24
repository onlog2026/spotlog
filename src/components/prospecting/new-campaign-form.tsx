"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Sparkles, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

type Sequence = { id: string; name: string };

export function NewCampaignForm({
  sequences,
  availableSources,
}: {
  sequences: Sequence[];
  availableSources: string[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    industries: "",
    titles: "",
    seniorities: "",
    cities: "",
    states: "",
    keywords: "",
    company_sizes: "",
    daily_limit: 50,
    total_target: 500,
    sequence_id: "",
    auto_enroll: false,
    ai_persona: "",
    sources: availableSources,
  });

  function toggleSource(s: string) {
    setForm((f) => ({
      ...f,
      sources: f.sources.includes(s)
        ? f.sources.filter((x) => x !== s)
        : [...f.sources, s],
    }));
  }

  async function submit(start: boolean) {
    setLoading(true);
    const icp = {
      industries: split(form.industries),
      titles: split(form.titles),
      seniorities: split(form.seniorities),
      cities: split(form.cities),
      states: split(form.states),
      company_sizes: split(form.company_sizes),
      keywords: split(form.keywords),
    };
    const body = {
      name: form.name,
      icp,
      sources: form.sources,
      daily_limit: form.daily_limit,
      total_target: form.total_target,
      sequence_id: form.sequence_id || null,
      auto_enroll: form.auto_enroll,
      ai_persona: form.ai_persona,
      start,
    };

    const res = await fetch("/api/prospecting/campaigns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setLoading(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast.error(data.error ?? "Erro ao criar campanha");
      return;
    }
    toast.success(start ? "Campanha iniciada!" : "Rascunho salvo");
    router.push(`/app/prospeccao/${data.id}`);
    router.refresh();
  }

  const noSources = availableSources.length === 0;

  return (
    <div className="space-y-6">
      {noSources && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardContent className="p-4 flex gap-3 items-start">
            <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm">
                Nenhuma fonte de prospecção conectada
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Pra rodar a campanha automaticamente, conecte Apollo ou Google
                Places em{" "}
                <Link href="/app/admin/integracoes" className="text-brand-400 underline">
                  Integrações
                </Link>
                . Você pode criar o rascunho agora e ativar depois.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field label="Nome da campanha *">
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Diretores de marketing em SaaS Brasil"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            ICP — Perfil de cliente ideal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Field
            label="Setores"
            hint="Separe por vírgula. Ex: SaaS, E-commerce, Saúde"
          >
            <Input
              value={form.industries}
              onChange={(e) => setForm({ ...form, industries: e.target.value })}
              placeholder="SaaS, Marketing, Educação"
            />
          </Field>
          <Field
            label="Cargos do decisor"
            hint="Ex: Diretor Comercial, Head of Sales, CMO"
          >
            <Input
              value={form.titles}
              onChange={(e) => setForm({ ...form, titles: e.target.value })}
              placeholder="Diretor Comercial, Head of Sales, CMO"
            />
          </Field>
          <Field label="Senioridade">
            <Input
              value={form.seniorities}
              onChange={(e) =>
                setForm({ ...form, seniorities: e.target.value })
              }
              placeholder="director, vp, c_suite"
            />
          </Field>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Cidades">
              <Input
                value={form.cities}
                onChange={(e) => setForm({ ...form, cities: e.target.value })}
                placeholder="São Paulo, Rio de Janeiro"
              />
            </Field>
            <Field label="Estados">
              <Input
                value={form.states}
                onChange={(e) => setForm({ ...form, states: e.target.value })}
                placeholder="SP, RJ"
              />
            </Field>
          </div>
          <Field label="Tamanho da empresa">
            <Input
              value={form.company_sizes}
              onChange={(e) =>
                setForm({ ...form, company_sizes: e.target.value })
              }
              placeholder="11-50, 51-200, 201-500"
            />
          </Field>
          <Field
            label="Palavras-chave"
            hint="Termos no perfil/site que indicam fit. Ex: outbound, prospecção, growth"
          >
            <Input
              value={form.keywords}
              onChange={(e) => setForm({ ...form, keywords: e.target.value })}
              placeholder="growth, outbound, sales-led"
            />
          </Field>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Fontes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {["apollo", "google_places"].map((s) => {
            const enabled = availableSources.includes(s);
            const on = form.sources.includes(s);
            return (
              <label
                key={s}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  enabled
                    ? "border-white/10 hover:bg-white/5 cursor-pointer"
                    : "border-white/5 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={on}
                    disabled={!enabled}
                    onCheckedChange={() => toggleSource(s)}
                  />
                  <div>
                    <div className="font-medium text-sm capitalize">
                      {s.replace("_", " ")}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {s === "apollo"
                        ? "275M+ decisores B2B"
                        : "Negócios locais no Google Maps"}
                    </div>
                  </div>
                </div>
                {!enabled && (
                  <Badge variant="outline" className="text-[10px]">
                    Não conectado
                  </Badge>
                )}
              </label>
            );
          })}
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Volume e cadência</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Meta total de leads">
              <Input
                type="number"
                value={form.total_target}
                onChange={(e) =>
                  setForm({
                    ...form,
                    total_target: Number(e.target.value) || 0,
                  })
                }
              />
            </Field>
            <Field label="Limite por dia">
              <Input
                type="number"
                value={form.daily_limit}
                onChange={(e) =>
                  setForm({ ...form, daily_limit: Number(e.target.value) || 0 })
                }
              />
            </Field>
          </div>
          <Field label="Cadência a inscrever os leads (opcional)">
            <Select
              value={form.sequence_id || "__none"}
              onValueChange={(v) => setForm({ ...form, sequence_id: v === "__none" ? "" : v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Não inscrever automaticamente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">Não inscrever automaticamente</SelectItem>
                {sequences.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={form.auto_enroll}
              onCheckedChange={(c) =>
                setForm({ ...form, auto_enroll: c === true })
              }
            />
            Inscrever na cadência automaticamente assim que o lead for
            enriquecido
          </label>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-brand-400" />
            Persona do agente IA
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            rows={4}
            value={form.ai_persona}
            onChange={(e) => setForm({ ...form, ai_persona: e.target.value })}
            placeholder={`Ex: "Sou consultor da Acme, ajudamos times comerciais B2B a triplicar reuniões via automação. Tom direto, sem floreios. Cita um insight do segmento do prospect e propõe 15min."`}
          />
          <p className="text-xs text-muted-foreground mt-2">
            Essa persona vira o prompt usado pela IA pra personalizar cada
            mensagem da cadência.
          </p>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 justify-end">
        <Button variant="ghost" onClick={() => submit(false)} disabled={loading}>
          Salvar rascunho
        </Button>
        <Button
          variant="orange"
          onClick={() => submit(true)}
          disabled={loading || !form.name || noSources}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar e iniciar
        </Button>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function split(s: string) {
  return s
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
}
