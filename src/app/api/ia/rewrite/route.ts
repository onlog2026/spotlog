import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { chatComplete } from "@/lib/ai/openai-client";
import { REWRITE_MODES, type RewriteMode } from "@/lib/ai/rewrite-types";
import { rewriteSystem } from "@/lib/ai/rewrite-prompts";
import { checkIaRateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  text: z.string().min(1).max(8000),
  mode: z.enum(REWRITE_MODES as [RewriteMode, ...RewriteMode[]]),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSession();
    const rate = checkIaRateLimit(ctx.org.id);
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: "Limite de uso da IA atingido. Tente novamente em alguns minutos.",
          retryAfterSec: rate.retryAfterSec,
        },
        { status: 429 },
      );
    }

    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const { text, mode } = parsed.data;

    const result = await chatComplete({
      messages: [
        { role: "system", content: rewriteSystem(mode) },
        { role: "user", content: text },
      ],
      temperature: mode === "corrigir_gramatica" ? 0.1 : 0.5,
    });

    if (!result.ok) {
      return NextResponse.json({
        text,
        usedFallback: true,
        fallbackReason: result.fallback,
      });
    }

    return NextResponse.json({
      text: result.content.trim(),
      usedFallback: false,
    });
  } catch (err) {
    console.error("[/api/ia/rewrite] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado ao reescrever." },
      { status: 500 },
    );
  }
}
