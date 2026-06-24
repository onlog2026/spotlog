import "server-only";

/**
 * Cliente Apollo.io — prospecção massiva (232M+ contatos B2B globais)
 *
 * Auth via `APOLLO_API_KEY` (env var). Sem a key, retorna fallback gracioso.
 * Docs: https://docs.apollo.io/reference
 */

export type ApolloPersonSearchInput = {
  q_keywords?: string;
  q_organization_name?: string;
  person_titles?: string[];
  person_locations?: string[];
  organization_locations?: string[];
  organization_industry_tag_ids?: string[];
  organization_num_employees_ranges?: string[]; // ex: ["1,10","11,50"]
  page?: number;
  per_page?: number;
};

export type ApolloPerson = {
  id: string;
  first_name: string;
  last_name_obfuscated?: string;
  last_name?: string;
  title: string | null;
  email?: string;
  has_email?: boolean;
  has_direct_phone?: string;
  organization?: {
    name: string;
    primary_domain?: string;
    industry?: string;
    estimated_num_employees?: number;
    website_url?: string;
  };
  city?: string;
  state?: string;
  country?: string;
};

export type ApolloSearchResult = {
  ok: true;
  total_entries: number;
  people: ApolloPerson[];
  page: number;
  per_page: number;
} | {
  ok: false;
  error: string;
};

const APOLLO_BASE = "https://api.apollo.io/api/v1";

function hasKey(): boolean {
  return !!process.env.APOLLO_API_KEY;
}

/**
 * Busca pessoas no Apollo (mixed_people/search é o endpoint pago — usamos api_search
 * que tem versão limitada free com até 25 resultados visíveis).
 *
 * IMPORTANTE: Apollo retorna sobrenomes obfuscados (`last_name_obfuscated`) nos
 * resultados gratuitos. Email só vem quando o user "desbloqueia" o contato no
 * dashboard Apollo OU consome créditos via `/people/match`.
 */
export async function apolloSearchPeople(
  input: ApolloPersonSearchInput,
): Promise<ApolloSearchResult> {
  if (!hasKey()) {
    return { ok: false, error: "Apollo desabilitado: configure APOLLO_API_KEY nas env vars." };
  }

  const body = {
    page: input.page ?? 1,
    per_page: Math.min(input.per_page ?? 25, 100),
    q_keywords: input.q_keywords,
    q_organization_name: input.q_organization_name,
    person_titles: input.person_titles,
    person_locations: input.person_locations,
    organization_locations: input.organization_locations,
    organization_industry_tag_ids: input.organization_industry_tag_ids,
    organization_num_employees_ranges: input.organization_num_employees_ranges,
  };

  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 30_000);
    const res = await fetch(`${APOLLO_BASE}/mixed_people/search`, {
      method: "POST",
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        accept: "application/json",
        "X-Api-Key": process.env.APOLLO_API_KEY!,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(t);

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Apollo ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as {
      total_entries?: number;
      people?: ApolloPerson[];
      pagination?: { page?: number; per_page?: number };
    };
    return {
      ok: true,
      total_entries: json.total_entries ?? 0,
      people: json.people ?? [],
      page: json.pagination?.page ?? body.page,
      per_page: json.pagination?.per_page ?? body.per_page,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown_error",
    };
  }
}

/**
 * Tenta desbloquear email + telefone de um contato específico (consome créditos).
 * Use com cautela.
 */
export async function apolloMatchPerson(input: {
  first_name?: string;
  last_name?: string;
  email?: string;
  organization_name?: string;
  domain?: string;
}): Promise<ApolloSearchResult> {
  if (!hasKey()) {
    return { ok: false, error: "Apollo desabilitado: configure APOLLO_API_KEY." };
  }
  try {
    const res = await fetch(`${APOLLO_BASE}/people/match`, {
      method: "POST",
      headers: {
        "Cache-Control": "no-cache",
        "Content-Type": "application/json",
        accept: "application/json",
        "X-Api-Key": process.env.APOLLO_API_KEY!,
      },
      body: JSON.stringify(input),
    });
    if (!res.ok) return { ok: false, error: `Apollo ${res.status}` };
    const json = (await res.json()) as { person?: ApolloPerson };
    return { ok: true, total_entries: json.person ? 1 : 0, people: json.person ? [json.person] : [], page: 1, per_page: 1 };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "unknown_error" };
  }
}

/**
 * Normaliza um Apollo person em um candidato a lead Spotlog.
 */
export function normalizeApolloPerson(p: ApolloPerson) {
  const fullName = [p.first_name, p.last_name ?? p.last_name_obfuscated?.replace(/\*/g, "")]
    .filter(Boolean)
    .join(" ")
    .trim();
  return {
    apollo_id: p.id,
    full_name: fullName || p.first_name || "Sem nome",
    job_title: p.title ?? null,
    email: p.email ?? null,
    has_email: p.has_email ?? false,
    has_phone: p.has_direct_phone === "Yes",
    company_name: p.organization?.name ?? null,
    company_domain: p.organization?.primary_domain ?? null,
    company_industry: p.organization?.industry ?? null,
    company_employees: p.organization?.estimated_num_employees ?? null,
    city: p.city ?? null,
    state: p.state ?? null,
    country: p.country ?? null,
  };
}
