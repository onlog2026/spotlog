import { createClient } from "@/lib/supabase/server";

export type CampaignRow = {
  id: string;
  name: string;
  status: string;
  found_count: number;
  total_target: number;
  daily_limit: number;
  sources: string[] | null;
  icp: Record<string, unknown> | null;
  created_at: string;
  ai_persona: string | null;
  auto_enroll: boolean;
};

export type ResultRow = {
  id: string;
  source: string | null;
  company_data: Record<string, unknown> | null;
  contact_data: Record<string, unknown> | null;
  match_score: number | null;
  status: string;
  external_id: string | null;
  created_at: string;
  converted_company_id: string | null;
  converted_contact_id: string | null;
};

export type CampaignKpis = {
  totalCampaigns: number;
  totalResults: number;
  totalConverted: number;
  conversionRate: number;
};

export async function listCampaigns(orgId: string): Promise<CampaignRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prospecting_campaigns")
    .select(
      "id, name, status, found_count, total_target, daily_limit, sources, icp, created_at, ai_persona, auto_enroll",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  return ((data as unknown) ?? []) as CampaignRow[];
}

export async function getCampaign(
  orgId: string,
  id: string,
): Promise<CampaignRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prospecting_campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", orgId)
    .maybeSingle();
  return ((data as unknown) ?? null) as CampaignRow | null;
}

export async function listResults(
  orgId: string,
  campaignId: string,
): Promise<ResultRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("prospecting_results")
    .select(
      "id, source, company_data, contact_data, match_score, status, external_id, created_at, converted_company_id, converted_contact_id",
    )
    .eq("organization_id", orgId)
    .eq("campaign_id", campaignId)
    .order("match_score", { ascending: false })
    .limit(200);
  return ((data as unknown) ?? []) as ResultRow[];
}

export async function getCampaignKpis(orgId: string): Promise<CampaignKpis> {
  const supabase = await createClient();
  const [{ count: totalCampaigns }, { count: totalResults }, { count: totalConverted }] =
    await Promise.all([
      supabase
        .from("prospecting_campaigns")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
      supabase
        .from("prospecting_results")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId),
      supabase
        .from("prospecting_results")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", orgId)
        .eq("status", "converted"),
    ]);
  const tr = totalResults ?? 0;
  const tc = totalConverted ?? 0;
  return {
    totalCampaigns: totalCampaigns ?? 0,
    totalResults: tr,
    totalConverted: tc,
    conversionRate: tr > 0 ? Math.round((tc / tr) * 100) : 0,
  };
}
