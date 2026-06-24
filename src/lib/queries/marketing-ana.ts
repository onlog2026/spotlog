import { createAdminClient } from "@/lib/supabase/admin";
import type { SmsCampaign } from "./marketing-rel";

export type FunnelData = {
  visitors: number;
  leads: number;
  qualified: number;
  opportunities: number;
  won: number;
};

export type SourceRow = { source: string; count: number; converted: number };
export type RevenueRow = { month: string; revenue: number; won_deals: number };

export type CustomDashboard = {
  id: string;
  name: string;
  description: string | null;
  layout_json: Array<Record<string, unknown>>;
  is_default: boolean;
  created_at: string;
};

export type SavedReport = {
  id: string;
  name: string;
  report_type:
    | "leads_by_source"
    | "deals_by_stage"
    | "revenue"
    | "conversion_funnel"
    | "tickets_by_dept"
    | "custom_sql";
  filters_json: Record<string, unknown>;
  schedule: "manual" | "daily" | "weekly" | "monthly" | null;
  recipients: string[] | null;
  last_run_at: string | null;
  created_at: string;
};

export async function getFunnel(orgId: string, days = 30): Promise<FunnelData> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_analytics_funnel", {
    p_org: orgId,
    p_days: days,
  });
  if (error || !data) {
    return { visitors: 0, leads: 0, qualified: 0, opportunities: 0, won: 0 };
  }
  return data as FunnelData;
}

export async function getBySource(orgId: string, days = 30): Promise<SourceRow[]> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_analytics_by_source", {
    p_org: orgId,
    p_days: days,
  });
  if (error) return [];
  return (data ?? []) as SourceRow[];
}

export async function getRevenue(orgId: string, months = 6): Promise<RevenueRow[]> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_analytics_revenue", {
    p_org: orgId,
    p_months: months,
  });
  if (error) return [];
  return (data ?? []) as RevenueRow[];
}

export async function listDashboards(orgId: string): Promise<CustomDashboard[]> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_list_dashboards", { p_org: orgId });
  if (error) return [];
  return (data ?? []) as CustomDashboard[];
}

export async function listReports(orgId: string): Promise<SavedReport[]> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_list_reports", { p_org: orgId });
  if (error) return [];
  return (data ?? []) as SavedReport[];
}

/**
 * Lista TODAS campanhas (SMS + cadencias + push + ads) pra Gerenciador.
 * Cada fonte é opcional — se a tabela não existir, retorna vazio.
 */
export type CampaignRow = {
  id: string;
  name: string;
  type: "sms" | "email" | "push" | "ads" | "cadencia";
  status: string;
  metric_label: string;
  created_at: string;
};

export async function listAllCampaigns(orgId: string): Promise<CampaignRow[]> {
  const supabase = createAdminClient();
  const rows: CampaignRow[] = [];

  // SMS
  // @ts-expect-error rpc dinâmico
  const { data: sms } = await supabase.rpc("mkt_list_sms", { p_org: orgId });
  (sms ?? []).forEach((c: SmsCampaign) =>
    rows.push({
      id: c.id,
      name: c.name,
      type: "sms",
      status: c.status,
      metric_label: `${c.sent_count}/${c.total_count} enviados`,
      created_at: c.created_at,
    }),
  );

  // Cadências (sequences)
  const { data: cad } = await supabase
    .from("sequences")
    .select("id, name, is_active, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);
  (cad ?? []).forEach((c) =>
    rows.push({
      id: c.id,
      name: c.name,
      type: "cadencia",
      status: c.is_active ? "ativa" : "pausada",
      metric_label: "cadência",
      created_at: c.created_at,
    }),
  );

  // Web push
  const { data: push } = await supabase
    .from("web_push_campaigns")
    .select("id, title, sent_at, sent_count, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);
  (push ?? []).forEach((p) =>
    rows.push({
      id: p.id,
      name: p.title,
      type: "push",
      status: p.sent_at ? "enviada" : "rascunho",
      metric_label: `${p.sent_count ?? 0} envios`,
      created_at: p.created_at,
    }),
  );

  // Ad campaigns
  const { data: ads } = await supabase
    .from("ad_campaigns")
    .select("id, name, status, created_at")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(50);
  (ads ?? []).forEach((a) =>
    rows.push({
      id: a.id,
      name: a.name,
      type: "ads",
      status: a.status ?? "rascunho",
      metric_label: "ad",
      created_at: a.created_at,
    }),
  );

  rows.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  return rows;
}

import type { SmsCampaign } from "./marketing-rel";
