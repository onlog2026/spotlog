import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { searchProspects, type ICP } from "@/lib/integrations/prospecting";

/**
 * Roda um job de prospecção para uma campanha. Pode ser chamado:
 * - direto após criação (POST com campaign_id);
 * - por cron schedule (Vercel Cron) — itera campanhas em status 'running'.
 *
 * Header `x-internal` deve bater com WEBHOOK_SECRET pra impedir abuso.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal");
  if (
    process.env.WEBHOOK_SECRET &&
    secret !== process.env.WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const body = (await req.json().catch(() => ({}))) as {
    campaign_id?: string;
  };

  const { data: campaigns } = body.campaign_id
    ? await admin
        .from("prospecting_campaigns")
        .select("*")
        .eq("id", body.campaign_id)
    : await admin
        .from("prospecting_campaigns")
        .select("*")
        .eq("status", "running");

  if (!campaigns?.length) return NextResponse.json({ ok: true, processed: 0 });

  let processed = 0;
  for (const c of campaigns) {
    const ca = c as unknown as {
      id: string;
      organization_id: string;
      icp: ICP;
      sources: string[];
      daily_limit: number;
      total_target: number;
      found_count: number;
    };
    if (ca.found_count >= ca.total_target) {
      await admin
        .from("prospecting_campaigns")
        .update({ status: "completed" })
        .eq("id", ca.id);
      continue;
    }

    const remaining = Math.min(
      ca.daily_limit,
      ca.total_target - ca.found_count,
    );
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
      const hits = await searchProspects(
        ca.organization_id,
        icp,
        ca.sources,
      );

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

  return NextResponse.json({ ok: true, processed });
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
