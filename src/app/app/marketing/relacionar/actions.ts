"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ===== Segmentos =====

export async function createSegment(input: {
  name: string;
  description?: string;
  filters_json: Record<string, unknown>;
}) {
  const ctx = await requireSession();
  if (!input.name?.trim()) throw new Error("Nome obrigatório");
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_create_segment", {
    p_payload: {
      organization_id: ctx.org.id,
      name: input.name.trim(),
      description: input.description ?? null,
      filters_json: input.filters_json ?? {},
      is_dynamic: true,
    },
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/relacionar/segmentos");
  return data as string;
}

export async function computeSegment(segmentId: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_compute_segment", {
    p_segment_id: segmentId,
    p_org: ctx.org.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/relacionar/segmentos");
  return data as { count: number; sample: Array<Record<string, unknown>> } | null;
}

export async function deleteSegment(id: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("mkt_delete_segment", { p_id: id, p_org: ctx.org.id });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/relacionar/segmentos");
}

export async function saveSegmentForm(formData: FormData) {
  const name = String(formData.get("name") ?? "");
  const description = String(formData.get("description") ?? "");
  const sources = formData.getAll("source").map(String).filter(Boolean);
  const statuses = formData.getAll("status").map(String).filter(Boolean);
  const score_min = String(formData.get("score_min") ?? "");
  const created_after = String(formData.get("created_after") ?? "");
  const utm_source = String(formData.get("utm_source") ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const filters_json: Record<string, unknown> = {};
  if (sources.length) filters_json.source = sources;
  if (statuses.length) filters_json.status = statuses;
  if (score_min) filters_json.score_min = Number(score_min);
  if (created_after) filters_json.created_after = created_after;
  if (utm_source.length) filters_json.utm_source = utm_source;

  await createSegment({ name, description, filters_json });
  redirect("/app/marketing/relacionar/segmentos");
}

// ===== SMS =====

export async function createSmsCampaign(input: {
  name: string;
  message: string;
  segment_id?: string;
  scheduled_for?: string;
  status?: "rascunho" | "agendada";
}) {
  const ctx = await requireSession();
  if (!input.name?.trim() || !input.message?.trim()) throw new Error("Nome e mensagem obrigatórios");
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_create_sms_campaign", {
    p_payload: {
      organization_id: ctx.org.id,
      name: input.name.trim(),
      message: input.message.trim(),
      segment_id: input.segment_id || "",
      scheduled_for: input.scheduled_for || "",
      status: input.status ?? "rascunho",
    },
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/relacionar/sms");
  return data as string;
}

export async function saveSmsForm(formData: FormData) {
  await createSmsCampaign({
    name: String(formData.get("name") ?? ""),
    message: String(formData.get("message") ?? ""),
    segment_id: String(formData.get("segment_id") ?? "") || undefined,
    scheduled_for: String(formData.get("scheduled_for") ?? "") || undefined,
    status: String(formData.get("scheduled_for") ?? "") ? "agendada" : "rascunho",
  });
  redirect("/app/marketing/relacionar/sms");
}

export async function deleteSms(id: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("mkt_delete_sms", { p_id: id, p_org: ctx.org.id });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/relacionar/sms");
}

// ===== Smart leads =====

export async function detectSmartLeads() {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_detect_smart_leads", { p_org: ctx.org.id });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/relacionar/inteligentes");
  return data as number;
}

export async function ackSmartLead(id: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("mkt_ack_smart_lead", { p_id: id, p_org: ctx.org.id });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/relacionar/inteligentes");
}

// ===== Email validation logging =====

export async function logEmailValidation(input: {
  email: string;
  status: "valid" | "invalid" | "risky" | "disposable" | "unknown";
  reason?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("mkt_log_email_validation", {
    p_payload: {
      organization_id: ctx.org.id,
      email: input.email,
      status: input.status,
      reason: input.reason ?? null,
    },
  });
  if (error) console.error("[logEmailValidation]", error);
}
