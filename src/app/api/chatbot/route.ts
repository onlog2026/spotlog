import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { chatComplete } from "@/lib/ai/openai-client";
import { searchStaticKB, type KBStaticEntry } from "@/lib/ai/chatbot-static-kb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Rate limit in-memory: 30 req/h por IP
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
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

const postSchema = z.object({
  session_token: z.string().min(8).max(120).optional(),
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string(),
      }),
    )
    .max(20)
    .optional(),
  visitor_meta: z.object({ referrer: z.string().max(500).optional() }).optional(),
});

const SYSTEM_PROMPT = `Você é o assistente virtual da SPOTLOG, transportadora paulista com AFE Anvisa.
Responda SEMPRE em português brasileiro, tom consultivo e direto, max 3 parágrafos curtos.
USE APENAS a base de conhecimento abaixo. Se a resposta não estiver na base, diga "Não tenho essa informação exata aqui, mas posso conectar você com nosso comercial agora mesmo" e ofereça WhatsApp (11) 91479-1442 ou /contato.
NUNCA invente preços, prazos exatos, números de AFE, capacidades.
Se o usuário demonstrar intenção de contratar/cotar, ofereça o formulário em /contato.`;

function detectIntent(text: string): string {
  const t = text.toLowerCase();
  if (/(rastr|onde est|localiz|status do)/.test(t)) return "rastreio";
  if (/(cota|or[çc]am|preç|quanto custa|contratar|proposta)/.test(t)) return "cotacao";
  if (/(reclam|problema|atras|extravi|dano|errado|n[ãa]o cheg)/.test(t)) return "suporte";
  if (/(humano|atendente|falar com)/.test(t)) return "humano";
  if (/(anvisa|farma|medicament|termol|afe)/.test(t)) return "info_produto";
  return "info_produto";
}

function buildCTA(intent: string, sessionToken: string) {
  switch (intent) {
    case "rastreio":
      return {
        label: "Rastrear meu pedido",
        href: "https://octatracking.com.br/prerastreio?logo=aHR0cHM6Ly9zaXN0ZW1hLnNwb3Rsb2cuY29tLmJyL2ltYWdlcy9zcG90bG9nL2xvZ29zL2xvZ282MDEtNDA2LnBuZw==",
        external: true,
      };
    case "cotacao":
      return { label: "Solicitar proposta", href: `/contato?utm_source=chatbot&session=${sessionToken}`, kind: "form" };
    case "suporte":
    case "humano":
      return { label: "Falar pelo WhatsApp", href: "https://wa.me/5511914791442", external: true };
    default:
      return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: "Muitas mensagens em pouco tempo. Aguarde alguns minutos." },
        { status: 429 },
      );
    }

    const json = await req.json().catch(() => null);
    if (!json) return NextResponse.json({ error: "JSON inválido." }, { status: 400 });

    const parsed = postSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const { session_token, message, history } = parsed.data;

    const sessionToken = session_token ?? `sess_${crypto.randomBytes(16).toString("hex")}`;
    const intent = detectIntent(message);

    // Saudação simples — sem IA
    if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hi|hello)[!.?\s]*$/i.test(message.trim())) {
      return NextResponse.json({
        session_token: sessionToken,
        reply: "Olá! 👋 Sou o assistente da Spotlog. Posso te ajudar com rastreio, cotação, transporte farmacêutico (AFE Anvisa), e dúvidas sobre nossos serviços. O que você precisa?",
        cta: null,
        intent: "saudacao",
      });
    }

    // Busca KB estática
    const hits: KBStaticEntry[] = searchStaticKB(message, 5);

    const kbContext = hits.length
      ? hits
          .map((h, i) => `[${i + 1}] ${h.question}\n${h.answer}`)
          .join("\n\n")
      : "(sem entradas relevantes)";

    const recentHistory = (history ?? []).slice(-8);

    const aiResult = await chatComplete({
      model: "gpt-4o-mini",
      temperature: 0.4,
      maxTokens: 400,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\n=== Base de conhecimento ===\n${kbContext}`,
        },
        ...recentHistory.map((m) => ({ role: m.role, content: m.content }) as const),
        { role: "user", content: message },
      ],
    });

    let reply = aiResult.ok
      ? aiResult.content
      : hits.length > 0
        ? hits[0].answer
        : "Não tenho essa informação exata aqui, mas posso conectar você com nosso comercial agora mesmo. Fale pelo WhatsApp (11) 91479-1442 ou pelo formulário em /contato — respondemos em até 1 dia útil.";

    // Sanitiza eventual JSON acidental
    if (reply.startsWith("{") && reply.includes('"')) {
      try {
        const j = JSON.parse(reply);
        if (typeof j.answer === "string") reply = j.answer;
        else if (typeof j.content === "string") reply = j.content;
      } catch {}
    }

    const cta = buildCTA(intent, sessionToken);

    return NextResponse.json({
      session_token: sessionToken,
      reply,
      cta,
      intent,
      converted: false,
    });
  } catch (err) {
    console.error("[/api/chatbot] fatal", err);
    return NextResponse.json(
      {
        // Mesmo num crash inesperado, devolve algo útil pro user
        session_token: `sess_${crypto.randomBytes(16).toString("hex")}`,
        reply:
          "Tive um problema técnico aqui. Pra não te deixar parado, fala com a gente no WhatsApp (11) 91479-1442 ou em /contato. ✋",
        cta: { label: "Falar pelo WhatsApp", href: "https://wa.me/5511914791442", external: true },
        intent: "erro",
      },
      { status: 200 },
    );
  }
}

export async function GET() {
  // Histórico depende de DB — retorna vazio (cliente mantém em localStorage agora)
  return NextResponse.json({ messages: [] });
}
