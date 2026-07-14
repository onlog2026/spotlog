import "server-only";
import { getIntegration } from "@/lib/integrations";

/**
 * Cliente de IA com cascata de providers GRATUITOS + open-source.
 *
 * Ordem de preferência (cai pro próximo se falhar):
 *   1) Pollinations.ai      — GRÁTIS, sem auth, gpt-4o-mini equivalente (default)
 *   2) OpenRouter           — se OPENROUTER_API_KEY setada (free key), modelos :free Llama/Gemma/Phi
 *   3) Groq                 — se GROQ_API_KEY setada, Llama 3.3 70B ultra rápido
 *   4) Anthropic Claude     — se ANTHROPIC_API_KEY setada, Claude Haiku (free tier limitado)
 *   5) OpenAI               — se OPENAI_API_KEY setada, gpt-4o-mini (pago)
 *   6) Fallback canned      — texto genérico se todos falharem
 *
 * Configuração:
 *   - Por padrão usa Pollinations (zero config).
 *   - Variável `AI_PROVIDER_ORDER` (csv) sobrescreve a ordem.
 *     Ex: "openrouter,pollinations,groq,anthropic,openai".
 *
 * A função `chatComplete` mantém a mesma assinatura/contrato anterior pra
 * todos os callers continuarem funcionando sem mudança.
 */

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type ChatCompleteParams = {
  model?: string;
  messages: ChatMessage[];
  jsonMode?: boolean;
  temperature?: number;
  maxTokens?: number;
  /**
   * Quando informado, resolve as chaves de IA (OpenRouter/Anthropic/OpenAI)
   * a partir das integrações salvas no painel daquela org (com fallback pra env).
   * Sem orgId, usa só as variáveis de ambiente (comportamento antigo).
   */
  orgId?: string;
};

export type ChatCompleteResult =
  | { ok: true; content: string; provider: string; raw?: unknown }
  | { ok: false; fallback: string; error?: string };

const DEFAULT_FALLBACK =
  "IA temporariamente indisponível. Você pode preencher manualmente — depois pedimos pra IA revisar.";

type Provider = "pollinations" | "openrouter" | "groq" | "anthropic" | "openai";

const VALID_PROVIDERS: Provider[] = [
  "pollinations", "openrouter", "groq", "anthropic", "openai",
];

type ProviderKeys = {
  openrouter?: string;
  groq?: string;
  anthropic?: string;
  openai?: string;
  /** true quando a org conectou OpenRouter no painel (escolha explícita → vira primário) */
  openrouterPrimary?: boolean;
};

/**
 * Resolve as chaves de cada provider. Baseline = variáveis de ambiente.
 * Se `orgId` for informado, sobrescreve com as chaves salvas no painel
 * (integrações ativas da org). Falha de DB cai de volta pro env (não quebra).
 */
async function resolveKeys(orgId?: string): Promise<ProviderKeys> {
  const keys: ProviderKeys = {
    openrouter: process.env.OPENROUTER_API_KEY || undefined,
    groq: process.env.GROQ_API_KEY || undefined,
    anthropic: process.env.ANTHROPIC_API_KEY || undefined,
    openai: process.env.OPENAI_API_KEY || undefined,
  };
  if (!orgId) return keys;
  try {
    const [or, an, oa] = await Promise.all([
      getIntegration(orgId, "openrouter"),
      getIntegration(orgId, "anthropic"),
      getIntegration(orgId, "openai"),
    ]);
    if (or?.credentials?.api_key) {
      keys.openrouter = or.credentials.api_key;
      // Veio de uma integração salva no painel (não do env) → prioriza
      if (or.id !== "env") keys.openrouterPrimary = true;
    }
    if (an?.credentials?.api_key) keys.anthropic = an.credentials.api_key;
    if (oa?.credentials?.api_key) keys.openai = oa.credentials.api_key;
  } catch (e) {
    console.warn("[ai-client] resolveKeys: usando env (org falhou):", e);
  }
  return keys;
}

