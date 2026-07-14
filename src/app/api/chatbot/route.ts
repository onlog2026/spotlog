import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import crypto from "node:crypto";
import { chatComplete } from "@/lib/ai/openai-client";
import { searchStaticKB, type KBStaticEntry } from "@/lib/ai/chatbot-static-kb";
import { buildSiteKnowledge } from "@/lib/ai/site-knowledge";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Roteamento humano: dois números reais da Spotlog.
// SAC (pedidos, status, atrasos, ocorrências) e COMERCIAL (serviços, preços, contratação).
const WHATSAPP_SAC = "5511914791442"; // (11) 91479-1442
const WHATSAPP_COMERCIAL = "5511978348288"; // (11) 97834-8288
// Portal de rastreio self-service (Octatracking, com o logo da Spotlog).
const RASTREIO_URL =
  "https://octatracking.com.br/prerastreio?logo=aHR0cHM6Ly9zaXN0ZW1hLnNwb3Rsb2cuY29tLmJyL2ltYWdlcy9zcG90bG9nL2xvZ29zL2xvZ282MDEtNDA2LnBuZw==";
function waLink(number: string, prefill: string): string {
  return `https://wa.me/${number}?text=${encodeURIComponent(prefill)}`;
}

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

const SYSTEM_PROMPT = `Você é a Bia, do time de atendimento da Spotlog — uma operadora logística de São Paulo. Você fala como uma PESSOA de verdade: calorosa, próxima, com naturalidade brasileira. Nada de tom robótico ou script engessado.

COMO CONVERSAR:
- Escreva como gente: frases curtas, acolhedoras, no máximo 3 parágrafos. Pode usar o nome da pessoa se ela disser. Um emoji ocasional (no máximo 1) é bem-vindo, sem exagero.
- Demonstre que entendeu antes de responder ("Poxa, entendo — atraso na entrega incomoda mesmo…"). Empatia primeiro, solução depois.
- Faça UMA pergunta de cada vez pra entender o que a pessoa precisa. Não despeje informação.
- Baseie tudo no CATÁLOGO e na base abaixo. NUNCA invente preço, prazo exato, número de AFE ou capacidade. Se não souber, seja honesta e leve pro canal certo.

PARA ONDE ENCAMINHAR (isto é essencial):
- Quer RASTREAR / acompanhar / saber onde está um pedido → oriente a pessoa a usar nosso PORTAL DE RASTREIO (o botão "Rastrear meu pedido" que aparece abaixo da sua resposta). Diga que é só clicar ali e informar o código de rastreio. NÃO mande pro WhatsApp pra rastrear — o portal resolve na hora.
- PROBLEMA com um pedido (ATRASO, EXTRAVIO, avaria, RECLAMAÇÃO, não chegou, veio errado) → aí sim oriente com carinho e ofereça o WhatsApp do SAC: (11) 91479-1442.
- Assunto COMERCIAL / novo serviço / como funciona / preços / cotação / contratação / tabelas → oriente e ofereça o WhatsApp Comercial: (11) 97834-8288.
- Na dúvida, pergunte gentilmente: "É pra rastrear um pedido, resolver um problema com uma entrega, ou contratar/orçar um serviço?"
- Preço é sempre por COTAÇÃO (varia por volume, região, prazo) — explique isso e leve pro Comercial. Nunca cite um valor.`;

function detectIntent(text: string): string {
  const t = text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
  // PROBLEMA com pedido → SAC humano (checado ANTES de rastreio: "atrasado" não é rastreio)
  if (/(atras|extravi|dano|danific|reclam|ocorrenc|nao cheg|nao recebi|errad|sumiu|perdid|cancel|reembols)/.test(t))
    return "sac";
  // RASTREAR / acompanhar / status → portal de rastreio (self-service)
  if (/(rastr|acompanh|codigo|onde est|onde anda|cade|status|meu pedido|minha entrega|minha encomenda|localiz|chegou)/.test(t))
    return "rastreio";
  // Comercial — vender / contratar / preço / como funciona
  if (/(cota|or[cç]am|prec|quanto custa|contratar|proposta|tabela|servic|servico|como funciona|planos?|quero contratar|comercial|novo cliente)/.test(t))
    return "comercial";
  if (/(humano|atendente|falar com|pessoa de verdade)/.test(t)) return "humano";
  if (/(anvisa|farma|medicament|termol|afe)/.test(t)) return "comercial";
  return "comercial";
}

function buildCTA(intent: string, sessionToken: string) {
  void sessionToken;
  switch (intent) {
    case "rastreio":
      return {
        label: "Rastrear meu pedido",
        href: RASTREIO_URL,
        external: true,
      };
    case "sac":
      return {
        label: "Falar com o SAC no WhatsApp",
        href: waLink(
          WHATSAPP_SAC,
          "Olá! Vim pelo site da Spotlog e preciso de ajuda com um pedido/entrega.",
        ),
        external: true,
      };
    case "comercial":
    case "humano":
      return {
        label: "Falar com o Comercial no WhatsApp",
        href: waLink(
          WHATSAPP_COMERCIAL,
          "Olá! Vim pelo site da Spotlog e quero saber mais sobre os serviços / uma cotação.",
        ),
        external: true,
      };
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

    // Saudação simples — sem IA (tom humano, sem cara de robô)
    if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|hi|hello|opa|e ai|eai)[!.?\s]*$/i.test(message.trim())) {
      return NextResponse.json({
        session_token: sessionToken,
        reply: "Oi! Aqui é a Bia, da Spotlog 😊 Que bom te ver por aqui. Me conta: é sobre um pedido que já está a caminho, ou você quer conhecer/orçar um serviço com a gente?",
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
      : "(sem entradas específicas — use o catálogo do site e, se faltar, encaminhe pro canal certo)";

    const recentHistory = (history ?? []).slice(-8);

    const aiResult = await chatComplete({
      model: "gpt-4o-mini",
      temperature: 0.6,
      maxTokens: 420,
      messages: [
        {
          role: "system",
          content: `${SYSTEM_PROMPT}\n\n=== ${buildSiteKnowledge()}\n\n=== Base de conhecimento (FAQ) ===\n${kbContext}`,
        },
        ...recentHistory.map((m) => ({ role: m.role, content: m.content }) as const),
        { role: "user", content: message },
      ],
    });

    const fallbackGuia =
      intent === "rastreio"
        ? "pra rastrear seu pedido é só clicar no botão \"Rastrear meu pedido\" aqui embaixo e informar o código. 📦"
        : intent === "sac"
          ? "o melhor é falar com nosso SAC no WhatsApp (11) 91479-1442 que a gente resolve rapidinho. 🙂"
          : "o melhor é falar com nosso Comercial no WhatsApp (11) 97834-8288. 🙂";
    let reply = aiResult.ok
      ? aiResult.content
      : hits.length > 0
        ? hits[0].answer
        : `Deixa eu te ajudar do jeito certo: ${fallbackGuia}`;

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
          "Ops, tive um probleminha técnico aqui do meu lado. Pra não te deixar esperando: se for sobre um pedido, chama o SAC no (11) 91479-1442; se for pra orçar/contratar, o Comercial no (11) 97834-8288. A gente te atende rapidinho. 🙂",
        cta: {
          label: "Falar no WhatsApp",
          href: waLink(
            WHATSAPP_COMERCIAL,
            "Olá! Vim pelo site da Spotlog.",
          ),
          external: true,
        },
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
