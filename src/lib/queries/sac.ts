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

/**
 * op_list_tickets (RPC) não faz join com companies -- a coluna "Empresa"
 * da lista/dashboard sempre mostrava "—" mesmo com ticket vinculado. Busca
 * os nomes em lote e junta em memória (sem precisar mexer na RPC/migration).
 */
async function attachCompanies<T extends { company_id: string | null }>(
  supabase: SupaClient,
  rows: T[],
): Promise<(T & { companies: { id: string; name: string } | null })[]> {
  const ids = Array.from(
    new Set(rows.map((r) => r.company_id).filter((v): v is string => !!v)),
  );
  if (ids.length === 0) {
    return rows.map((r) => ({ ...r, companies: null }));
  }
  const { data } = await supabase.from("companies").select("id, name").in("id", ids);
  const map = new Map((data ?? []).map((c: { id: string; name: string }) => [c.id, c]));
  return rows.map((r) => ({
    ...r,
    companies: r.company_id ? map.get(r.company_id) ?? null : null,
  }));
}

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

  // last_response_at é tocado por QUALQUER ação (mudar status/prioridade,
  // auto-atribuir, mensagem de sistema) -- não só resposta real ao
  // cliente. Calcula direto de ticket_messages (author_kind='operador'),
  // que é o único sinal confiável de "respondeu de verdade".
  let tempoMedioRespostaHoras: number | null = null;
  const ticketIds = list.map((t) => t.id);
  if (ticketIds.length > 0) {
    const { data: msgs } = await supabase
      .from("ticket_messages")
      .select("ticket_id, created_at")
      .in("ticket_id", ticketIds)
      .eq("author_kind", "operador")
      .order("created_at", { ascending: true });
    const firstReplyByTicket = new Map<string, string>();
    for (const m of (msgs ?? []) as { ticket_id: string; created_at: string }[]) {
      if (!firstReplyByTicket.has(m.ticket_id)) {
        firstReplyByTicket.set(m.ticket_id, m.created_at);
      }
    }
    const respondidos = list.filter((t) => firstReplyByTicket.has(t.id) && t.opened_at);
    if (respondidos.length > 0) {
      const somaMs = respondidos.reduce((acc, t) => {
        const a = new Date(t.opened_at).getTime();
        const b = new Date(firstReplyByTicket.get(t.id) as string).getTime();
        return acc + Math.max(0, b - a);
      }, 0);
      tempoMedioRespostaHoras =
        Math.round((somaMs / respondidos.length / 1000 / 60 / 60) * 10) / 10;
    }
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
  const filtered = list
    .filter(
      (t) =>
        ["urgente", "alta"].includes(t.priority) &&
        !["resolvido", "fechado"].includes(t.status),
    )
    .sort(
      (a, b) =>
        new Date(a.opened_at).getTime() - new Date(b.opened_at).getTime(),
    )
    .slice(0, limit);
  return attachCompanies(supabase, filtered);
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
  return attachCompanies(supabase, filtered);
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
