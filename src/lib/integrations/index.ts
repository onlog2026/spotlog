import { createAdminClient } from "@/lib/supabase/admin";

export type IntegrationProvider =
  | "openai"
  | "anthropic"
  | "resend"
  | "sendgrid"
  | "evolution"
  | "zapi"
  | "digisac"
  | "apollo"
  | "google_places"
  | "apify"
  | "linkedin"
  | "hubspot"
  | "rd_station"
  | "pipedrive"
  | "openrouter"
  | "google_calendar"
  | "webhook";

export type IntegrationRow = {
  id: string;
  organization_id: string;
  provider: IntegrationProvider;
  is_active: boolean;
  display_name: string | null;
  credentials: Record<string, string>;
  settings: Record<string, unknown>;
  last_test_ok: boolean | null;
};

// Cache em memória das integrações (best-effort, por instância) para evitar
// uma leitura no Supabase a cada chamada — o inbox dispara várias por refresh.
type IntegrationCacheEntry = { at: number; row: IntegrationRow | null };
const integrationCache = new Map<string, IntegrationCacheEntry>();
const INTEGRATION_TTL_MS = 15_000;

/** Limpa o cache de uma integração (chamar ao salvar/atualizar no painel). */
export function invalidateIntegrationCache(
  organization_id: string,
  provider?: IntegrationProvider,
) {
  if (provider) {
    integrationCache.delete(`${organization_id}:${provider}`);
    return;
  }
  for (const key of [...integrationCache.keys()]) {
    if (key.startsWith(`${organization_id}:`)) integrationCache.delete(key);
  }
}

/**
 * Resolve integração de uma org. Estratégia de fallback:
 * 1. Cache em memória (TTL curto).
 * 2. Registro `integrations` ativo na organização (no DB).
 * 3. Variáveis de ambiente globais.
 * Retorna null se nenhum disponível.
 */
export async function getIntegration(
  organization_id: string,
  provider: IntegrationProvider,
): Promise<IntegrationRow | null> {
  const cacheKey = `${organization_id}:${provider}`;
  const cached = integrationCache.get(cacheKey);
  if (cached && Date.now() - cached.at < INTEGRATION_TTL_MS) return cached.row;

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .eq("organization_id", organization_id)
    .eq("provider", provider)
    .eq("is_active", true)
    .maybeSingle();

  let row: IntegrationRow | null = null;
  if (data) {
    row = data as unknown as IntegrationRow;
  } else {
    const envFallback = envFallbackFor(provider);
    if (envFallback) {
      row = {
        id: "env",
        organization_id,
        provider,
        is_active: true,
        display_name: `${provider} (env)`,
        credentials: envFallback,
        settings: {},
        last_test_ok: true,
      };
    }
  }

  integrationCache.set(cacheKey, { at: Date.now(), row });
  return row;
}

function envFallbackFor(
  provider: IntegrationProvider,
): Record<string, string> | null {
  switch (provider) {
    case "openai":
      return process.env.OPENAI_API_KEY
        ? { api_key: process.env.OPENAI_API_KEY }
        : null;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY
        ? { api_key: process.env.ANTHROPIC_API_KEY }
        : null;
    case "resend":
      return process.env.RESEND_API_KEY
        ? {
            api_key: process.env.RESEND_API_KEY,
            from_email: process.env.RESEND_FROM_EMAIL ?? "",
          }
        : null;
    case "apollo":
      return process.env.APOLLO_API_KEY
        ? { api_key: process.env.APOLLO_API_KEY }
        : null;
    case "google_places":
      return process.env.GOOGLE_PLACES_API_KEY
        ? { api_key: process.env.GOOGLE_PLACES_API_KEY }
        : null;
    case "apify":
      return process.env.APIFY_API_TOKEN
        ? { api_token: process.env.APIFY_API_TOKEN }
        : null;
    case "evolution":
      return process.env.EVOLUTION_API_URL && process.env.EVOLUTION_API_KEY
        ? {
            url: process.env.EVOLUTION_API_URL,
            api_key: process.env.EVOLUTION_API_KEY,
            instance: process.env.EVOLUTION_INSTANCE ?? "default",
          }
        : null;
    case "zapi":
      return process.env.ZAPI_INSTANCE_ID && process.env.ZAPI_TOKEN
        ? {
            instance_id: process.env.ZAPI_INSTANCE_ID,
            token: process.env.ZAPI_TOKEN,
            client_token: process.env.ZAPI_CLIENT_TOKEN ?? "",
          }
        : null;
    case "openrouter":
      return process.env.OPENROUTER_API_KEY
        ? { api_key: process.env.OPENROUTER_API_KEY }
        : null;
    case "digisac":
      return process.env.DIGISAC_TOKEN && process.env.DIGISAC_BASE_URL
        ? {
            base_url: process.env.DIGISAC_BASE_URL,
            token: process.env.DIGISAC_TOKEN,
            service_id: process.env.DIGISAC_SERVICE_ID ?? "",
          }
        : null;
    default:
      return null;
  }
}

export class IntegrationNotConfigured extends Error {
  provider: IntegrationProvider;
  constructor(provider: IntegrationProvider) {
    super(
      `Integração "${provider}" não está configurada. Adicione em /app/admin/integracoes.`,
    );
    this.provider = provider;
  }
}

export function requireIntegration(
  i: IntegrationRow | null,
  provider: IntegrationProvider,
): asserts i is IntegrationRow {
  if (!i) throw new IntegrationNotConfigured(provider);
}
