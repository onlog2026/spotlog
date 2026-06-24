"use client";
import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Trash2, Sparkles, Loader2, ImageOff } from "lucide-react";
import { ImageUploadField } from "./image-upload-field";

export type SiteCardInitial = {
  id?: string;
  page?: string;
  section?: string;
  slot?: string;
  title?: string | null;
  description?: string | null;
  image_url?: string | null;
  cta_label?: string | null;
  cta_url?: string | null;
  active?: boolean;
  sort?: number;
};

const STYLES = [
  { value: "hiperrealista", label: "Hiperrealista (foto)" },
  { value: "explicativa", label: "Explicativa (infográfico)" },
  { value: "persuasiva", label: "Persuasiva (cinematográfica)" },
  { value: "blog", label: "Blog (editorial)" },
  { value: "minimalista", label: "Minimalista (limpo)" },
  { value: "corporativa", label: "Corporativa (business)" },
];

export function SiteCardForm({
  initial,
  action,
  excluirAction,
  submitLabel = "Salvar",
}: {
  initial?: SiteCardInitial;
  action: (fd: FormData) => Promise<void>;
  excluirAction?: () => Promise<void>;
  submitLabel?: string;
}) {
  const [page, setPage] = useState(initial?.page ?? "home");
  const [section, setSection] = useState(initial?.section ?? "");
  const [slot, setSlot] = useState(initial?.slot ?? "");
  const [title, setTitle] = useState(initial?.title ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.image_url ?? "");
  const [ctaLabel, setCtaLabel] = useState(initial?.cta_label ?? "");
  const [ctaUrl, setCtaUrl] = useState(initial?.cta_url ?? "");
  const [active, setActive] = useState(initial?.active ?? true);
  const [sort, setSort] = useState(initial?.sort ?? 0);

  // IA image
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiStyle, setAiStyle] = useState("hiperrealista");
  const [aiBusy, setAiBusy] = useState(false);
  const [aiErr, setAiErr] = useState<string | null>(null);

  async function generateImage() {
    setAiErr(null);
    if (aiPrompt.trim().length < 5) {
      setAiErr("Descreva a imagem com pelo menos 5 caracteres.");
      return;
    }
    setAiBusy(true);
    try {
      const res = await fetch("/api/cms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "image",
          prompt: aiPrompt,
          imageStyle: aiStyle,
          width: 1200,
          height: 800,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setAiErr(json.error || "Falha ao gerar imagem.");
        return;
      }
      setImageUrl(json.url);
    } catch (e) {
      setAiErr(e instanceof Error ? e.message : "Erro de rede.");
    } finally {
      setAiBusy(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-white/10 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Localização</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="page">Página *</Label>
                  <Input
                    id="page"
                    name="page"
                    required
                    value={page}
                    onChange={(e) => setPage(e.target.value)}
                    placeholder="home, farma, sobre..."
                  />
                </div>
                <div>
                  <Label htmlFor="section">Seção *</Label>
                  <Input
                    id="section"
                    name="section"
                    required
                    value={section}
                    onChange={(e) => setSection(e.target.value)}
                    placeholder="solucoes, garantias..."
                  />
                </div>
                <div>
                  <Label htmlFor="slot">Slot (chave única) *</Label>
                  <Input
                    id="slot"
                    name="slot"
                    required
                    value={slot}
                    onChange={(e) => setSlot(e.target.value)}
                    placeholder="same-day, moto-fixa..."
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                A combinação <code>página + seção + slot</code> deve ser única e bater com o que o
                componente público lê.
              </p>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Conteúdo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={title ?? ""}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={3}
                  value={description ?? ""}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="cta_label">CTA Label</Label>
                  <Input
                    id="cta_label"
                    name="cta_label"
                    value={ctaLabel ?? ""}
                    onChange={(e) => setCtaLabel(e.target.value)}
                    placeholder="Saber mais"
                  />
                </div>
                <div>
                  <Label htmlFor="cta_url">CTA URL</Label>
                  <Input
                    id="cta_url"
                    name="cta_url"
                    value={ctaUrl ?? ""}
                    onChange={(e) => setCtaUrl(e.target.value)}
                    placeholder="/solucoes"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="border-0 text-white shadow-xl"
            style={{
              background:
                "linear-gradient(135deg, #011960 0%, #02266b 55%, #BA0102 130%)",
            }}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5" />
                Gerar imagem com IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label htmlFor="ai-prompt" className="text-white">
                  Descreva a imagem que você quer
                </Label>
                <Textarea
                  id="ai-prompt"
                  rows={3}
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Ex: motoboy entregando caixa farmacêutica refrigerada em farmácia moderna em São Paulo"
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                />
              </div>
              <div>
                <Label htmlFor="ai-style" className="text-white">
                  Estilo
                </Label>
                <select
                  id="ai-style"
                  value={aiStyle}
                  onChange={(e) => setAiStyle(e.target.value)}
                  className="w-full h-10 rounded-md bg-white/10 border border-white/20 px-3 text-sm text-white"
                >
                  {STYLES.map((s) => (
                    <option key={s.value} value={s.value} className="text-black">
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
              {aiErr ? (
                <div className="text-sm bg-red-500/20 border border-red-300/40 rounded-md px-3 py-2">
                  {aiErr}
                </div>
              ) : null}
              <Button
                type="button"
                onClick={generateImage}
                disabled={aiBusy}
                className="w-full bg-white text-[#011960] hover:bg-white/90 font-semibold"
              >
                {aiBusy ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando (15-30s)...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Gerar imagem
                  </>
                )}
              </Button>
              <p className="text-xs text-white/70">
                A imagem fica salva no Storage. Você ainda pode trocar por upload ou URL externa.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-white/10 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Imagem atual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={imageUrl}
                  alt="preview"
                  className="w-full h-44 object-cover rounded-md border border-white/10"
                />
              ) : (
                <div className="w-full h-44 grid place-items-center rounded-md border border-dashed border-white/10 text-muted-foreground">
                  <ImageOff className="h-8 w-8" />
                </div>
              )}
              <Input
                id="image_url"
                name="image_url"
                value={imageUrl ?? ""}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://..."
              />
              <ImageUploadField
                currentUrl={imageUrl ?? undefined}
                onUploaded={(url) => setImageUrl(url)}
                onClear={() => setImageUrl("")}
                folder="cards"
              />
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Publicação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  name="active"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="h-4 w-4"
                />
                Card ativo (visível no site)
              </label>
              <div>
                <Label htmlFor="sort">Ordem (sort)</Label>
                <Input
                  id="sort"
                  name="sort"
                  type="number"
                  value={sort}
                  onChange={(e) => setSort(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 pt-2">
        <div>
          {excluirAction ? (
            <form action={excluirAction}>
              <Button
                type="submit"
                variant="outline"
                className="text-red-500 hover:text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-1.5" />
                Excluir card
              </Button>
            </form>
          ) : null}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="ghost" asChild>
            <Link href="/app/cms/site/cards">Cancelar</Link>
          </Button>
          <Button type="submit">{submitLabel}</Button>
        </div>
      </div>
    </form>
  );
}
