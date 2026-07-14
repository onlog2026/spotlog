import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIntegration } from "@/lib/integrations";

/**
 * BUSCA PROFUNDA (Apify) — assíncrona, pra caber no limite de 60s do serverless.
 *
 * Padrão: START (dispara o run do actor Google Places, volta em ~1s) → o job
 * fica em prospecting_jobs com o run_id → COLLECT (chamado por botão/refresh)
 * confere o status e, quando terminar, baixa o dataset e ANEXA os resultados na
 * campanha. Zero DDL (usa prospecting_jobs.query jsonb).
 *
 * É raspagem LEGÍTIMA de Google Maps via infraestrutura da Apify — sem quebrar
 * Cloudflare/anti-bot.
 */

const ACTOR = "compass~crawler-google-places";

async function apifyToken(orgId: string): Promise<string | null> {
  const integ = await getIntegration(orgId, "apify").catch(() => null);
  return (
    (integ?.credentials?.api_token as string | undefined) ||
    (integ?.credentials?.token as string | undefined) ||
    process.env.APIFY_TOKEN ||
    null
  );
}

/**
 * Gera MÚLTIPLAS queries (termo × cidade) pra cobertura maior no Google Maps —
 * "farmácia de manipulação São Paulo" e "farmácia de manipulação Campinas"
 * viram buscas separadas (cada uma acha seus próprios resultados).
 */
function buildQueries(icp: Record<string, unknown>): string[] {
  const arr = (k: string) => (Array.isArray(icp[k]) ? (icp[k] as string[]) : []);
  const terms = [...arr("industries"), ...arr("keywords")].filter(Boolean);
  const bairro = ((icp.neighborhood as string) ?? "").trim();
  const cities = arr("cities");
  const states = arr("states");
  const locs =
    cities.length > 0
      ? cities.map((c) => [bairro, c, states[0]].filter(Boolean).join(" "))
      : states.length > 0
        ? states
        : [""];

  const queries: string[] = [];
  for (const t of terms.length > 0 ? terms : ["empresas"]) {
    for (const l of locs) {
      queries.push([t, l].filter(Boolean).join(" "));
      if (queries.length >= 10) return queries; // teto de segurança do actor
    }
  }
  return queries.length > 0 ? queries : ["empresas"];
}

