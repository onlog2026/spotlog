import { createAdminClient } from "@/lib/supabase/admin";

export type LeadSegment = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  filters_json: Record<string, unknown>;
  is_dynamic: boolean;
  member_count: number;
  last_computed_at: string | null;
  created_at: string;
};

export type SmsCampaign = {
  id: string;
  organization_id: string;
  name: string;
  message: string;
  segment_id: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  status: "rascunho" | "agendada" | "enviando" | "enviada" | "falhou";
  total_count: number;
  sent_count: number;
  failed_count: number;
  created_at: string;
};

export type SmartLead = {
  id: string;
  lead_id: string;
  signal: string;
  score: number;
  payload: Record<string, unknown>;
  acknowledged: boolean;
  detected_at: string;
  lead_name: string | null;
  lead_email: string | null;
};

export async function listSegments(orgId: string): Promise<LeadSegment[]> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_list_segments", { p_org: orgId });
  if (error) {
    console.error("[mkt_list_segments]", error);
    return [];
  }
  return (data ?? []) as LeadSegment[];
}

export async function listSmsCampaigns(orgId: string): Promise<SmsCampaign[]> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_list_sms", { p_org: orgId });
  if (error) {
    console.error("[mkt_list_sms]", error);
    return [];
  }
  return (data ?? []) as SmsCampaign[];
}

export async function listSmartLeads(orgId: string): Promise<SmartLead[]> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_list_smart_leads", { p_org: orgId });
  if (error) {
    console.error("[mkt_list_smart_leads]", error);
    return [];
  }
  return (data ?? []) as SmartLead[];
}

export async function listEmailValidations(
  orgId: string,
  limit = 50,
): Promise<
  Array<{ id: string; email: string; status: string; reason: string | null; validated_at: string }>
> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("email_validations")
    .select("id, email, status, reason, validated_at")
    .eq("organization_id", orgId)
    .order("validated_at", { ascending: false })
    .limit(limit);
  if (error) {
    console.error("[email_validations]", error);
    return [];
  }
  return (data ?? []) as Array<{
    id: string;
    email: string;
    status: string;
    reason: string | null;
    validated_at: string;
  }>;
}