function getProviderOrder(keys: ProviderKeys): Provider[] {
  const override = process.env.AI_PROVIDER_ORDER;
  if (override) {
    const parsed = override
      .split(",")
      .map((p) => p.trim().toLowerCase())
      .filter((p): p is Provider => VALID_PROVIDERS.includes(p as Provider));
    if (parsed.length > 0) return parsed;
  }
  // Org que conectou OpenRouter no painel → ele vira o 1º (escolha explícita).
  // Senão, Pollinations primeiro (grátis) e OpenRouter (env) como fallback.
  const order: Provider[] = [];
  if (keys.openrouter && keys.openrouterPrimary) order.push("openrouter");
  order.push("pollinations");
  if (keys.openrouter && !keys.openrouterPrimary) order.push("openrouter");
  if (keys.groq) order.push("groq");
  if (keys.anthropic) order.push("anthropic");
  if (keys.openai) order.push("openai");
  return order;
}

/**
 * Quando o caller pediu jsonMode mas o provider não suporta response_format nativamente,
 * injeta no system prompt uma instrução forte de retornar APENAS JSON.
 */
function injectJsonHint(messages: ChatMessage[]): ChatMessage[] {
  const hint = "\n\nIMPORTANTE: responda APENAS com um JSON válido, sem markdown, sem code fences (```), sem texto antes ou depois. Apenas o objeto JSON puro.";
  const sysIdx = messages.findIndex((m) => m.role === "system");
  if (sysIdx >= 0) {
    return messages.map((m, i) =>
      i === sysIdx ? { ...m, content: m.content + hint } : m,
    );
  }
  return [{ role: "system", content: hint.trim() }, ...messages];
}

/** Mapeia nosso `model` lógico pro nome real do provider */
function mapModel(provider: Provider, model: string): string {
  if (provider === "pollinations") {
    // Pollinations: openai (=gpt-4o-mini), openai-large, mistral, llama, qwen-coder, deepseek
    if (model.includes("gpt-4o") && !model.includes("mini")) return "openai-large";
    if (model.startsWith("mistral")) return "mistral";
    if (model.startsWith("llama")) return "llama";
    return "openai";
  }
  if (provider === "openrouter") {
    // Modelos FREE no OpenRouter (sufixo :free):
    //   meta-llama/llama-3.3-70b-instruct:free       — top free do momento
    //   google/gemma-2-9b-it:free
    //   meta-llama/llama-3.2-3b-instruct:free
    //   mistralai/mistral-7b-instruct:free
    //   microsoft/phi-3-mini-128k-instruct:free
    return "meta-llama/llama-3.3-70b-instruct:free";
  }
  if (provider === "groq") {
    if (model.includes("mixtral")) return "mixtral-8x7b-32768";
    if (model.includes("llama-3.1")) return "llama-3.1-70b-versatile";
    return "llama-3.3-70b-versatile";
  }
  if (provider === "anthropic") {
    // claude-3-5-haiku é rápido e barato; pra mensagens curtas funciona bem
    return "claude-3-5-haiku-20241022";
  }
  // openai: passa direto
  return model;
}

