"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles } from "lucide-react";
import { AiGeneratorPanel, type GeneratedPayload } from "./ai-generator-panel";
import { ImageUploadField } from "./image-upload-field";

export type CaseFormInitial = {
  id?: string;
  client_name?: string;
  slug?: string;
  segment?: "ecommerce" | "farma" | "manipulacao" | "correlatos" | "dermo" | "outro";
  summary?: string | null;
  challenge_md?: string;
  solution_md?: string;
  results_md?: string;
  kpi_json?: Record<string, string>;
  logo_url?: string | null;
  hero_url?: string | null;
  status?: "rascunho" | "publicado" | "arquivado";
  seo_title?: string | null;
  seo_description?: string | null;
};

function kpiToRaw(kpis?: Record<string, string>) {
  if (!kpis) return "";
  return Object.entries(kpis)
    .map(([k, v]) => `${k}: ${v}`)
    .join("\n");
}

export function CaseForm({
  initial,
  action,
  excluirAction,
  submitLabel = "Salvar",
  enableAi = true,
}: {
  initial?: CaseFormInitial;
  action: (fd: FormData) => Promise<void>;
  excluirAction?: () => Promise<void>;
  submitLabel?: string;
  enableAi?: boolean;
}) {
  const [clientName, setClientName] = useState(initial?.client_name ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [segment, setSegment] = useState<CaseFormInitial["segment"]>(
    initial?.segment ?? "outro",
  );
  const [status, setStatus] = useState<"rascunho" | "publicado" | "arquivado">(
    initial?.status ?? "rascunho",
  );
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [challenge, setChallenge] = useState(initial?.challenge_md ?? "");
  const [solution, setSolution] = useState(initial?.solution_md ?? "");
  const [results, setResults] = useState(initial?.results_md ?? "");
  const [kpiRaw, setKpiRaw] = useState(kpiToRaw(initial?.kpi_json));
  const [logoUrl, setLogoUrl] = useState(initial?.logo_url ?? "");
  const [heroUrl, setHeroUrl] = useState(initial?.hero_url ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seo_title ?? "");
  const [seoDesc, setSeoDesc] = useState(initial?.seo_description ?? "");
  const [aiBanner, setAiBanner] = useState(false);

  function applyAi(data: GeneratedPayload) {
    if (data.summary) setSummary(data.summary);
    if (data.challenge_md) setChallenge(data.challenge_md);
    if (data.solution_md) setSolution(data.solution_md);
    if (data.results_md) setResults(data.results_md);
    if (data.kpi_json) setKpiRaw(kpiToRaw(data.kpi_json));
    if (data.cover_url) setHeroUrl(data.cover_url);
    if (data.seo_title) setSeoTitle(data.seo_title);
    if (data.seo_description) setSeoDesc(data.seo_description);
    setAiBanner(true);
  }

  return (
    <div className="space-y-6">
      {enableAi ? (
        <AiGeneratorPanel
          type="case"
          defaultSegment={segment}
          onGenerated={applyAi}
        />
      ) : null}

      {aiBanner ? (
        <div className="rounded-lg border border-spotorange-500/40 bg-spotorange-500/10 text-spotorange-200 px-4 py-3 text-sm flex items-center gap-2">
          <Sparkles className="h-4 w-4" />
          Case gerado por IA — revise nome do cliente, KPIs e textos antes de publicar.
        </div>
      ) : null}

      <form action={action} className="space-y-6">
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="client_name">Nome do cliente *</Label>
                  <Input
                    id="client_name"
                    name="client_name"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="slug">Slug (opcional)</Label>
                  <Input
                    id="slug"
                    name="slug"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="summary">Resumo (1-2 linhas)</Label>
                  <Textarea
                    id="summary"
                    name="summary"
                    rows={2}
                    value={summary ?? ""}
                    onChange={(e) => setSummary(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Desafio, Solução, Resultados</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="challenge_md">Desafio (Markdown)</Label>
                  <Textarea
                    id="challenge_md"
                    name="challenge_md"
                    rows={6}
                    value={challenge}
                    onChange={(e) => setChallenge(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="solution_md">Solução (Markdown)</Label>
                  <Textarea
                    id="solution_md"
                    name="solution_md"
                    rows={6}
                    value={solution}
                    onChange={(e) => setSolution(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <div>
                  <Label htmlFor="results_md">Resultados (Markdown)</Label>
                  <Textarea
                    id="results_md"
                    name="results_md"
                    rows={6}
                    value={results}
                    onChange={(e) => setResults(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">KPIs</CardTitle>
              </CardHeader>
              <CardContent>
                <Label htmlFor="kpi_json_raw">
                  Um por linha no formato <code className="text-xs">chave: valor</code>
                </Label>
                <Textarea
                  id="kpi_json_raw"
                  name="kpi_json_raw"
                  rows={5}
                  value={kpiRaw}
                  onChange={(e) => setKpiRaw(e.target.value)}
                  className="font-mono text-sm"
                  placeholder={"SLA: 98%\nEntregas: +30%\nNPS: 84"}
                />
                <p className="text-xs text-muted-foreground mt-2">
                  Também aceita JSON: <code>{`{"SLA": "98%"}`}</code>
                </p>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">SEO</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="seo_title">SEO Title</Label>
                  <Input
                    id="seo_title"
                    name="seo_title"
                    value={seoTitle ?? ""}
                    onChange={(e) => setSeoTitle(e.target.value)}
                    maxLength={200}
                  />
                </div>
                <div>
                  <Label htmlFor="seo_description">SEO Description</Label>
                  <Textarea
                    id="seo_description"
                    name="seo_description"
                    rows={2}
                    value={seoDesc ?? ""}
                    onChange={(e) => setSeoDesc(e.target.value)}
                    maxLength={300}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Publicação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as typeof status)}
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="rascunho">Rascunho</option>
                    <option value="publicado">Publicado</option>
                    <option value="arquivado">Arquivado</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="segment">Segmento</Label>
                  <select
                    id="segment"
                    name="segment"
                    value={segment}
                    onChange={(e) =>
                      setSegment(e.target.value as CaseFormInitial["segment"])
                    }
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                  >
                    <option value="ecommerce">E-commerce</option>
                    <option value="farma">Farma</option>
                    <option value="manipulacao">Manipulação</option>
                    <option value="correlatos">Correlatos</option>
                    <option value="dermo">Dermo</option>
                    <option value="outro">Outro</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Logo do cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  id="logo_url"
                  name="logo_url"
                  value={logoUrl ?? ""}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://..."
                />
                <ImageUploadField
                  currentUrl={logoUrl ?? undefined}
                  onUploaded={(url) => setLogoUrl(url)}
                  onClear={() => setLogoUrl("")}
                  folder="cases/logos"
                  label="Enviar logo"
                />
                {logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoUrl}
                    alt="logo"
                    className="w-full h-24 object-contain rounded-md border border-white/10 bg-white p-2"
                  />
                ) : (
                  <div className="w-full h-24 grid place-items-center rounded-md border border-dashed border-white/10 text-xs text-muted-foreground">
                    Sem logo
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-white/10 bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Imagem hero</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  id="hero_url"
                  name="hero_url"
                  value={heroUrl ?? ""}
                  onChange={(e) => setHeroUrl(e.target.value)}
                  placeholder="https://..."
                />
                <ImageUploadField
                  currentUrl={heroUrl ?? undefined}
                  onUploaded={(url) => setHeroUrl(url)}
                  onClear={() => setHeroUrl("")}
                  folder="cases/hero"
                  label="Enviar hero"
                />
                {heroUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={heroUrl}
                    alt="hero"
                    className="w-full h-32 object-cover rounded-md border border-white/10"
                  />
                ) : (
                  <div className="w-full h-32 grid place-items-center rounded-md border border-dashed border-white/10 text-xs text-muted-foreground">
                    Sem hero
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div>
            {excluirAction ? (
              <form action={excluirAction}>
                <Button type="submit" variant="outline" className="text-red-500 hover:text-red-600">
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  Excluir case
                </Button>
              </form>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" asChild>
              <Link href="/app/cms/cases">Cancelar</Link>
            </Button>
            <Button type="submit">{submitLabel}</Button>
          </div>
        </div>
      </form>
    </div>
  );
}
