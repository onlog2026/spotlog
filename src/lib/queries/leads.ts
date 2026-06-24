import { createClient } from "@/lib/supabase/server";

export type LeadRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  company_name: string | null;
  job_title: string | null;
  status: string;
  source: string;
  source_detail: string | null;
  score: number | null;
  message: string | null;
  assigned_to: string | null;
  converted_contact_id: string | null;
  converted_deal_id: string | null;
  converted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function listLeads(
  orgId: string,
  opts: {
    status?: string;
    search?: string;
    limit?: number;
    assignment?: "mine" | "unassigned" | "all";
    currentUserId?: string;
  } = {},
) {
  const supabase = await createClient();
  let q = supabase
    .from("leads")
    .select(
      "id, full_name, email, phone, whatsapp, company_name, job_title, status, source, score, assigned_to, created_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.status && opts.status.trim()) q = q.eq("status", opts.status);
  if (opts.assignment === "mine" && opts.currentUserId) {
    q = q.eq("assigned_to", opts.currentUserId);
  } else if (opts.assignment === "unassigned") {
    q = q.is("assigned_to", null);
  }
  if (opts.search && opts.search.trim()) {
    const s = opts.search.trim();
    q = q.or(
      `full_name.ilike.%${s}%,email.ilike.%${s}%,company_name.ilike.%${s}%`,
    );
  }
  const { data } = await q;
  return (data ?? []) as LeadRow[];
}

export async function getActiveLeadLocks(orgId: string, leadIds: string[]) {
  if (leadIds.length === 0) return new Map<string, { locked_by: string; full_name: string | null }>();
  const supabase = await createClient();
  const { data } = await supabase
    .from("lead_locks")
    .select("lead_id, locked_by, expires_at")
    .in("lead_id", leadIds)
    .gt("expires_at", new Date().toISOString());
  const userIds = Array.from(
    new Set((data ?? []).map((r: { locked_by: string }) => r.locked_by)),
  );
  const { data: profiles } = userIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", userIds)
    : { data: [] };
  const profMap = new Map<string, string | null>();
  (profiles ?? []).forEach((p: { id: string; full_name: string | null }) =>
    profMap.set(p.id, p.full_name),
  );
  const map = new Map<string, { locked_by: string; full_name: string | null }>();
  // org guard via select; cross-org leads não retornariam via RLS, mas paranoia ok
  void orgId;
  (data ?? []).forEach((r: { lead_id: string; locked_by: string }) =>
    map.set(r.lead_id, { locked_by: r.locked_by, full_name: profMap.get(r.locked_by) ?? null }),
  );
  return map;
}

export async function getLead(orgId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("leads")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  return data as LeadRow | null;
}

export async function getLeadActivities(orgId: string, leadId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activities")
    .select(
      "id, type, status, subject, content, due_at, completed_at, created_at",
    )
    .eq("organization_id", orgId)
    .eq("lead_id", leadId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as {
    id: string;
    type: string;
    status: string;
    subject: string | null;
    content: string | null;
    due_at: string | null;
    completed_at: string | null;
    created_at: string | null;
  }[];
}
