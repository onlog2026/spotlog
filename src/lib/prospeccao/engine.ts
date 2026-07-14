/**
 * Spotlog — Engine de Prospecção
 *
 * Roda uma campanha em background. Hoje suporta:
 *   - cnpj_list   → enriquece CNPJs via BrasilAPI (gratuita)
 *   - segmento    → gera resultados de empresas já cadastradas filtrando por industry/state
 *   - domain_list → cria resultados stub por domínio (placeholder pra futuro scraping)
 *
 * Cada resultado vira uma linha em `prospecting_results` com `company_data` JSON.
 * O job parent é atualizado quando termina.
 */
import { createAdminClient } from "@/lib/supabase/admin";
import {
  enrichBatchCnpjs,
  normalizeCnpj,
  type EnrichedCompany,
} from "@/lib/sdr/enrich";
import { searchProspects } from "@/lib/integrations/prospecting";

export type CampaignType = "cnpj_list" | "segmento" | "domain_list" | "internet";

export type CampaignICP = {
  type: CampaignType;
  cnpjs?: string[];
  domains?: string[];
  industries?: string[];
  states?: string[];
  cities?: string[];
  neighborhood?: string;
  keywords?: string[];
  limit?: number;
};

type Result = {
  company_data: Record<string, unknown>;
  contact_data: Record<string, unknown> | null;
  match_score: number;
  external_id?: string;
};

/**
 * Run a campaign asynchronously. Designed to be fire-and-forget.
 * Updates job status; never throws to caller (logs warn).
 */
