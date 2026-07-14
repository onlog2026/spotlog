import { createClient } from "@/lib/supabase/server";

export type WidgetSource = "leads" | "deals" | "tickets" | "revenue";
export type WidgetKind = "kpi" | "chart" | "table" | "funnel";

export type WidgetData = {
  value: number;
  valueLabel: string;
  breakdown: { label: string; count: number }[];
  rows: { id: string; title: string; extra: string }[];
};

export async function getWidgetData(
  orgId: string,
  source: WidgetSource,
): Promise<WidgetData> {
  const supabase = await createClient();

  if (source === "leads") {
    const { data } = await supabase
      .from("leads")
      .select("id, full_name, company_name, status, source, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(500);
    const rows = data ?? [];
    const byStatus = new Map<string, number>();
    for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    return {
      value: rows.length,
      valueLabel: "leads",
      breakdown: Array.from(byStatus, ([label, count]) => ({ label, count })),
      rows: rows.slice(0, 8).map((r) => ({
        id: r.id,
        title: r.full_name ?? r.company_name ?? "Sem nome",
        extra: r.status,
      })),
    };
  }

  if (source === "deals") {
    const { data } = await supabase
      .from("deals")
      .select("id, title, amount, status, created_at")
      .eq("organization_id", orgId)
      .order("created_at", { ascending: false })
      .limit(500);
    const rows = data ?? [];
    const byStatus = new Map<string, number>();
    for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    return {
      value: rows.length,
      valueLabel: "negócios",
      breakdown: Array.from(byStatus, ([label, count]) => ({ label, count })),
      rows: rows.slice(0, 8).map((r) => ({
        id: r.id,
        title: r.title,
        extra: (r.amount ?? 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        }),
      })),
    };
  }

  if (source === "tickets") {
    const { data } = await supabase.rpc("op_list_tickets", { p_org: orgId });
    const rows = (data ?? []) as { id: string; subject: string; status: string; created_at: string }[];
    const byStatus = new Map<string, number>();
    for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
    return {
      value: rows.length,
      valueLabel: "tickets",
      breakdown: Array.from(byStatus, ([label, count]) => ({ label, count })),
      rows: rows.slice(0, 8).map((r) => ({
        id: r.id,
        title: r.subject ?? "Sem assunto",
        extra: r.status,
      })),
    };
  }

  // revenue: soma de faturas pagas
  const { data } = await supabase.rpc("op_list_invoices", { p_org: orgId, p_status: null });
  const rows = (data ?? []) as { id: string; number: string; amount: number; status: string; paid_at: string | null }[];
  const paid = rows.filter((r) => r.status === "paga");
  const total = paid.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
  const byStatus = new Map<string, number>();
  for (const r of rows) byStatus.set(r.status, (byStatus.get(r.status) ?? 0) + 1);
  return {
    value: total,
    valueLabel: "recebido (R$)",
    breakdown: Array.from(byStatus, ([label, count]) => ({ label, count })),
    rows: paid.slice(0, 8).map((r) => ({
      id: r.id,
      title: r.number,
      extra: Number(r.amount ?? 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      }),
    })),
  };
}
