import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { checkIaRateLimit } from "@/lib/ai/rate-limit";
import { generateContent, generateImageOnly } from "@/lib/ai/content-generator";
import type { ImageStyle } from "@/lib/ai/image-generator";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_STYLES: ImageStyle[] = [
  "hiperrealista",
  "explicativa",
  "persuasiva",
  "blog",
  "minimalista",
  "corporativa",
];

export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireSession();
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const rl = checkIaRateLimit(ctx.org.id);
  if (!rl.ok) {
    return NextResponse.json(
      { error: "rate_limited", retryAfterSec: rl.retryAfterSec },
      { status: 429 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const mode = String(body.mode ?? "content");
  const style = VALID_STYLES.includes(body.imageStyle as ImageStyle)
    ? (body.imageStyle as ImageStyle)
    : "hiperrealista";

  // Modo só-imagem (pra editor de cards)
  if (mode === "image") {
    const prompt = String(body.prompt ?? "").trim();
    if (!prompt) {
      return NextResponse.json({ error: "prompt_required" }, { status: 400 });
    }
    const width = typeof body.width === "number" ? body.width : 1200;
    const height = typeof body.height === "number" ? body.height : 800;
    const out = await generateImageOnly(prompt, style, width, height);
    if (!out.ok) {
      return NextResponse.json({ error: out.error }, { status: 500 });
    }
    return NextResponse.json({
      url: out.url,
      source: out.source,
      prompt: out.prompt,
    });
  }

  // Modo conteúdo completo (post ou case)
  const type = body.type === "case" ? "case" : "post";
  const topic = String(body.topic ?? "").trim();
  if (!topic) {
    return NextResponse.json({ error: "topic_required" }, { status: 400 });
  }

  const result = await generateContent({
    type,
    topic,
    category: body.category as "blog" | "case" | "news" | undefined,
    segment: body.segment as
      | "ecommerce"
      | "farma"
      | "manipulacao"
      | "correlatos"
      | "dermo"
      | "outro"
      | undefined,
    client_name: body.client_name ? String(body.client_name) : undefined,
    imageStyle: style,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 502 });
  }

  return NextResponse.json({ ...result.data });
}
