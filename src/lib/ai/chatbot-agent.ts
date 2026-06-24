import "server-only";
import { randomBytes } from "crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { chatComplete, type ChatMessage } from "./openai-client";
import {
  searchKnowledge,
  logUnansweredQuestion,
  type KBHit,
} from "./knowledge-base";

export type ChatbotIntent =
  | "cotacao"
  | "rastreio"
  | "suporte"
  | "info_produto"
  | "contratar"
  | "saudacao"
  | "outro";

export type AgentCTA = {
  label: string;
  href: string;
  kind?: "convert" | "external" | "internal";
};

export type AgentResponse = {
  reply: string;
  cta?: AgentCTA;
  intent: ChatbotIntent;
  matched_kb_ids: string[];
  confidence: number;
};

export type ChatbotSession = {
  id: string;
  session_token: string;
  organization_id: string | null;
  converted: boolean;
  lead_id: string | null;
};

export type ChatbotMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  matched_kb_ids: string[] | null;
  intent: string | null;
  confidence: number | null;
  created_at: string;
};

const INTENT_KEYWORDS: Record<Exclude<ChatbotIntent, "outro" | "saudacao">, string[]> = {
  cotacao: [
    "cotacao","cotação","cotacão","preço","preco","orçamento","orcamento","valor",
    "quanto custa","contratar","contratacao","proposta","fechar contrato",
  ],
  rastreio: [
    "rastrear","rastreio","rastreamento","onde esta","onde está","cadê","cade",
    "localizar","código de rastreio","status do pedido","minha entrega","minha encomenda",
  ],
  suporte: [
    "problema","erro","reclamacao","reclamação","ocorrencia","ocorrência","extravio",
    "atraso","sac","chamado","ticket","ajuda","suporte","danificado","dano",
  ],
  info_produto: [
    "como funciona","o que é","serviço","servico","afe","anvisa","termolabel",
    "termolábel","quem é","sobre","história","historia","cobertura","atende","atendem",
  ],
  contratar: [
    "quero contratar","quero fechar","aceito","pode mandar proposta","como assino",
    "como faço pra contratar","quero virar cliente","quero ser cliente",
  ],
};

function detectIntent(message: string): {
  intent: ChatbotIntent;
  confidence: number;
} {
  const m = message
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");

  // Saudações curtas
  if (/^(oi|olá|ola|bom dia|boa tarde|boa noite|hey|e ai|hello|hi)[\s!?.,]*$/i.test(m)) {
    return { intent: "saudacao", confidence: 0.95 };
  }

  let bestIntent: ChatbotIntent = "outro";
  let bestScore = 0;
  for (const [intent, kws] of Object.entries(INTENT_KEYWORDS)) {
    let score = 0;
    for (const kw of kws) {
      if (m.includes(kw)) score += 1;
    }
    if (score > bestScore) {
      bestScore = score;
      bestIntent = intent as ChatbotIntent;
    }
  }
  const confidence = bestScore === 0 ? 0.2 : Math.min(0.5 + bestScore * 0.15, 0.95);
  return { intent: bestIntent, confidence };
}

function buildSystemPrompt(hits: KBHit[]): string {
  const kbBlock = hits.length
    ? hits
        .map(
          (h, i) =>
            `[${i + 1}] (${h.entry.category}) Q: ${h.entry.question}\nR: ${h.entry.answer}`,
        )
        .join("\n\n")
    : "(Sem itens relevantes na base. Seja honesto e ofereça contato humano.)";

  return `Você é o assistente virtual da SPOTLOG, transportadora paulista com AFE Anvisa.
Responda SEMPRE em português brasileiro, tom consultivo e direto, no máximo 3 parágrafos curtos.
USE APENAS a base de conhecimento fornecida abaixo. Se a resposta não estiver na base, diga "Não tenho essa informação exata aqui, mas posso conectar você com nosso comercial agora mesmo" e ofereça WhatsApp (11) 91479-1442 ou o formulário em /contato.
NUNCA invente preços, prazos exatos, números de AFE ou capacidades técnicas.
Se o usuário demonstrar intenção de contratar/cotar, ofereça o formulário em /contato.
NÃO use markdown pesado (sem ##, sem tabelas). Pode usar bullets simples com "- ".

Base de conhecimento relevante:
${kbBlock}`;
}

function generateToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createSession(opts: {
  ip?: string | null;
  ua?: string | null;
  referrer?: string | null;
  organizationId?: string | null;
}): Promise<ChatbotSession> {
  const supabase = createAdminClient();
  const token = generateToken();
  let orgId = opts.organizationId ?? null;
  if (!orgId) {
    const fromEnv = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;
    if (fromEnv) orgId = fromEnv;
    else {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      orgId = (org as { id: string } | null)?.id ?? null;
    }
  }
  const { data, error } = await supabase
    .from("chatbot_sessions")
    .insert({
      session_token: token,
      visitor_ip: opts.ip ?? null,
      visitor_user_agent: opts.ua ?? null,
      referrer: opts.referrer ?? null,
      organization_id: orgId,
    })
    .select("id, session_token, organization_id, converted, lead_id")
    .single();
  if (error || !data) {
    throw new Error("Falha ao criar sessão do chatbot: " + (error?.message ?? "?"));
  }
  return data as unknown as ChatbotSession;
}

export async function getSessionByToken(
  token: string,
): Promise<ChatbotSession | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("chatbot_sessions")
    .select("id, session_token, organization_id, converted, lead_id")
    .eq("session_token", token)
    .maybeSingle();
  return (data as unknown as ChatbotSession | null) ?? null;
}

export async function appendMessage(
  sessionId: string,
  role: "user" | "assistant" | "system",
  content: string,
  matchedKbIds?: string[],
  intent?: ChatbotIntent | null,
  confidence?: number | null,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("chatbot_messages").insert({
    session_id: sessionId,
    role,
    content,
    matched_kb_ids: matchedKbIds ?? [],
    intent: intent ?? null,
    confidence: confidence ?? null,
  });
  if (error) console.error("[chatbot-agent] append error", error);
  await supabase
    .from("chatbot_sessions")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", sessionId);
}

export async function getHistory(
  sessionId: string,
  limit = 20,
): Promise<ChatbotMessageRow[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chatbot_messages")
    .select("id, role, content, matched_kb_ids, intent, confidence, created_at")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data as unknown as ChatbotMessageRow[];
}

function ctaForIntent(intent: ChatbotIntent, sessionToken: string): AgentCTA | undefined {
  if (intent === "cotacao" || intent === "contratar") {
    return {
      label: "Pedir cotação agora",
      href: `/contato?utm_source=chatbot&utm_medium=widget&utm_campaign=spotlog_assist&session=${encodeURIComponent(sessionToken)}`,
      kind: "convert",
    };
  }
  if (intent === "rastreio") {
    return {
      label: "Rastrear pedido",
      href: "https://octatracking.com.br/prerastreio",
      kind: "external",
    };
  }
  if (intent === "suporte") {
    return {
      label: "Abrir chamado no SAC",
      href: "mailto:sac@spotlogoficial.com.br",
      kind: "external",
    };
  }
  return undefined;
}

export async function runAgent(
  session: ChatbotSession,
  userMessage: string,
): Promise<AgentResponse> {
  // 1. Append user msg
  await appendMessage(session.id, "user", userMessage);

  // 2. Detecta intent
  const { intent, confidence } = detectIntent(userMessage);

  // 3. Busca KB
  const hits = await searchKnowledge(userMessage);
  const matchedIds = hits.map((h) => h.entry.id);

  // 4. Histórico curto
  const history = await getHistory(session.id, 9);
  const shortHistory: ChatMessage[] = history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .slice(-8)
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  // 5. Quick reply pra saudação sem chamar IA
  if (intent === "saudacao" && history.length <= 1) {
    const reply =
      "Oi! Sou o assistente virtual da Spotlog. Posso te ajudar com cotação, rastreio, dúvidas sobre AFE Anvisa, ou conectar com um humano. Como posso ajudar hoje?";
    await appendMessage(session.id, "assistant", reply, [], intent, confidence);
    return { reply, intent, matched_kb_ids: [], confidence };
  }

  // 6. OpenAI
  const systemPrompt = buildSystemPrompt(hits);
  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...shortHistory,
    { role: "user", content: userMessage },
  ];

  const result = await chatComplete({
    model: "gpt-4o-mini",
    messages,
    temperature: 0.3,
    maxTokens: 480,
  });

  let reply: string;
  if (result.ok) {
    reply = result.content.trim();
  } else {
    reply = hits.length
      ? hits[0].entry.answer
      : "Não tenho essa informação exata aqui, mas posso conectar você com nosso comercial agora. Fale pelo WhatsApp (11) 91479-1442 ou acesse /contato.";
  }

  // 7. Log unanswered se confiança baixa OU sem hits
  if (hits.length === 0 && confidence < 0.5) {
    await logUnansweredQuestion(
      session.id,
      userMessage,
      shortHistory
        .slice(-3)
        .map((m) => `${m.role}: ${m.content}`)
        .join("\n"),
      session.organization_id,
    );
  }

  // 8. CTA
  const cta = ctaForIntent(intent, session.session_token);

  await appendMessage(session.id, "assistant", reply, matchedIds, intent, confidence);

  return { reply, cta, intent, matched_kb_ids: matchedIds, confidence };
}