export async function runCampaign(campaignId: string): Promise<void> {
  const admin = createAdminClient();

  // 1. Load campaign
  const { data: camp, error: campErr } = await admin
    .from("prospecting_campaigns")
    .select("*")
    .eq("id", campaignId)
    .maybeSingle();

  if (campErr || !camp) {
    console.warn("[engine.runCampaign] campaign not found", campaignId, campErr);
    return;
  }

  const ca = camp as unknown as {
    id: string;
    organization_id: string;
    icp: CampaignICP & { type?: CampaignType };
    sources: string[];
    daily_limit: number;
    total_target: number;
    found_count: number;
  };

  const type: CampaignType =
    (ca.icp?.type as CampaignType) ||
    ((ca.sources?.[0] as CampaignType) ?? "segmento");

  // 2. Create job row
  const { data: jobIns } = await admin
    .from("prospecting_jobs")
    .insert({
      organization_id: ca.organization_id,
      campaign_id: ca.id,
      source: type,
      status: "running",
      query: ca.icp ?? {},
      started_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  const jobId = (jobIns as { id: string } | null)?.id;
  if (!jobId) return;

  try {
    let results: Result[] = [];
    if (type === "cnpj_list") {
      results = await runCnpjList(ca.organization_id, ca.icp?.cnpjs ?? []);
    } else if (type === "segmento") {
      results = await runSegmento(ca.organization_id, ca.icp);
    } else if (type === "domain_list") {
      results = await runDomainList(ca.icp?.domains ?? []);
    } else if (type === "internet") {
      results = await runInternet(ca.organization_id, ca.icp);
    }

    if (results.length > 0) {
      const rows = results.map((r) => ({
        organization_id: ca.organization_id,
        campaign_id: ca.id,
        job_id: jobId,
        source: type,
        external_id: r.external_id,
        company_data: r.company_data,
        contact_data: r.contact_data,
        decision_maker_data: null,
        match_score: r.match_score,
        status: "new",
      }));
      await admin.from("prospecting_results").insert(rows);
      await admin
        .from("prospecting_campaigns")
        .update({
          found_count: (ca.found_count ?? 0) + results.length,
          status: "completed",
        })
        .eq("id", ca.id);
    } else {
      await admin
        .from("prospecting_campaigns")
        .update({ status: "completed" })
        .eq("id", ca.id);
    }

    await admin
      .from("prospecting_jobs")
      .update({
        status: "completed",
        total_found: results.length,
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);
  } catch (err) {
    console.warn("[engine.runCampaign] failed", campaignId, err);
    await admin
      .from("prospecting_jobs")
      .update({
        status: "error",
        error: err instanceof Error ? err.message : "fail",
        finished_at: new Date().toISOString(),
      })
      .eq("id", jobId);
    await admin
      .from("prospecting_campaigns")
      .update({ status: "error" })
      .eq("id", ca.id);
  }
}

/**
 * Busca GRÁTIS na internet (OpenStreetMap). Nicho + cidade → empresas reais
 * com nome/endereço/telefone/site/e-mail/WhatsApp. Sem chave, sem custo.
 */
async function runInternet(
  orgId: string,
  icp: CampaignICP,
): Promise<Result[]> {
  // Google Places (melhor cobertura + celular/WhatsApp) como PRIMÁRIO;
  // OpenStreetMap como reserva grátis. searchProspects faz o failover: se o
  // Google falhar/estourar cota, o OSM continua (o erro fica no diagnóstico).
  const { hits } = await searchProspects(
    orgId,
    {
      industries: icp.industries,
      keywords: icp.keywords,
      cities: icp.cities,
      states: icp.states,
      neighborhood: icp.neighborhood,
      limit: icp.limit,
    },
    ["google_places", "openstreetmap"],
  );
  return hits.map((h) => {
    let score = 45;
    if (h.company.phone) score += 20;
    if (h.company.website) score += 20;
    if (h.contact?.email) score += 15;
    return {
      external_id: h.external_id,
      match_score: Math.min(score, 100),
      company_data: h.company as Record<string, unknown>,
      contact_data: (h.contact ?? null) as Record<string, unknown> | null,
    };
  });
}

async function runCnpjList(
  orgId: string,
  cnpjsRaw: string[],
): Promise<Result[]> {
  const cnpjs = cnpjsRaw
    .map((c) => normalizeCnpj(c))
    .filter((c) => c.length === 14);
  if (cnpjs.length === 0) return [];

  const enriched = await enrichBatchCnpjs(orgId, cnpjs);
  return enriched
    .filter((e) => e.data !== null)
    .map((e) => toResult(e.cnpj, e.data!));
}

function toResult(cnpj: string, ec: EnrichedCompany): Result {
  const name = ec.nome_fantasia || ec.razao_social || "Empresa";
  const score = scoreEnriched(ec);
  return {
    external_id: cnpj,
    match_score: score,
    company_data: {
      name,
      legal_name: ec.razao_social,
      cnpj,
      industry: ec.cnae_descricao,
      size: ec.porte,
      city: ec.endereco?.municipio,
      state: ec.endereco?.uf,
      address: [
        ec.endereco?.logradouro,
        ec.endereco?.numero,
        ec.endereco?.bairro,
      ]
        .filter(Boolean)
        .join(", "),
      phone: ec.telefone,
      description: `${ec.cnae_descricao ?? ""}${
        ec.capital_social ? ` · Capital R$${ec.capital_social}` : ""
      }`,
      // Decisores prováveis (QSA da Receita via BrasilAPI — grátis, real)
      socios: ec.socios && ec.socios.length > 0 ? ec.socios : undefined,
    },
    contact_data: ec.email
      ? {
          email: ec.email,
          full_name: ec.socios?.[0]?.nome,
          job_title: ec.socios?.[0]?.qualificacao,
        }
      : ec.socios && ec.socios.length > 0
        ? {
            full_name: ec.socios[0].nome,
            job_title: ec.socios[0].qualificacao,
          }
        : null,
  };
}

function scoreEnriched(ec: EnrichedCompany): number {
  let s = 40;
  if (ec.email) s += 25;
  if (ec.telefone) s += 15;
  if (ec.cnae_descricao) s += 10;
  if (ec.situacao && /ativa/i.test(ec.situacao)) s += 10;
  return Math.min(100, s);
}

async function runSegmento(
  orgId: string,
  icp: CampaignICP,
): Promise<Result[]> {
  const admin = createAdminClient();
  let q = admin
    .from("companies")
    .select(
      "id, name, legal_name, cnpj, domain, website, industry, size, city, state, phone, description",
    )
    .eq("organization_id", orgId)
    .limit(100);

  if (icp.industries && icp.industries.length > 0) {
    const orFilter = icp.industries
      .map((i) => `industry.ilike.%${i.replace(/[%,]/g, "")}%`)
      .join(",");
    q = q.or(orFilter);
  }
  if (icp.states && icp.states.length > 0) q = q.in("state", icp.states);
  if (icp.cities && icp.cities.length > 0) q = q.in("city", icp.cities);

  const { data } = await q;
  if (!data) return [];

  return (data as unknown as Array<Record<string, unknown>>).map((c) => ({
    external_id: (c.id as string) ?? undefined,
    match_score: 70,
    company_data: c,
    contact_data: null,
  }));
}

async function runDomainList(domainsRaw: string[]): Promise<Result[]> {
  const domains = domainsRaw
    .map((d) =>
      d
        .toLowerCase()
        .replace(/^https?:\/\//, "")
        .replace(/^www\./, "")
        .replace(/\/.*$/, "")
        .trim(),
    )
    .filter(Boolean);
  return domains.map((domain) => ({
    external_id: domain,
    match_score: 35,
    company_data: {
      name: domain,
      domain,
      website: `https://${domain}`,
    },
    contact_data: null,
  }));
}
