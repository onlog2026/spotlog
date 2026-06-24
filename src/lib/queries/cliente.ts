import { createClient } from "@/lib/supabase/server";
import type {
  Invoice,
  Shipment,
  ShipmentStatus,
  SupportTicket,
  TicketMessage,
  TrackingEvent,
  Occurrence,
} from "@/lib/types/operacao";

type SupaClient = Awaited<ReturnType<typeof createClient>>;

async function rpcList<T>(
  supabase: SupaClient,
  fn: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    console.error(`[cliente.rpcList] ${fn}`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

// ---------- Dashboard ----------
export async function getClienteDashboardKpis(
  orgId: string,
  companyId?: string,
) {
  const supabase = await createClient();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const [shipments, occurrences] = await Promise.all([
    rpcList<Shipment>(supabase, "op_list_shipments", {
      p_org: orgId,
      p_limit: 500,
    }),
    rpcList<Occurrence>(supabase, "op_list_occurrences", { p_org: orgId }),
  ]);

  const scoped = companyId
    ? shipments.filter((s) => s.company_id === companyId)
    : shipments;

  const hoje = scoped.filter((s) =>
    ["coletada", "triagem"].includes(s.status as string),
  ).length;
  const emRota = scoped.filter((s) =>
    ["em_rota", "saiu_entrega"].includes(s.status as string),
  ).length;
  const entregues = scoped.filter((s) => s.status === "entregue").length;
  const devolvidas = scoped.filter((s) =>
    ["devolvida", "extraviada"].includes(s.status as string),
  ).length;
  const total = scoped.length;
  const ocorrenciasAbertas = occurrences.filter((o) =>
    ["aberta", "em_analise"].includes(o.status as string),
  ).length;

  const slaPct =
    total > 0
      ? Math.round(((entregues + emRota) / total) * 100)
      : 0;

  return {
    hoje,
    emRota,
    entregues,
    devolvidas,
    ocorrenciasAbertas,
    slaPct,
  };
}

export async function getVolume7Dias(orgId: string, companyId?: string) {
  const supabase = await createClient();
  const shipments = await rpcList<Shipment>(supabase, "op_list_shipments", {
    p_org: orgId,
    p_limit: 1000,
  });
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - 6);

  const filtered = (
    companyId ? shipments.filter((s) => s.company_id === companyId) : shipments
  ).filter((s) => s.created_at && new Date(s.created_at) >= start);

  const buckets: Record<string, number> = {};
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    buckets[d.toISOString().slice(0, 10)] = 0;
  }
  for (const r of filtered) {
    const k = (r.created_at ?? "").slice(0, 10);
    if (k in buckets) buckets[k] += 1;
  }

  const labels = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  return Object.entries(buckets).map(([iso, valor]) => {
    const dia = new Date(iso + "T12:00:00Z").getDay();
    return { dia: labels[dia], valor };
  });
}

// ---------- Shipments ----------
export type ClienteShipmentRow = Shipment & {
  driver: { full_name: string } | null;
};

export async function getClienteShipments(
  orgId: string,
  filters: { status?: ShipmentStatus | ""; q?: string; companyId?: string } = {},
) {
  const supabase = await createClient();
  const rows = await rpcList<Shipment>(supabase, "op_list_shipments", {
    p_org: orgId,
    p_status: filters.status || null,
    p_limit: 100,
  });
  let filtered = rows;
  if (filters.companyId) {
    filtered = filtered.filter((r) => r.company_id === filters.companyId);
  }
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim().toLowerCase();
    filtered = filtered.filter(
      (r) =>
        (r.code ?? "").toLowerCase().includes(q) ||
        (r.recipient_name ?? "").toLowerCase().includes(q),
    );
  }
  return filtered.map((r) => ({ ...r, driver: null })) as ClienteShipmentRow[];
}

export async function getClienteShipmentDetail(orgId: string, code: string) {
  const supabase = await createClient();
  const rows = await rpcList<Shipment>(supabase, "op_list_shipments", {
    p_org: orgId,
    p_limit: 500,
  });
  const shipment = rows.find((s) => s.code === code);
  if (!shipment) return null;

  const s = { ...shipment, driver: null } as Shipment & {
    driver: { full_name: string; phone: string | null } | null;
  };

  const [{ data: events }, { data: occurrences }] = await Promise.all([
    supabase
      .from("tracking_events")
      .select("*")
      .eq("shipment_id", s.id)
      .order("occurred_at", { ascending: true }),
    supabase
      .from("occurrences")
      .select("id, opened_at, description, severity, status")
      .eq("shipment_id", s.id)
      .order("opened_at", { ascending: false }),
  ]);

  return {
    shipment: s,
    events: (events ?? []) as TrackingEvent[],
    occurrences: (occurrences ?? []) as Array<{
      id: string;
      opened_at: string;
      description: string | null;
      severity: string;
      status: string;
    }>,
  };
}

// ---------- Tickets ----------
export async function getClienteTickets(orgId: string, companyId?: string) {
  const supabase = await createClient();
  const rows = await rpcList<SupportTicket>(supabase, "op_list_tickets", {
    p_org: orgId,
  });
  return (
    companyId ? rows.filter((r) => r.company_id === companyId) : rows
  ) as SupportTicket[];
}

export async function getClienteTicketDetail(orgId: string, id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("op_get_ticket", {
    p_ticket_id: id,
    p_org: orgId,
  });
  if (error || !data) return null;
  const payload = data as {
    ticket: SupportTicket | null;
    messages: TicketMessage[] | null;
  };
  if (!payload?.ticket) return null;
  return {
    ticket: payload.ticket,
    messages: payload.messages ?? [],
  };
}

// ---------- Invoices ----------
export async function getClienteInvoices(orgId: string, companyId?: string) {
  const supabase = await createClient();
  const rows = await rpcList<Invoice>(supabase, "op_list_invoices", {
    p_org: orgId,
  });
  return (
    companyId ? rows.filter((r) => r.company_id === companyId) : rows
  ) as Invoice[];
}
