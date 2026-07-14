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

export type ReportResultRow = { label: string; value: number; extra?: string };

export async function runReport(
  orgId: string,
  reportType: string,
): Promise<ReportResultRow[]> {
  const supabase = createAdminClient();

  if (reportType === "leads_by_source") {
    const { getBySource } = await import("@/lib/queries/marketing-ana");
    const rows = await getBySource(orgId, 30);
    return rows.map((r) => ({
      label: r.source,
      value: r.count,
      extra: `${r.converted} convertidos`,
    }));
  }

  if (reportType === "revenue") {
    const { getRevenue } = await import("@/lib/queries/marketing-ana");
    const rows = await getRevenue(orgId, 6);
    return rows.map((r) => ({
      label: r.month,
      value: r.revenue,
      extra: `${r.won_deals} negócios`,
    }));
  }

  if (reportType === "conversion_funnel") {
    const { getFunnel } = await import("@/lib/queries/marketing-ana");
    const f = await getFunnel(orgId, 30);
    return [
      { label: "Visitantes", value: f.visitors },
      { label: "Leads", value: f.leads },
      { label: "Qualificados", value: f.qualified },
      { label: "Oportunidades", value: f.opportunities },
      { label: "Ganhos", value: f.won },
    ];
  }

  if (reportType === "deals_by_stage") {
    // @ts-expect-error tabela sem types gerados
    const { data: stages } = await supabase
      .from("pipeline_stages")
      .select("id, name")
      .eq("organization_id", orgId);
    // @ts-expect-error tabela sem types gerados
    const { data: deals } = await supabase
      .from("deals")
      .select("stage_id, amount")
      .eq("organization_id", orgId)
      .eq("status", "open");
    const stageMap = new Map(
      ((stages ?? []) as { id: string; name: string }[]).map((s) => [s.id, s.name]),
    );
    const byStage = new Map<string, { count: number; total: number }>();
    for (const d of (deals ?? []) as { stage_id: string; amount: number }[]) {
      const name = stageMap.get(d.stage_id) ?? "Sem estágio";
      const cur = byStage.get(name) ?? { count: 0, total: 0 };
      cur.count += 1;
      cur.total += Number(d.amount ?? 0);
      byStage.set(name, cur);
    }
    return Array.from(byStage, ([label, v]) => ({
      label,
      value: v.count,
      extra: v.total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }),
    }));
  }

  if (reportType === "tickets_by_dept") {
    // @ts-expect-error rpc dinâmico
    const { data } = await supabase.rpc("op_list_tickets", { p_org: orgId });
    const rows = (data ?? []) as { category: string | null }[];
    const byCat = new Map<string, number>();
    for (const r of rows) {
      const label = r.category ?? "Sem categoria";
      byCat.set(label, (byCat.get(label) ?? 0) + 1);
    }
    return Array.from(byCat, ([label, value]) => ({ label, value }));
  }

  // custom_sql: desabilitado por segurança (rodar SQL livre vindo de um campo de texto
  // é risco de injeção mesmo sendo "admin" — não implementado até ter uma allowlist real)
  return [];
}