async function callProvider(
  provider: Provider,
  params: ChatCompleteParams,
  keys: ProviderKeys,
): Promise<ChatCompleteResult> {
  const { model = "gpt-4o-mini", messages, jsonMode, temperature = 0.4, maxTokens } = params;
  const realModel = mapModel(provider, model);

  let url: string;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  let payload: Record<string, unknown>;

  if (provider === "pollinations") {
    url = "https://text.pollinations.ai/openai";
    payload = { model: realModel, temperature, messages };
    if (jsonMode) payload.response_format = { type: "json_object" };
    if (maxTokens) payload.max_tokens = maxTokens;
  } else if (provider === "openrouter") {
    const key = keys.openrouter;
    if (!key) return { ok: false, fallback: DEFAULT_FALLBACK, error: "no_openrouter_key" };
    url = "https://openrouter.ai/api/v1/chat/completions";
    headers.Authorization = `Bearer ${key}`;
    headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.spotlog.com.br";
    headers["X-Title"] = "Spotlog";
    // OpenRouter: usa `models` array com fallback automático entre modelos free.
    // NÃO seta response_format — modelos :free não suportam bem e rate-limit aumenta.
    // O system prompt já pede JSON; safeParseJson extrai mesmo se vier com texto extra.
    payload = {
      models: [
        "openai/gpt-oss-120b:free",
        "google/gemma-4-31b-it:free",
        "z-ai/glm-4.5-air:free",
      ],
      temperature,
      messages: jsonMode
        ? injectJsonHint(messages)
        : messages,
      route: "fallback",
    };
    if (maxTokens) payload.max_tokens = maxTokens;
  } else if (provider === "groq") {
    const key = keys.groq;
    if (!key) return { ok: false, fallback: DEFAULT_FALLBACK, error: "no_groq_key" };
    url = "https://api.groq.com/openai/v1/chat/completions";
    headers.Authorization = `Bearer ${key}`;
    payload = { model: realModel, temperature, messages };
    if (jsonMode) payload.response_format = { type: "json_object" };
    if (maxTokens) payload.max_tokens = maxTokens;
  } else if (provider === "anthropic") {
    const key = keys.anthropic;
    if (!key) return { ok: false, fallback: DEFAULT_FALLBACK, error: "no_anthropic_key" };
    url = "https://api.anthropic.com/v1/messages";
    headers["x-api-key"] = key;
    headers["anthropic-version"] = "2023-06-01";
    // Anthropic API tem formato diferente: system separado, messages user/assistant
    const sysMsg = messages.find((m) => m.role === "system")?.content ?? "";
    const convMessages = messages
      .filter((m) => m.role !== "system")
      .map((m) => ({ role: m.role, content: m.content }));
    payload = {
      model: realModel,
      max_tokens: maxTokens ?? 1024,
      temperature,
      system: sysMsg,
      messages: convMessages,
    };
  } else {
    const key = keys.openai;
    if (!key) return { ok: false, fallback: DEFAULT_FALLBACK, error: "no_openai_key" };
    url = "https://api.openai.com/v1/chat/completions";
    headers.Authorization = `Bearer ${key}`;
    payload = { model: realModel, temperature, messages };
    if (jsonMode) payload.response_format = { type: "json_object" };
    if (maxTokens) payload.max_tokens = maxTokens;
  }

  try {
    const controller = new AbortController();
    const timeoutMs = provider === "pollinations" ? 90_000 : 60_000;
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.warn(`[ai-client/${provider}] upstream ${res.status}`, text.slice(0, 400));
      return { ok: false, fallback: DEFAULT_FALLBACK, error: `${provider}_${res.status}:${text.slice(0, 100)}` };
    }

    const json = (await res.json()) as Record<string, unknown>;

    let content = "";
    if (provider === "anthropic") {
      // Anthropic retorna { content: [{ type: 'text', text: '...' }] }
      const blocks = json.content as Array<{ type: string; text?: string }> | undefined;
      content = blocks?.find((b) => b.type === "text")?.text ?? "";
    } else {
      const choices = json.choices as Array<{ message?: { content?: string } }> | undefined;
      content = choices?.[0]?.message?.content ?? "";
    }

    if (!content) {
      return { ok: false, fallback: DEFAULT_FALLBACK, error: `${provider}_empty` };
    }

    // Detecta respostas-erro vazadas pelo upstream do OpenRouter
    // (ex: "An error occurred while processing your request")
    const trimmed = content.trim();
    if (
      /^(an error|error:|sorry|unable|cannot)/i.test(trimmed) &&
      trimmed.length < 200
    ) {
      console.warn(`[ai-client/${provider}] upstream error string`, trimmed.slice(0, 120));
      return { ok: false, fallback: DEFAULT_FALLBACK, error: `${provider}_error_string` };
    }

    return { ok: true, content, provider, raw: json };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    console.warn(`[ai-client/${provider}] error`, msg);
    return { ok: false, fallback: DEFAULT_FALLBACK, error: `${provider}_fetch:${msg}` };
  }
}

export async function chatComplete(
  params: ChatCompleteParams,
): Promise<ChatCompleteResult> {
  const keys = await resolveKeys(params.orgId);
  const order = getProviderOrder(keys);
  let lastError: string | undefined;

  for (const provider of order) {
    const result = await callProvider(provider, params, keys);
    if (result.ok) return result;
    lastError = result.error;
  }

  return { ok: false, fallback: DEFAULT_FALLBACK, error: lastError ?? "all_providers_failed" };
}

