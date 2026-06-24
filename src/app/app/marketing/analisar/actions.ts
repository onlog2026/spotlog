"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

// ===== Dashboards =====

export async function createDashboard(input: {
  name: string;
  description?: string;
  layout_json: Array<Record<string, unknown>>;
  is_default?: boolean;
}) {
  const ctx = await requireSession();
  if (!input.name?.trim()) throw new Error("Nome obrigatório");
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_save_dashboard", {
    p_payload: {
      organization_id: ctx.org.id,
      name: input.name.trim(),
      description: input.description ?? null,
      layout_json: input.layout_json ?? [],
      is_default: input.is_default ?? false,
    },
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/analisar/dashboards");
  return data as string;
}

export async function saveDashboardForm(formData: FormData) {
  const layout = String(formData.get("layout_json") ?? "[]");
  let parsed: Array<Record<string, unknown>> = [];
  try {
    parsed = JSON.parse(layout);
  } catch {
    parsed = [];
  }
  await createDashboard({
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    layout_json: parsed,
    is_default: formData.get("is_default") === "on",
  });
  redirect("/app/marketing/analisar/dashboards");
}

export async function deleteDashboard(id: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("mkt_delete_dashboard", { p_id: id, p_org: ctx.org.id });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/analisar/dashboards");
}

// ===== Reports =====

export async function createReport(input: {
  name: string;
  report_type: string;
  filters_json?: Record<string, unknown>;
  schedule?: "manual" | "daily" | "weekly" | "monthly";
  recipients?: string[];
}) {
  const ctx = await requireSession();
  if (!input.name?.trim()) throw new Error("Nome obrigatório");
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("mkt_save_report", {
    p_payload: {
      organization_id: ctx.org.id,
      name: input.name.trim(),
      report_type: input.report_type,
      filters_json: input.filters_json ?? {},
      schedule: input.schedule ?? "manual",
      recipients: input.recipients ?? [],
    },
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/analisar/relatorios");
  return data as string;
}

export async function saveReportForm(formData: FormData) {
  const recipients = String(formData.get("recipients") ?? "")
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
  await createReport({
    name: String(formData.get("name") ?? ""),
    report_type: String(formData.get("report_type") ?? "leads_by_source"),
    schedule: (String(formData.get("schedule") ?? "manual") as
      | "manual"
      | "daily"
      | "weekly"
      | "monthly"),
    recipients,
  });
  redirect("/app/marketing/analisar/relatorios");
}

export async function deleteReport(id: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("mkt_delete_report", { p_id: id, p_org: ctx.org.id });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/analisar/relatorios");
}
