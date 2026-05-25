import { createAdminClient } from "@/lib/supabase/admin";

export type IntegrationProvider =
  | "openai"
  | "anthropic"
  | "resend"
  | "sendgrid"
  | "evolution"
  | "zapi"
  | "apollo"
  | "google_places"
  | "linkedin"
  | "hubspot"
  | "rd_station"
  | "pipedrive"
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

/**
 * Resolve integração de uma org. Estratégia de fallback:
 * 1. Procura registro `integrations` ativo na organização (no DB).
 * 2. Se não existir, tenta variáveis de ambiente globais.
 * Retorna null se nenhum dos dois disponíveis.
 */
export async function getIntegration(
  organization_id: string,
  provider: IntegrationProvider,
): Promise<IntegrationRow | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("integrations")
    .select("*")
    .eq("organization_id", organization_id)
    .eq("provider", provider)
    .eq("is_active", true)
    .maybeSingle();

  if (data) return data as unknown as IntegrationRow;

  // Fallback ENV
  const envFallback = envFallbackFor(provider);
  if (envFallback) {
    return {
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

  return null;
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
