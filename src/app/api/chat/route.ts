import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { SPOTLOG_SYSTEM_PROMPT } from "@/lib/ai/spotlog-system-prompt";
import { chatStream } from "@/lib/ai/openai-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const messageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().min(1).max(4000),
});

const bodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(40),
});

// Rate limit in-memory simples: 30 req / 60s por IP
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const ipHits = new Map<string, { count: number; resetAt: number }>();

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipHits.get(ip);
  if (!entry || entry.resetAt < now) {
    ipHits.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

const FALLBACK_REPLY =
  "Estamos validando esse recurso. Por enquanto, fale pelo WhatsApp em /contato ou preencha o formulário em /contato pra falarmos com você.";

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas requisições. Tente novamente em 1 minuto." },
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

    const { messages } = parsed.data;

    // Stream com cascata gratuita: Pollinations → Groq → OpenAI → fallback
    const streamResult = await chatStream({
      model: "gpt-4o-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: SPOTLOG_SYSTEM_PROMPT },
        ...messages,
      ],
    });

    if (!streamResult) {
      // Nenhum provider respondeu — devolve canned
      return ndjsonStream([FALLBACK_REPLY]);
    }

    return new Response(streamResult.stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-AI-Provider": streamResult.provider,
      },
    });
  } catch (err) {
    console.error("[/api/chat] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado no chat." },
      { status: 500 },
    );
  }
}

function ndjsonStream(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(JSON.stringify({ delta: chunk }) + "\n"));
      }
      controller.close();
    },
  });
  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