/**
 * Streaming chat (usado pelo chat widget público).
 *
 * Retorna um ReadableStream<Uint8Array> com NDJSON `{delta: "..."}` por chunk,
 * ou null se nenhum provider funcionar.
 *
 * Tenta Pollinations stream primeiro (gratuito), depois Groq, depois OpenAI.
 */
export async function chatStream(
  params: ChatCompleteParams,
): Promise<{ stream: ReadableStream<Uint8Array>; provider: string } | null> {
  const keys = await resolveKeys(params.orgId);
  const order = getProviderOrder(keys);
  const { model = "gpt-4o-mini", messages, temperature = 0.4 } = params;

  for (const provider of order) {
    // Streaming não suportado em Anthropic via mesma API — pula
    if (provider === "anthropic") continue;

    const realModel = mapModel(provider, model);
    let url: string;
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    let streamBody: Record<string, unknown>;

    if (provider === "pollinations") {
      url = "https://text.pollinations.ai/openai";
      streamBody = { model: realModel, temperature, stream: true, messages };
    } else if (provider === "openrouter") {
      const key = keys.openrouter;
      if (!key) continue;
      url = "https://openrouter.ai/api/v1/chat/completions";
      headers.Authorization = `Bearer ${key}`;
      headers["HTTP-Referer"] = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.spotlog.com.br";
      headers["X-Title"] = "Spotlog";
      streamBody = {
        models: [
          "openai/gpt-oss-120b:free",
          "google/gemma-4-31b-it:free",
          "z-ai/glm-4.5-air:free",
        ],
        temperature,
        stream: true,
        messages,
        route: "fallback",
      };
    } else if (provider === "groq") {
      const key = keys.groq;
      if (!key) continue;
      url = "https://api.groq.com/openai/v1/chat/completions";
      headers.Authorization = `Bearer ${key}`;
      streamBody = { model: realModel, temperature, stream: true, messages };
    } else {
      const key = keys.openai;
      if (!key) continue;
      url = "https://api.openai.com/v1/chat/completions";
      headers.Authorization = `Bearer ${key}`;
      streamBody = { model: realModel, temperature, stream: true, messages };
    }

    try {
      const upstream = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(streamBody),
      });

      if (!upstream.ok || !upstream.body) {
        console.warn(`[ai-stream/${provider}] ${upstream.status}`);
        continue;
      }

      const encoder = new TextEncoder();
      const decoder = new TextDecoder();
      const reader = upstream.body.getReader();

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          let buffer = "";
          try {
            while (true) {
              const { value, done } = await reader.read();
              if (done) break;
              buffer += decoder.decode(value, { stream: true });
              const lines = buffer.split("\n");
              buffer = lines.pop() ?? "";

              for (const line of lines) {
                const trimmed = line.trim();
                if (!trimmed.startsWith("data:")) continue;
                const data = trimmed.slice(5).trim();
                if (!data || data === "[DONE]") continue;

                try {
                  const chunk = JSON.parse(data) as {
                    choices?: Array<{ delta?: { content?: string } }>;
                  };
                  const delta = chunk.choices?.[0]?.delta?.content;
                  if (delta) {
                    controller.enqueue(encoder.encode(JSON.stringify({ delta }) + "\n"));
                  }
                } catch {
                  // ignora chunks malformados
                }
              }
            }
          } catch (err) {
            console.error(`[ai-stream/${provider}] read error`, err);
          } finally {
            controller.close();
          }
        },
      });

      return { stream, provider };
    } catch (err) {
      console.warn(`[ai-stream/${provider}] fetch error`, err);
      continue;
    }
  }

  return null;
}

/**
 * Tenta extrair JSON da resposta da IA mesmo quando vem com texto extra
 * ou cercado por code fences ```json ... ```.
 */
export function safeParseJson<T = unknown>(raw: string): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    // continua
  }
  const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]) as T;
    } catch {
      // continua
    }
  }
  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]) as T;
    } catch {
      return null;
    }
  }
  return null;
}
