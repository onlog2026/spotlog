import "server-only";
import { chatComplete, safeParseJson } from "./openai-client";
import {
  generateImageAndUpload,
  generateImageUrl,
  type ImageStyle,
} from "./image-generator";

export type GenerateInput = {
  type: "post" | "case";
  topic: string;
  category?: "blog" | "case" | "news";
  segment?: "ecommerce" | "farma" | "manipulacao" | "correlatos" | "dermo" | "outro";
  client_name?: string;
  imageStyle?: ImageStyle;
};

export type GenerateOutput = {
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
  // case
  summary?: string;
  challenge_md?: string;
  solution_md?: string;
  results_md?: string;
  kpi_json?: Record<string, string>;
};

export type GenerateResult =
  | { ok: true; data: GenerateOutput }
  | { ok: false; error: string };

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const POST_SYSTEM = `Você é um copywriter SEO sênior da Spotlog Logística (transportadora paulista com foco em e-commerce, farma e correlatos).
Escreva em PT-BR, tom profissional-acessível, com gatilhos de conversão sutis.
SEMPRE retorne um JSON válido (sem markdown extra, sem comentários) com EXATAMENTE estas chaves:
{
  "title": "máx 70 chars, atrativo e SEO",
  "excerpt": "1-2 frases (máx 200 chars) que aparecem na listagem",
  "content_md": "artigo completo em Markdown, 600-1200 palavras, com ## subtítulos, listas, parágrafos curtos, 1 CTA no final",
  "tags": ["array", "5-7", "tags", "lowercase", "sem-acento"],
  "seo_title": "máx 60 chars",
  "seo_description": "máx 155 chars",
  "cover_prompt": "descrição visual EM INGLÊS, 1 frase clara para gerar a imagem da capa, focada em logística/transporte/entrega, sem texto na imagem"
}`;

const CASE_SYSTEM = `Você é um redator de cases B2B da Spotlog Logística.
Escreva em PT-BR, terceira pessoa, com números (mesmo que aproximados/realistas).
SEMPRE retorne JSON válido com EXATAMENTE estas chaves:
{
  "title": "Case: {cliente} — resultado em 1 linha (máx 80 chars)",
  "summary": "1-2 frases (máx 280 chars) que resumem o case",
  "challenge_md": "O desafio em Markdown, 2-4 parágrafos curtos com bullets",
  "solution_md": "A solução implementada pela Spotlog em Markdown, 2-4 parágrafos com bullets",
  "results_md": "Resultados quantitativos em Markdown, 2-3 parágrafos com bullets",
  "kpi_json": { "SLA": "98%", "Entregas/mês": "+30%", "NPS": "84" },
  "tags": ["array","5-7","tags","lowercase"],
  "seo_title": "máx 60 chars",
  "seo_description": "máx 155 chars",
  "cover_prompt": "descrição visual EM INGLÊS, 1 frase para a imagem hero, focada no segmento do cliente, sem texto na imagem"
}`;

export async function generateContent(input: GenerateInput): Promise<GenerateResult> {
  if (!input.topic || input.topic.trim().length < 5) {
    return { ok: false, error: "Resumo muito curto (mínimo 5 caracteres)." };
  }

  // Cascata: OpenRouter → Pollinations → Groq → Anthropic → OpenAI → fallback canned.
  // Nenhuma key é obrigatória — Pollinations funciona sem auth.

  const style: ImageStyle = input.imageStyle ?? "hiperrealista";

  // Monta user prompt
  const userPrompt =
    input.type === "case"
      ? `Cliente: ${input.client_name ?? "Cliente confidencial"}
Segmento: ${input.segment ?? "outro"}
Resumo do que aconteceu:
${input.topic}

Crie o case completo conforme o schema.`
      : `Categoria: ${input.category ?? "blog"}
Assunto / briefing:
${input.topic}

Crie o post completo conforme o schema.`;

  const res = await chatComplete({
    model: "gpt-4o-mini",
    jsonMode: true,
    temperature: 0.7,
    maxTokens: 2200,
    messages: [
      { role: "system", content: input.type === "case" ? CASE_SYSTEM : POST_SYSTEM },
      { role: "user", content: userPrompt },
    ],
  });

  if (!res.ok) {
    return { ok: false, error: res.fallback };
  }

  const parsed = safeParseJson<{
    title?: string;
    excerpt?: string;
    summary?: string;
    content_md?: string;
    challenge_md?: string;
    solution_md?: string;
    results_md?: string;
    kpi_json?: Record<string, string>;
    tags?: string[];
    seo_title?: string;
    seo_description?: string;
    cover_prompt?: string;
  }>(res.content);

  if (!parsed || !parsed.title) {
    return { ok: false, error: "A IA retornou um formato inesperado. Tente novamente." };
  }

  const title = String(parsed.title).slice(0, 200);
  const slug = toSlug(title);
  const coverPrompt =
    parsed.cover_prompt ??
    `Brazilian logistics, urban delivery scene, motorcycle courier in São Paulo, professional`;

  // Gera imagem (não bloqueia se Pollinations demorar — timeout interno)
  const img = await generateImageAndUpload(coverPrompt, style, {
    filenamePrefix: input.type,
  });

  const base: GenerateOutput = {
    title,
    slug,
    excerpt: (parsed.excerpt ?? parsed.summary ?? "").slice(0, 500),
    content_md: parsed.content_md ?? "",
    cover_url: img.url,
    cover_prompt: coverPrompt,
    cover_source: img.source,
    tags: Array.isArray(parsed.tags) ? parsed.tags.map((t) => String(t).toLowerCase()) : [],
    seo_title: (parsed.seo_title ?? title).slice(0, 200),
    seo_description: (parsed.seo_description ?? parsed.excerpt ?? "").slice(0, 300),
  };

  if (input.type === "case") {
    base.summary = (parsed.summary ?? parsed.excerpt ?? "").slice(0, 500);
    base.challenge_md = parsed.challenge_md ?? "";
    base.solution_md = parsed.solution_md ?? "";
    base.results_md = parsed.results_md ?? "";
    base.kpi_json = parsed.kpi_json ?? {};
  }

  return { ok: true, data: base };
}

/**
 * Gera SÓ uma imagem (pra editor de cards).
 */
export async function generateImageOnly(
  prompt: string,
  style: ImageStyle = "hiperrealista",
  width = 1200,
  height = 800,
) {
  if (!prompt || prompt.trim().length < 3) {
    return { ok: false as const, error: "Prompt muito curto." };
  }
  const img = await generateImageAndUpload(prompt, style, {
    width,
    height,
    filenamePrefix: "card",
  });
  return { ok: true as const, url: img.url, source: img.source, prompt };
}

export { generateImageUrl };