/** Dispara o run do Apify e registra o job. Retorna rápido. */
export async function startApifyDeep(
  orgId: string,
  campaignId: string,
): Promise<{ ok: boolean; error?: string; runId?: string }> {
  const token = await apifyToken(orgId);
  if (!token) return { ok: false, error: "Apify sem token (APIFY_TOKEN)." };
  const admin = createAdminClient();

  const { data: camp } = await admin
    .from("prospecting_campaigns")
    .select("icp")
    .eq("id", campaignId)
    .eq("organization_id", orgId)
    .maybeSingle();
  const icp = ((camp as { icp?: Record<string, unknown> } | null)?.icp ?? {}) as Record<string, unknown>;
  const queries = buildQueries(icp);
  const limit = Math.min(Number(icp.limit ?? 30) || 30, 200);
  const perQuery = Math.max(5, Math.ceil(limit / queries.length));

  // Já tem um run em andamento? não duplica.
  const { data: running } = await admin
    .from("prospecting_jobs")
    .select("id, query")
    .eq("organization_id", orgId)
    .eq("campaign_id", campaignId)
    .eq("source", "apify")
    .eq("status", "running")
    .limit(1)
    .maybeSingle();
  if (running) {
    return { ok: true, runId: (running as { query?: { run_id?: string } }).query?.run_id };
  }

  let res: Response;
  try {
    res = await fetch(
      `https://api.apify.com/v2/acts/${ACTOR}/runs?token=${encodeURIComponent(token)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          searchStringsArray: queries,
          maxCrawledPlacesPerSearch: perQuery,
          language: "pt-BR",
          maxImages: 0,
          scrapeReviewsPersonalData: false,
        }),
      },
    );
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "rede" };
  }
  if (!res.ok) return { ok: false, error: `Apify ${res.status}` };
  const json = (await res.json()) as {
    data?: { id?: string; defaultDatasetId?: string };
  };
  const runId = json.data?.id;
  const datasetId = json.data?.defaultDatasetId;
  if (!runId) return { ok: false, error: "Apify não retornou run id." };

  await admin.from("prospecting_jobs").insert({
    organization_id: orgId,
    campaign_id: campaignId,
    source: "apify",
    status: "running",
    query: { run_id: runId, dataset_id: datasetId, q: queries.join(" | ") },
    started_at: new Date().toISOString(),
  });
  return { ok: true, runId };
}

/** Confere o run e, se pronto, baixa o dataset e anexa os resultados. */
export async function collectApifyDeep(
  orgId: string,
  campaignId: string,
): Promise<{ status: "running" | "done" | "none" | "error"; added?: number; error?: string }> {
  const token = await apifyToken(orgId);
  if (!token) return { status: "error", error: "Apify sem token." };
  const admin = createAdminClient();

  const { data: jobRow } = await admin
    .from("prospecting_jobs")
    .select("id, query")
    .eq("organization_id", orgId)
    .eq("campaign_id", campaignId)
    .eq("source", "apify")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!jobRow) return { status: "none" };
  const job = jobRow as { id: string; query: { run_id?: string; dataset_id?: string } };
  const runId = job.query?.run_id;
  if (!runId) return { status: "error", error: "job sem run id" };

  // status do run
  const st = await fetch(
    `https://api.apify.com/v2/actor-runs/${runId}?token=${encodeURIComponent(token)}`,
  ).then((r) => (r.ok ? r.json() : null)).catch(() => null);
  const status = (st as { data?: { status?: string; defaultDatasetId?: string } } | null)?.data?.status;
  const datasetId = job.query?.dataset_id ??
    (st as { data?: { defaultDatasetId?: string } } | null)?.data?.defaultDatasetId;

  if (status === "RUNNING" || status === "READY") return { status: "running" };
  if (status !== "SUCCEEDED") {
    await admin.from("prospecting_jobs").update({ status: "failed" }).eq("id", job.id);
    return { status: "error", error: `run ${status ?? "desconhecido"}` };
  }

  // baixa o dataset
  const items = (await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${encodeURIComponent(token)}`,
  ).then((r) => (r.ok ? r.json() : [])).catch(() => [])) as Array<Record<string, unknown>>;

  // dedupe contra o que já existe na campanha (por external_id / telefone)
  const { data: existing } = await admin
    .from("prospecting_results")
    .select("external_id, company_data")
    .eq("organization_id", orgId)
    .eq("campaign_id", campaignId);
  const seen = new Set<string>();
  for (const e of (existing ?? []) as Array<{ external_id: string | null; company_data: Record<string, unknown> | null }>) {
    if (e.external_id) seen.add(String(e.external_id));
    const ph = (e.company_data?.phone as string | undefined) ?? "";
    if (ph) seen.add(ph.replace(/\D/g, ""));
  }

  const rows: Record<string, unknown>[] = [];
  for (const it of Array.isArray(items) ? items : []) {
    const extId = String(it.placeId ?? it.id ?? "");
    const phone = String(it.phone ?? it.phoneUnformatted ?? "");
    const phoneKey = phone.replace(/\D/g, "");
    if ((extId && seen.has(extId)) || (phoneKey && seen.has(phoneKey))) continue;
    if (extId) seen.add(extId);
    if (phoneKey) seen.add(phoneKey);
    rows.push({
      organization_id: orgId,
      campaign_id: campaignId,
      job_id: job.id,
      source: "apify",
      external_id: extId || null,
      company_data: {
        name: it.title,
        address: it.address,
        phone: phone || undefined,
        website: it.website,
        industry: it.categoryName ?? it.category,
        city: it.city,
        state: it.state,
        rating: typeof it.totalScore === "number" ? it.totalScore : undefined,
        reviews_count:
          typeof it.reviewsCount === "number" ? it.reviewsCount : undefined,
        maps_url: typeof it.url === "string" ? it.url : undefined,
      },
      contact_data: null,
      match_score: 45,
      status: "new",
    });
  }

  if (rows.length > 0) {
    await admin.from("prospecting_results").insert(rows);
    const { data: c } = await admin
      .from("prospecting_campaigns")
      .select("found_count")
      .eq("id", campaignId)
      .maybeSingle();
    await admin
      .from("prospecting_campaigns")
      .update({ found_count: (((c as { found_count?: number } | null)?.found_count) ?? 0) + rows.length })
      .eq("id", campaignId);
  }
  await admin.from("prospecting_jobs").update({ status: "completed", finished_at: new Date().toISOString() }).eq("id", job.id);
  return { status: "done", added: rows.length };
}
