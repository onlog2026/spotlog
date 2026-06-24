/**
 * Spotlog SDR — Lead Scoring
 *
 * Heurística simples baseada em sinais públicos. Produz score 0-100
 * com `reasons` explicáveis e persiste em `lead_scores`.
 */
import { getSdrClient } from "@/lib/sdr/db";
import type { EnrichedCompany } from "./enrich";

export interface LeadInput {
  id: string;
  organization_id: string;
  email?: string | null;
  company_name?: string | null;
  job_title?: string | null;
}

export interface CompanyInput {
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  website?: string | null;
  size?: string | null;
}

export interface ScoreReason {
  label: string;
  points: number;
}

export interface ScoreResult {
  score: number;
  reasons: ScoreReason[];
}

const ICP_SEGMENTS = [
  "ecommerce",
  "e-commerce",
  "farma",
  "farmácia",
  "manipulação",
  "manipulacao",
  "dermocosméticos",
  "dermocosmeticos",
  "suplementos",
  "cosméticos",
];

const SP_GRANDE = [
  "são paulo",
  "sao paulo",
  "guarulhos",
  "osasco",
  "santo andré",
  "santo andre",
  "são bernardo",
  "sao bernardo",
  "diadema",
  "barueri",
  "cotia",
  "mauá",
  "maua",
  "taboão",
  "taboao",
  "carapicuíba",
  "carapicuiba",
];

const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "hotmail.com",
  "outlook.com",
  "yahoo.com",
  "yahoo.com.br",
  "uol.com.br",
  "bol.com.br",
  "icloud.com",
  "live.com",
  "terra.com.br",
]);

export function computeLeadScore(
  lead: LeadInput,
  company?: CompanyInput | null,
  enrichment?: EnrichedCompany | null,
): ScoreResult {
  const reasons: ScoreReason[] = [];
  let score = 0;

  // 1. Segmento ICP
  const segment = (
    company?.industry ||
    enrichment?.cnae_descricao ||
    ""
  ).toLowerCase();
  if (ICP_SEGMENTS.some((s) => segment.includes(s))) {
    reasons.push({ label: `Segmento ICP (${segment})`, points: 20 });
    score += 20;
  }

  // 2. Capital social
  const capital = enrichment?.capital_social ?? 0;
  if (capital > 100_000) {
    reasons.push({
      label: `Capital social R$ ${capital.toLocaleString("pt-BR")}`,
      points: 15,
    });
    score += 15;
  }

  // 3. Email corporativo
  if (lead.email) {
    const domain = lead.email.split("@")[1]?.toLowerCase().trim();
    if (domain && !FREE_EMAIL_DOMAINS.has(domain)) {
      reasons.push({ label: `Email corporativo (${domain})`, points: 15 });
      score += 15;
    }
  }

  // 4. Website
  if (company?.website || enrichment?.domain) {
    reasons.push({ label: "Tem website", points: 10 });
    score += 10;
  }

  // 5. SP / Grande SP
  const city = (
    company?.city ||
    enrichment?.endereco?.municipio ||
    ""
  ).toLowerCase();
  if (SP_GRANDE.some((c) => city.includes(c))) {
    reasons.push({ label: `Cidade ${city} (SP/GSP)`, points: 10 });
    score += 10;
  }

  // 6. Porte com mais de 5 funcionários (proxy via porte da BrasilAPI)
  const porte = (enrichment?.porte || company?.size || "").toUpperCase();
  if (porte.includes("ME") || porte.includes("EPP") || porte.includes("DEMAIS")) {
    reasons.push({ label: `Porte: ${porte}`, points: 10 });
    score += 10;
  }

  // Cap 0-100
  if (score > 100) score = 100;
  if (score < 0) score = 0;

  return { score, reasons };
}

/**
 * Aplica score ao lead — busca dados, calcula, persiste e devolve.
 */
export async function scoreAndPersistLead(leadId: string): Promise<ScoreResult | null> {
  const supabase = await getSdrClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, organization_id, email, company_name, job_title")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return null;

  // Tenta achar company correspondente (pelo nome)
  let company: CompanyInput | null = null;
  if (lead.company_name) {
    const { data: c } = await supabase
      .from("companies")
      .select("industry, city, state, website, size, cnpj, domain")
      .eq("organization_id", lead.organization_id)
      .ilike("name", lead.company_name)
      .maybeSingle();
    company = c as CompanyInput | null;
  }

  // Tenta achar enrichment já em cache pra essa company
  let enrichment: EnrichedCompany | null = null;
  if (company) {
    const cInfo = company as CompanyInput & { cnpj?: string; domain?: string };
    if (cInfo.cnpj) {
      const { data: enr } = await supabase
        .from("company_enrichment")
        .select("enriched_data")
        .eq("organization_id", lead.organization_id)
        .eq("cnpj", cInfo.cnpj)
        .maybeSingle();
      if (enr?.enriched_data) enrichment = enr.enriched_data as EnrichedCompany;
    }
  }

  // Desconto: já foi contatado nos últimos 90 dias?
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from("audit_logs")
    .select("id", { count: "exact", head: true })
    .eq("organization_id", lead.organization_id)
    .eq("entity", "lead")
    .eq("entity_id", lead.id)
    .gte("created_at", ninetyDaysAgo);

  const result = computeLeadScore(lead, company, enrichment);
  if ((count ?? 0) > 0) {
    result.score = Math.max(0, result.score - 20);
    result.reasons.push({
      label: "Já contatado nos últimos 90 dias",
      points: -20,
    });
  }

  // Persiste snapshot
  await supabase.from("lead_scores").insert({
    organization_id: lead.organization_id,
    lead_id: lead.id,
    score: result.score,
    reasons: result.reasons,
  });

  // Atualiza score consolidado no lead também
  await supabase
    .from("leads")
    .update({ score: result.score })
    .eq("id", lead.id);

  return result;
}
