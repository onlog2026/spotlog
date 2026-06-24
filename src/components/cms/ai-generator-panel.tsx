"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";

export type GeneratedPayload = {
  title: string;
  slug: string;
  excerpt: string;
  content_md: string;
  cover_url: string;
  cover_prompt: string;
  cover_source: "supabase" | "pollinations";
  tags: string[];
  seo_title: string;
  seo_description: string;
  summary?: string;
  challenge_md?: string;
  solution_md?: string;
  results_md?: string;
  kpi_json?: Record<string, string>;
};

const STYLES = [
  { value: "hiperrealista", label: "Hiperrealista (foto)" },
  { value: "explicativa", label: "Explicativa (infográfico)" },
  { value: "persuasiva", label: "Persuasiva (cinematográfica)" },
  { value: "blog", label: "Blog (editorial)" },
  { value: "minimalista", label: "Minimalista (limpo)" },
  { value: "corporativa", label: "Corporativa (business)" },
];

export function AiGeneratorPanel({
  type,
  onGenerated,
  defaultCategory = "blog",
  defaultSegment = "outro",
}: {
  type: "post" | "case";
  onGenerated: (data: GeneratedPayload) => void;
  defaultCategory?: "blog" | "case" | "news";
  defaultSegment?: "ecommerce" | "farma" | "manipulacao" | "correlatos" | "dermo" | "outro";
}) {
  const [topic, setTopic] = useState("");
  const [clientName, setClientName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [segment, setSegment] = useState(defaultSegment);
  const [style, setStyle] = useState("hiperrealista");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function handleGenerate() {
    setErr(null);
    if (topic.trim().length < 10) {
      setErr("Descreva o assunto com pelo menos 10 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/cms/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          topic,
          category,
          segment,
          client_name: clientName || undefined,
          imageStyle: style,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setErr(json.error || "Erro ao gerar.");
        return;
      }
      onGenerated(json as GeneratedPayload);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Erro de rede.");
    } finally {
      setLoading(false);
    }
  }

  return (
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
          Gerar com IA
        </CardTitle>
        <p className="text-sm text-white/80 mt-1">
          Descreva o assunto e a IA preenche título, texto, tags, SEO e até a imagem de capa
          pra você. Você ainda pode editar tudo depois.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {type === "case" ? (
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="ai-client" className="text-white">
                Nome do cliente
              </Label>
              <Input
                id="ai-client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ex: Farmácia Premium"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="ai-segment" className="text-white">
                Segmento
              </Label>
              <select
                id="ai-segment"
                value={segment}
                onChange={(e) =>
                  setSegment(e.target.value as typeof segment)
                }
                className="w-full h-10 rounded-md bg-white/10 border border-white/20 px-3 text-sm text-white"
              >
                <option value="ecommerce" className="text-black">
                  E-commerce
                </option>
                <option value="farma" className="text-black">
                  Farma
                </option>
                <option value="manipulacao" className="text-black">
                  Manipulação
                </option>
                <option value="correlatos" className="text-black">
                  Correlatos
                </option>
                <option value="dermo" className="text-black">
                  Dermo
                </option>
                <option value="outro" className="text-black">
                  Outro
                </option>
              </select>
            </div>
          </div>
        ) : (
          <div>
            <Label htmlFor="ai-cat" className="text-white">
              Categoria
            </Label>
            <select
              id="ai-cat"
              value={category}
              onChange={(e) => setCategory(e.target.value as typeof category)}
              className="w-full h-10 rounded-md bg-white/10 border border-white/20 px-3 text-sm text-white"
            >
              <option value="blog" className="text-black">
                Blog
              </option>
              <option value="case" className="text-black">
                Case
              </option>
              <option value="news" className="text-black">
                Notícia
              </option>
            </select>
          </div>
        )}

        <div>
          <Label htmlFor="ai-topic" className="text-white">
            {type === "case"
              ? "Resumo do desafio + solução + resultado *"
              : "Resumo do que você quer escrever *"}
          </Label>
          <Textarea
            id="ai-topic"
            rows={5}
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder={
              type === "case"
                ? "Ex: Farmácia de manipulação em SP precisava entregar termolábeis com SLA. Implementamos rotas dedicadas, controle de temperatura e farmacêutico responsável. Aumentou 35% nas entregas e zerou recusas."
                : "Ex: Como o Same Day Delivery aumenta a conversão de e-commerces de moda, com dados de SP e cases reais"
            }
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
          />
        </div>

        <div>
          <Label htmlFor="ai-style" className="text-white">
            Estilo da imagem
          </Label>
          <select
            id="ai-style"
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="w-full h-10 rounded-md bg-white/10 border border-white/20 px-3 text-sm text-white"
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value} className="text-black">
                {s.label}
              </option>
            ))}
          </select>
        </div>

        {err ? (
          <div className="text-sm bg-red-500/20 border border-red-300/40 rounded-md px-3 py-2">
            {err}
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-white text-[#011960] hover:bg-white/90 font-semibold"
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Gerando (pode levar 15-30s)...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Gerar agora
            </>
          )}
        </Button>

        <p className="text-xs text-white/70 leading-relaxed">
          Conteúdo gerado por IA — revise todos os campos antes de publicar. A imagem é gerada
          via Pollinations.ai (gratuita).
        </p>
      </CardContent>
    </Card>
  );
}
