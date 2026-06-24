/**
 * Spotlog SDR — Enrichment Engine
 *
 * Enriquece empresas via CNPJ (BrasilAPI pública, gratuita) ou domínio.
 * Cache em `company_enrichment` evita re-consultar a mesma chave.
 */
import { getSdrClient } from "@/lib/sdr/db";

export interface EnrichedCompany {
  cnpj?: string;
  domain?: string;
  razao_social?: string;
  nome_fantasia?: string;
  cnae_principal?: string;
  cnae_descricao?: string;
  porte?: string;
  capital_social?: number;
  data_inicio?: string;
  situacao?: string;
  endereco?: {
    logradouro?: string;
    numero?: string;
    bairro?: string;
    municipio?: string;
    uf?: string;
    cep?: string;
  };
  email?: string;
  telefone?: string;
  socios?: Array<{ nome: string; qualificacao?: string }>;
  raw?: Record<string, unknown>;
}

const TIMEOUT_MS = 30000; // BrasilAPI pode demorar em horário de pico

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("timeout")), ms),
    ),
  ]);
}

export function normalizeCnpj(cnpj: string): string {
  return cnpj.replace(/\D/g, "");
}

/**
 * Enriquece empresa por CNPJ. Cache → BrasilAPI → cache.
 */
export async function enrichCompanyByCnpj(
  orgId: string,
  cnpjRaw: string,
): Promise<EnrichedCompany | null> {
  const cnpj = normalizeCnpj(cnpjRaw);
  if (cnpj.length !== 14) return null;

  // 1. Cache lookup (best-effort — falha silenciosamente se tabela fora do cache)
  try {
    const supabase = await getSdrClient();
    const { data: cached } = await supabase
      .from("company_enrichment")
      .select("enriched_data")
      .eq("organization_id", orgId)
      .eq("cnpj", cnpj)
      .maybeSingle();
    if (cached?.enriched_data) {
      return cached.enriched_data as EnrichedCompany;
    }
  } catch (e) {
    console.warn("[enrich.cache.read]", e);
  }

  // 2. BrasilAPI lookup (com retry simples)
  let lastError = "unknown";
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await withTimeout(
        fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        }),
        TIMEOUT_MS,
      );
      if (!res.ok) {
        lastError = `brasilapi_${res.status}`;
        // 404 = CNPJ inexistente, não tenta de novo
        if (res.status === 404) break;
        continue;
      }
      const json = (await res.json()) as Record<string, unknown>;
      const normalized: EnrichedCompany = normalizeBrasilApiPayload(json);
      normalized.cnpj = cnpj;

      // 3. Salva no cache (best-effort)
      try {
        const supabase = await getSdrClient();
        await supabase.from("company_enrichment").upsert(
          {
            organization_id: orgId,
            cnpj,
            enriched_data: normalized,
            source: "brasilapi",
          },
          { onConflict: "organization_id,cnpj" },
        );
      } catch (e) {
        console.warn("[enrich.cache.write]", e);
      }

      return normalized;
    } catch (err) {
      lastError = err instanceof Error ? err.message : "unknown";
      console.warn(`[enrich.cnpj] attempt ${attempt}`, cnpj, lastError);
    }
  }
  console.warn(`[enrich.cnpj] giving up`, cnpj, "lastError:", lastError);
  return null;
}

/**
 * Stub para enrichment por domínio. TODO: integrar Hunter.io / Clearbit /
 * Apollo (vão exigir API key em env). Hoje só normaliza domínio.
 */
export async function enrichCompanyByDomain(
  orgId: string,
  domainRaw: string,
): Promise<EnrichedCompany | null> {
  const domain = domainRaw
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .trim();
  if (!domain) return null;

  const supabase = await getSdrClient();
  const { data: cached } = await supabase
    .from("company_enrichment")
    .select("enriched_data")
    .eq("organization_id", orgId)
    .eq("domain", domain)
    .maybeSingle();

  if (cached?.enriched_data) return cached.enriched_data as EnrichedCompany;

  // Placeholder: salva no cache só com o domínio normalizado
  const stub: EnrichedCompany = { domain };
  await supabase.from("company_enrichment").upsert(
    {
      organization_id: orgId,
      domain,
      enriched_data: stub,
      source: "stub",
    },
    { onConflict: "organization_id,domain" },
  );
  return stub;
}

function normalizeBrasilApiPayload(p: Record<string, unknown>): EnrichedCompany {
  const get = <T = unknown>(k: string): T | undefined => p[k] as T | undefined;
  const qsa = (get<unknown[]>("qsa") ?? []) as Array<Record<string, unknown>>;
  const cnaes = (get<unknown[]>("cnaes_secundarios") ?? []) as Array<
    Record<string, unknown>
  >;
  void cnaes;
  return {
    razao_social: get<string>("razao_social"),
    nome_fantasia: get<string>("nome_fantasia") || undefined,
    cnae_principal: get<string>("cnae_fiscal")?.toString(),
    cnae_descricao: get<string>("cnae_fiscal_descricao"),
    porte: get<string>("porte"),
    capital_social: Number(get<number>("capital_social") ?? 0) || undefined,
    data_inicio: get<string>("data_inicio_atividade"),
    situacao: get<string>("descricao_situacao_cadastral"),
    endereco: {
      logradouro: get<string>("logradouro"),
      numero: get<string>("numero"),
      bairro: get<string>("bairro"),
      municipio: get<string>("municipio"),
      uf: get<string>("uf"),
      cep: get<string>("cep"),
    },
    email: get<string>("email") || undefined,
    telefone:
      [get<string>("ddd_telefone_1"), get<string>("ddd_telefone_2")]
        .filter(Boolean)
        .join(" / ") || undefined,
    socios: qsa.map((s) => ({
      nome: String(s.nome_socio ?? s.nome ?? ""),
      qualificacao: String(s.qualificacao_socio ?? ""),
    })),
    raw: p,
  };
}

/**
 * Enriquece lote de CNPJs em paralelo (limitado a 5 concorrentes).
 */
export async function enrichBatchCnpjs(
  orgId: string,
  cnpjs: string[],
): Promise<Array<{ cnpj: string; data: EnrichedCompany | null; error?: string }>> {
  const results: Array<{ cnpj: string; data: EnrichedCompany | null; error?: string }> = [];
  // Concorrência 2 (não 5) — BrasilAPI rate-limita rápido
  const chunks: string[][] = [];
  for (let i = 0; i < cnpjs.length; i += 2) chunks.push(cnpjs.slice(i, i + 2));
  for (const chunk of chunks) {
    const batch = await Promise.all(
      chunk.map(async (cnpj) => {
        try {
          const data = await enrichCompanyByCnpj(orgId, cnpj);
          return { cnpj: normalizeCnpj(cnpj), data, error: data ? undefined : "BrasilAPI sem dados ou timeout" };
        } catch (err) {
          return {
            cnpj: normalizeCnpj(cnpj),
            data: null,
            error: err instanceof Error ? err.message : "erro desconhecido",
          };
        }
      }),
    );
    results.push(...batch);
  }
  return results;
}
