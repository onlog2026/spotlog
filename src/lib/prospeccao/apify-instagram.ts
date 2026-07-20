import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { getIntegration } from "@/lib/integrations";

/**
 * FONTE INSTAGRAM (Apify) — mesmo padrão assíncrono do apify-deep.ts (Google
 * Maps): START (dispara o run do actor, volta rápido) → COLLECT (confere
 * status e, quando terminar, baixa o dataset e anexa os resultados).
 *
 * Extrai comentaristas de um post-alvo (perfil público, sem automatizar
 * conta pessoal do dono — via infraestrutura da Apify, não instagrapi).
 * Módulo licenciado: "prospeccao_avancada" (ver src/lib/entitlements.ts).
 */

const ACTOR = "apify~instagram-comment-scraper";

async function apifyToken(orgId: string): Promise<string | null> {
  const integ = await getIntegration(orgId, "apify").catch(() => null);
  return (
    (integ?.credentials?.api_token as string | undefined) ||
    (integ?.credentials?.token as string | undefined) ||
    process.env.APIFY_TOKEN ||
    null
  );
}

/** Dispara o run do Apify (comentaristas de posts) e registra o job. Retorna rápido. */
export async function startApifyInstagram(
  orgId: string,
  campaignId: string,
  postUrls: string[],
): Promise<{ ok: boolean; error?: string; runId?: string }> {
  const urls = postUrls.map((u) => u.trim()).filter(Boolean).slice(0, 5);
  if (urls.length === 0) return { ok: false, error: "Informe ao menos 1 link de post do Instagram." };

  const token = await apifyToken(orgId);
  if (!token) return { ok: false, error: "Apify sem token (APIFY_TOKEN)." };
  const admin = createAdminClient();

  // Já tem um run de instagram em andamento pra essa campanha? não duplica.
  const { data: running } = await admin
    .from("prospecting_jobs")
    .select("id, query")
    .eq("organization_id", orgId)
    .eq("campaign_id", campaignId)
    .eq("source", "apify_instagram")
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
          directUrls: urls,
          resultsLimit: 200,
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
    source: "apify_instagram",
    status: "running",
    query: { run_id: runId, dataset_id: datasetId, urls },
    started_at: new Date().toISOString(),
  });
  return { ok: true, runId };
}

/** Confere o run e, se pronto, baixa o dataset e anexa os comentaristas como leads. */
export async function collectApifyInstagram(
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
    .eq("source", "apify_instagram")
    .eq("status", "running")
    .order("started_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!jobRow) return { status: "none" };
  const job = jobRow as { id: string; query: { run_id?: string; dataset_id?: string } };
  const runId = job.query?.run_id;
  if (!runId) return { status: "error", error: "job sem run id" };

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

  const items = (await fetch(
    `https://api.apify.com/v2/datasets/${datasetId}/items?clean=true&token=${encodeURIComponent(token)}`,
  ).then((r) => (r.ok ? r.json() : [])).catch(() => [])) as Array<Record<string, unknown>>;

  // dedupe contra o que já existe na campanha (por external_id = username)
  const { data: existing } = await admin
    .from("prospecting_results")
    .select("external_id")
    .eq("organization_id", orgId)
    .eq("campaign_id", campaignId);
  const seen = new Set<string>(
    ((existing ?? []) as Array<{ external_id: string | null }>)
      .map((e) => e.external_id)
      .filter((v): v is string => !!v),
  );

  // Um lead por comentarista único (o ator retorna 1 linha por comentário).
  const rows: Record<string, unknown>[] = [];
  for (const it of Array.isArray(items) ? items : []) {
    const username = String(it.ownerUsername ?? it.username ?? "");
    if (!username || seen.has(username)) continue;
    seen.add(username);
    rows.push({
      organization_id: orgId,
      campaign_id: campaignId,
      job_id: job.id,
      source: "apify_instagram",
      external_id: username,
      company_data: {
        name: username,
        socials: [`https://instagram.com/${username}`],
      },
      contact_data: null,
      // score inicial mais baixo que Maps — é um comentarista, não uma
      // empresa qualificada por localização/categoria; enriquecimento decide.
      match_score: 25,
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
