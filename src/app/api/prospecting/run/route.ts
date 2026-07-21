import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchProspects, type ICP } from "@/lib/integrations/prospecting";
import { analyzeLeadSite } from "@/lib/sdr/enrich-web";
import {
  normalizePhoneBR,
  isValidPhoneBR,
  isValidEmail,
} from "@/lib/sdr/validate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * AGENTE DE PROSPECÇÃO — roda a descoberta + o enriquecimento.
 * Chamado por:
 *  - GET  → Vercel Cron (diário, autônomo): descobre em TODAS as campanhas
 *           'running' + enriquece os leads novos (site → WhatsApp/e-mail).
 *  - POST → manual/interno (header x-internal=WEBHOOK_SECRET), opcional {campaign_id}.
 */
function authorized(req: NextRequest): boolean {
  const cron = process.env.CRON_SECRET;
  if (cron && req.headers.get("authorization") === `Bearer ${cron}`) return true;
  const wh = process.env.WEBHOOK_SECRET;
  if (wh && req.headers.get("x-internal") === wh) return true;
  // NÃO confiar em user-agent — qualquer curl finge ser "vercel-cron". Com
  // CRON_SECRET configurado, a Vercel manda o Bearer automaticamente (checado
  // acima); essa linha era um bypass total do segredo.
  if (!cron && !wh) return true; // sem secret configurado → libera (dev)
  return false;
}

type Camp = {
  id: string;
  organization_id: string;
  icp: ICP;
  sources: string[];
  daily_limit: number;
  total_target: number;
  found_count: number;
};

/** Descoberta: roda as campanhas (uma específica ou todas 'running'). */
async function discover(
  admin: ReturnType<typeof createAdminClient>,
  campaignId?: string,
): Promise<number> {
  const { data: campaigns } = campaignId
    ? await admin.from("prospecting_campaigns").select("*").eq("id", campaignId)
    : await admin.from("prospecting_campaigns").select("*").eq("status", "running");
  if (!campaigns?.length) return 0;

  let processed = 0;
  for (const c of campaigns) {
    const ca = c as unknown as Camp;
    if (ca.found_count >= ca.total_target) {
      await admin
        .from("prospecting_campaigns")
        .update({ status: "completed" })
        .eq("id", ca.id);
      continue;
    }
    const remaining = Math.min(ca.daily_limit, ca.total_target - ca.found_count);
    const icp: ICP = { ...ca.icp, limit: remaining };

    const { data: job } = await admin
      .from("prospecting_jobs")
      .insert({
        organization_id: ca.organization_id,
        campaign_id: ca.id,
        source: ca.sources.join(","),
        status: "running",
        query: icp,
        started_at: new Date().toISOString(),
      })
      .select("id")
      .single();
    const jobId = (job as { id: string }).id;

    try {
      const { hits, diagnostics } = await searchProspects(
        ca.organization_id,
        icp,
        ca.sources,
      );
      const failures = diagnostics.filter((d) => !d.ok);
      const note = failures.length
        ? "Avisos: " + failures.map((d) => `${d.source}: ${d.error}`).join(" | ")
        : null;

      if (hits.length) {
        await admin.from("prospecting_results").insert(
          hits.map((h) => ({
            organization_id: ca.organization_id,
            campaign_id: ca.id,
            job_id: jobId,
            source: h.source,
            external_id: h.external_id,
            company_data: h.company,
            contact_data: h.contact,
            decision_maker_data: h.contact?.is_decision_maker ? h.contact : null,
            match_score: scoreMatch(h),
            status: "new",
          })),
        );
        await admin
          .from("prospecting_campaigns")
          .update({ found_count: ca.found_count + hits.length })
          .eq("id", ca.id);
      }

      await admin
        .from("prospecting_jobs")
        .update({
          status: "completed",
          total_found: hits.length,
          error: note,
          finished_at: new Date().toISOString(),
        })
        .eq("id", jobId);
      processed += hits.length;
    } catch (e) {
      await admin
        .from("prospecting_jobs")
        .update({
          status: "error",
          error: e instanceof Error ? e.message : "fail",
          finished_at: new Date().toISOString(),
        })
        .eq("id", jobId);
    }
  }
  return processed;
}

/**
 * Auto-enriquecimento: pega leads NOVOS com site e ainda não analisados
 * (sem `dores`), entra no site e preenche WhatsApp/e-mail + score + dores.
 * É o "agente trabalhando sozinho" nos leads. Capado pra caber no tempo.
 */
async function autoEnrich(
  admin: ReturnType<typeof createAdminClient>,
  cap = 15,
): Promise<number> {
  const { data } = await admin
    .from("prospecting_results")
    .select("id,organization_id,company_data,contact_data")
    .eq("status", "new")
    .limit(cap * 4);
  const rows = ((data ?? []) as Array<Record<string, unknown>>)
    .filter((r) => {
      const cd = (r.company_data ?? {}) as { website?: string; dores?: unknown };
      return cd.website && cd.dores === undefined; // tem site e ainda não analisado
    })
    .slice(0, cap);

  let enriched = 0;
  for (const r of rows) {
    try {
      const cd = { ...((r.company_data ?? {}) as Record<string, string | undefined>) };
      const pd = { ...((r.contact_data ?? {}) as Record<string, string | undefined>) };
      const web = await analyzeLeadSite(cd.website!);
      const cand = [...web.whatsapps, ...web.phones];
      const wphone = cand.find((p) => isValidPhoneBR(p)) ?? "";
      const waValid = web.whatsapps.find((p) => isValidPhoneBR(p)) ?? "";
      if (!cd.phone && wphone) cd.phone = wphone;
      if (!pd.email && web.emails[0]) pd.email = web.emails[0];
      if (waValid) pd.phone = pd.phone || waValid;
      const np = normalizePhoneBR(cd.phone);
      if (cd.phone && np) cd.phone = np;
      if (pd.email && !isValidEmail(pd.email)) delete pd.email;
      const score = Math.min(
        40 +
          (isValidPhoneBR(cd.phone) ? 25 : 0) +
          (pd.email && isValidEmail(pd.email) ? 20 : 0) +
          (cd.website ? 10 : 0),
        100,
      );
      await admin
        .from("prospecting_results")
        .update({
          company_data: { ...cd, dores: web.dores },
          contact_data: Object.keys(pd).length ? pd : null,
          match_score: score,
        })
        .eq("id", r.id as string);
      enriched++;
    } catch {
      // um lead falho não derruba o lote
    }
  }
  return enriched;
}

export async function GET(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const processed = await discover(admin); // todas 'running'
  const enriched = await autoEnrich(admin); // leads novos com site
  return NextResponse.json({ ok: true, processed, enriched });
}

export async function POST(req: NextRequest) {
  if (!authorized(req))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const admin = createAdminClient();
  const body = (await req.json().catch(() => ({}))) as { campaign_id?: string };
  const processed = await discover(admin, body.campaign_id);
  const enriched = await autoEnrich(admin);
  return NextResponse.json({ ok: true, processed, enriched });
}

function scoreMatch(h: {
  contact?: { is_decision_maker?: boolean; email?: string };
  company?: { domain?: string };
}) {
  let s = 30;
  if (h.contact?.is_decision_maker) s += 30;
  if (h.contact?.email) s += 25;
  if (h.company?.domain) s += 15;
  return Math.min(100, s);
}
