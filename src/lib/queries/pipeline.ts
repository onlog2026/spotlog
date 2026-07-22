import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export type PipelineStage = {
  id: string;
  name: string;
  position: number;
  color: string | null;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
};

export type PipelineDeal = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  stage_id: string;
  owner_id: string | null;
  contact_id: string | null;
  company_id: string | null;
  position: number;
  expected_close_date: string | null;
  status: string;
  source: string | null;
  tags: string[] | null;
  created_at: string;
  probability: number | null;
  company_name?: string | null;
  contact_name?: string | null;
  owner_name?: string | null;
};

export type PipelineFilters = {
  ownerId?: string;
  source?: string;
  minAmount?: number;
  fromDate?: string;
  toDate?: string;
  q?: string;
};

export async function getOrCreateDefaultPipeline(orgId: string) {
  const supabase = await createClient();
  let { data: pipeline } = await supabase
    .from("pipelines")
    .select("id, name")
    .eq("organization_id", orgId)
    .eq("is_default", true)
    .maybeSingle();

  if (!pipeline) {
    const admin = createAdminClient();
    await admin.rpc("seed_default_pipeline", { org: orgId });
    const re = await supabase
      .from("pipelines")
      .select("id, name")
      .eq("organization_id", orgId)
      .eq("is_default", true)
      .maybeSingle();
    pipeline = re.data;
  }
  return pipeline as { id: string; name: string } | null;
}

export async function getPipelineStages(
  orgId: string,
  pipelineId: string,
): Promise<PipelineStage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pipeline_stages")
    .select("id, name, position, color, probability, is_won, is_lost")
    .eq("pipeline_id", pipelineId)
    .eq("organization_id", orgId)
    .order("position");
  return (data ?? []) as PipelineStage[];
}

export async function getDealsForPipeline(
  orgId: string,
  pipelineId: string,
  filters: PipelineFilters = {},
): Promise<PipelineDeal[]> {
  const supabase = await createClient();
  // Aberto sempre aparece; ganho/perdido só nos últimos 30 dias — senão o
  // card de "Ganho"/"Perdido" some do board pra sempre no próximo load
  // (o deal fica órfão, sem nenhuma tela pra consultar depois).
  const recentCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  let q = supabase
    .from("deals")
    .select(
      `id,title,amount,currency,stage_id,owner_id,contact_id,company_id,position,expected_close_date,status,source,tags,created_at,probability`,
    )
    .eq("organization_id", orgId)
    .eq("pipeline_id", pipelineId)
    .or(`status.eq.open,and(status.in.(won,lost),closed_at.gte.${recentCutoff})`)
    .order("position", { ascending: true })
    .limit(500);

  if (filters.ownerId) q = q.eq("owner_id", filters.ownerId);
  if (filters.source) q = q.eq("source", filters.source);
  if (typeof filters.minAmount === "number")
    q = q.gte("amount", filters.minAmount);
  if (filters.fromDate) q = q.gte("created_at", filters.fromDate);
  if (filters.toDate) q = q.lte("created_at", filters.toDate);
  if (filters.q) q = q.ilike("title", `%${filters.q}%`);

  const { data } = await q;
  type Row = {
    id: string;
    title: string;
    amount: number;
    currency: string;
    stage_id: string;
    owner_id: string | null;
    contact_id: string | null;
    company_id: string | null;
    position: number;
    expected_close_date: string | null;
    status: string;
    source: string | null;
    tags: string[] | null;
    created_at: string;
    probability: number | null;
  };
  const rows = (data ?? []) as Row[];
  if (rows.length === 0) return [];

  const companyIds = Array.from(
    new Set(rows.map((r) => r.company_id).filter((v): v is string => !!v)),
  );
  const contactIds = Array.from(
    new Set(rows.map((r) => r.contact_id).filter((v): v is string => !!v)),
  );
  const ownerIds = Array.from(
    new Set(rows.map((r) => r.owner_id).filter((v): v is string => !!v)),
  );

  const [companiesRes, contactsRes, ownersRes] = await Promise.all([
    companyIds.length
      ? supabase.from("companies").select("id, name").in("id", companyIds)
      : Promise.resolve({ data: [] as Array<{ id: string; name: string }> }),
    contactIds.length
      ? supabase.from("contacts").select("id, full_name").in("id", contactIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; full_name: string | null }>,
        }),
    ownerIds.length
      ? supabase.from("profiles").select("id, full_name").in("id", ownerIds)
      : Promise.resolve({
          data: [] as Array<{ id: string; full_name: string | null }>,
        }),
  ]);
  const companyMap = new Map<string, string>();
  for (const c of (companiesRes.data ?? []) as Array<{
    id: string;
    name: string;
  }>) {
    companyMap.set(c.id, c.name);
  }
  const contactMap = new Map<string, string>();
  for (const c of (contactsRes.data ?? []) as Array<{
    id: string;
    full_name: string | null;
  }>) {
    if (c.full_name) contactMap.set(c.id, c.full_name);
  }
  const ownerMap = new Map<string, string>();
  for (const o of (ownersRes.data ?? []) as Array<{
    id: string;
    full_name: string | null;
  }>) {
    if (o.full_name) ownerMap.set(o.id, o.full_name);
  }

  return rows.map((d) => ({
    id: d.id,
    title: d.title,
    amount: Number(d.amount) || 0,
    currency: d.currency,
    stage_id: d.stage_id,
    owner_id: d.owner_id,
    contact_id: d.contact_id,
    company_id: d.company_id,
    position: d.position,
    expected_close_date: d.expected_close_date,
    status: d.status,
    source: d.source,
    tags: d.tags ?? null,
    created_at: d.created_at,
    probability: d.probability,
    company_name: d.company_id ? companyMap.get(d.company_id) ?? null : null,
    contact_name: d.contact_id ? contactMap.get(d.contact_id) ?? null : null,
    owner_name: d.owner_id ? ownerMap.get(d.owner_id) ?? null : null,
  }));
}

/**
 * Taxa de conversão de verdade — TODOS os deals ganhos/perdidos da vida do
 * pipeline, não só os que aparecem no board (que só mostra fechados dos
 * últimos 30 dias). Sem isso o card "Conversão" no topo do Pipeline é
 * matematicamente preso em 0% (nunca recebe um deal won/lost pra contar).
 */
export async function getPipelineConversionStats(
  orgId: string,
  pipelineId: string,
): Promise<{ won: number; lost: number; conversion: number }> {
  const supabase = await createClient();
  const [wonRes, lostRes] = await Promise.all([
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("pipeline_id", pipelineId)
      .eq("status", "won"),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("pipeline_id", pipelineId)
      .eq("status", "lost"),
  ]);
  const won = wonRes.count ?? 0;
  const lost = lostRes.count ?? 0;
  const closed = won + lost;
  return { won, lost, conversion: closed > 0 ? Math.round((won / closed) * 100) : 0 };
}

export async function getDealOwnersForOrg(orgId: string) {
  // 2 queries pra evitar PostgREST FK cache stale (organization_members.user_id -> profiles)
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId);
  const userIds = ((members ?? []) as { user_id: string }[]).map((m) => m.user_id);
  if (userIds.length === 0) return [];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", userIds);
  const byId = new Map<string, { full_name: string | null; avatar_url: string | null }>();
  for (const p of (profiles ?? []) as Array<{
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  }>) {
    byId.set(p.id, { full_name: p.full_name, avatar_url: p.avatar_url });
  }
  return userIds.map((uid) => ({
    id: uid,
    full_name: byId.get(uid)?.full_name ?? null,
    avatar_url: byId.get(uid)?.avatar_url ?? null,
  }));
}
