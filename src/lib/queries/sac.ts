/**
 * Queries do módulo SAC (back-office de atendimento).
 * Usa RPCs op_* pra bypass do PostgREST schema cache (PGRST205).
 */
import { createClient } from "@/lib/supabase/server";
import type {
  SupportTicket,
  TicketMessage,
  TicketStatus,
  TicketPriority,
} from "@/lib/types/operacao";

type SupaClient = Awaited<ReturnType<typeof createClient>>;

async function rpcList<T>(
  supabase: SupaClient,
  fn: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    console.error(`[sac.rpcList] ${fn}`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export type SacKpis = {
  abertos: number;
  emAnalise: number;
  aguardandoCliente: number;
  resolvidosHoje: number;
  criticos: number;
  tempoMedioRespostaHoras: number | null;
};

export type TicketWithCompany = SupportTicket & {
  companies: { id: string; name: string } | null;
};

export type TicketDetail = SupportTicket & {
  companies: { id: string; name: string } | null;
  shipments: { id: string; code: string; status: string } | null;
};

export async function getSacKpis(organizationId: string): Promise<SacKpis> {
  const supabase = await createClient();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();

  const list = await rpcList<SupportTicket>(supabase, "op_list_tickets", {
    p_org: organizationId,
  });

  const abertos = list.filter((t) => t.status === "aberto").length;
  const emAnalise = list.filter((t) => t.status === "em_analise").length;
  const aguardandoCliente = list.filter(
    (t) => t.status === "aguardando_cliente",
  ).length;
  const resolvidosHoje = list.filter(
    (t) =>
      (t.status === "resolvido" || t.status === "fechado") &&
      t.closed_at &&
      t.closed_at >= todayIso,
  ).length;
  const criticos = list.filter(
    (t) =>
      (t.priority === "urgente" || t.priority === "alta") &&
      t.status !== "resolvido" &&
      t.status !== "fechado",
  ).length;

  const respondidos = list.filter((t) => t.last_response_at && t.opened_at);
  let tempoMedioRespostaHoras: number | null = null;
  if (respondidos.length > 0) {
    const somaMs = respondidos.reduce((acc, t) => {
      const a = new Date(t.opened_at).getTime();
      const b = new Date(t.last_response_at as string).getTime();
      return acc + Math.max(0, b - a);
    }, 0);
    tempoMedioRespostaHoras =
      Math.round((somaMs / respondidos.length / 1000 / 60 / 60) * 10) / 10;
  }

  return {
    abertos,
    emAnalise,
    aguardandoCliente,
    resolvidosHoje,
    criticos,
    tempoMedioRespostaHoras,
  };
}

export async function getTicketsUrgentes(
  organizationId: string,
  limit = 8,
): Promise<TicketWithCompany[]> {
  const supabase = await createClient();
  const list = await rpcList<SupportTicket>(supabase, "op_list_tickets", {
    p_org: organizationId,
  });
  return list
    .filter(
      (t) =>
        ["urgente", "alta"].includes(t.priority) &&
        !["resolvido", "fechado"].includes(t.status),
    )
    .sort(
      (a, b) =>
        new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime(),
    )
    .slice(0, limit)
    .map((t) => ({ ...t, companies: null })) as TicketWithCompany[];
}

export type TicketDepartment =
  | "comercial"
  | "financeiro"
  | "sac"
  | "tecnico";

export async function listTickets(
  organizationId: string,
  filters: {
    status?: TicketStatus | "todos";
    priority?: TicketPriority | "todas";
    department?: TicketDepartment | "todos";
    search?: string;
  } = {},
): Promise<TicketWithCompany[]> {
  const supabase = await createClient();
  const list = await rpcList<SupportTicket>(supabase, "op_list_tickets", {
    p_org: organizationId,
    p_dept:
      filters.department && filters.department !== "todos"
        ? filters.department
        : null,
    p_status:
      filters.status && filters.status !== "todos" ? filters.status : null,
  });

  let filtered = list;
  if (filters.priority && filters.priority !== "todas") {
    filtered = filtered.filter((t) => t.priority === filters.priority);
  }
  if (filters.search && filters.search.trim().length > 0) {
    const term = filters.search.trim().toLowerCase();
    filtered = filtered.filter(
      (t) =>
        (t.protocol ?? "").toLowerCase().includes(term) ||
        (t.subject ?? "").toLowerCase().includes(term),
    );
  }
  return filtered.map((t) => ({ ...t, companies: null })) as TicketWithCompany[];
}

export async function getTicket(
  organizationId: string,
  ticketId: string,
): Promise<TicketDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("op_get_ticket", {
    p_ticket_id: ticketId,
    p_org: organizationId,
  });
  if (error || !data) return null;
  const payload = data as { ticket: SupportTicket | null };
  if (!payload?.ticket) return null;
  return {
    ...payload.ticket,
    companies: null,
    shipments: null,
  } as TicketDetail;
}

export type TicketFullPayload = {
  ticket: SupportTicket;
  messages: TicketMessage[];
  company: { id: string; name: string } | null;
};

/** Detalhe completo + mensagens + empresa via RPC tk_get_full_ticket. */
export async function getFullTicket(
  organizationId: string,
  ticketId: string,
): Promise<TicketFullPayload | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("tk_get_full_ticket", {
    p_ticket_id: ticketId,
    p_org: organizationId,
  });
  if (error || !data) return null;
  const payload = data as {
    ticket: SupportTicket | null;
    messages: TicketMessage[] | null;
    company: { id: string; name: string } | null;
  };
  if (!payload?.ticket) return null;
  return {
    ticket: payload.ticket,
    messages: payload.messages ?? [],
    company: payload.company ?? null,
  };
}

/** Detalhe completo por protocol — usado pela área do cliente. */
export async function getFullTicketByProtocol(
  organizationId: string,
  protocol: string,
): Promise<TicketFullPayload | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc(
    "tk_get_full_ticket_by_protocol",
    { p_protocol: protocol, p_org: organizationId },
  );
  if (error || !data) return null;
  const payload = data as {
    ticket: SupportTicket | null;
    messages: TicketMessage[] | null;
    company: { id: string; name: string } | null;
  };
  if (!payload?.ticket) return null;
  return {
    ticket: payload.ticket,
    messages: payload.messages ?? [],
    company: payload.company ?? null,
  };
}

export async function getTicketMessages(
  ticketId: string,
): Promise<TicketMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("ticket_messages")
    .select(
      "id, ticket_id, author_user_id, author_kind, body, attachments_json, created_at",
    )
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });
  return (data ?? []) as TicketMessage[];
}
