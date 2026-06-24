"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { TicketStatus } from "@/lib/types/operacao";

const VALID_STATUS: TicketStatus[] = [
  "aberto",
  "em_analise",
  "aguardando_cliente",
  "resolvido",
  "fechado",
];

async function ensureTicket(ticketId: string, organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("id, organization_id")
    .eq("id", ticketId)
    .maybeSingle();
  if (!data || (data as { organization_id: string }).organization_id !== organizationId) {
    throw new Error("Ticket não encontrado.");
  }
}

export async function responderTicketAction(formData: FormData) {
  const { org } = await requireSession();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!ticketId || body.length === 0) {
    throw new Error("Mensagem vazia.");
  }
  await ensureTicket(ticketId, org.id);

  const supabase = await createClient();
  const { error: msgError } = await supabase.rpc("op_add_ticket_message", {
    p_ticket_id: ticketId,
    p_body: body,
    p_kind: "operador",
  });
  if (msgError) throw new Error(msgError.message);

  revalidatePath(`/app/sac/tickets/${ticketId}`);
  revalidatePath(`/app/sac/tickets`);
  revalidatePath(`/app/sac`);
}

export async function alterarStatusTicketAction(formData: FormData) {
  const { org } = await requireSession();
  const ticketId = String(formData.get("ticket_id") ?? "");
  const status = String(formData.get("status") ?? "") as TicketStatus;
  if (!ticketId || !VALID_STATUS.includes(status)) {
    throw new Error("Parâmetros inválidos.");
  }
  await ensureTicket(ticketId, org.id);

  const supabase = await createClient();
  const { error } = await supabase.rpc("tk_update_ticket", {
    p_id: ticketId,
    p_org: org.id,
    p_patch: { status },
  });
  if (error) throw new Error(error.message);

  await supabase.rpc("op_add_ticket_message", {
    p_ticket_id: ticketId,
    p_body: `Status alterado para "${status}".`,
    p_kind: "sistema",
  });

  revalidatePath(`/app/sac/tickets/${ticketId}`);
  revalidatePath(`/app/sac/tickets`);
  revalidatePath(`/app/sac`);
}

/**
 * Atualiza patch genérico (priority/department/assigned_to/status) via tk_update_ticket.
 * Usado pelos selects do painel direito do detalhe SAC.
 */
export async function patchTicketAction(formData: FormData) {
  const { org } = await requireSession();
  const ticketId = String(formData.get("ticket_id") ?? "");
  if (!ticketId) throw new Error("Ticket inválido.");
  await ensureTicket(ticketId, org.id);

  const patch: Record<string, string> = {};
  const status = String(formData.get("status") ?? "").trim();
  const priority = String(formData.get("priority") ?? "").trim();
  const department = String(formData.get("department") ?? "").trim();
  const assigned_to = String(formData.get("assigned_to") ?? "").trim();
  if (status) patch.status = status;
  if (priority) patch.priority = priority;
  if (department) patch.department = department;
  if (assigned_to) patch.assigned_to = assigned_to;

  if (Object.keys(patch).length === 0) return;

  const supabase = await createClient();
  const { error } = await supabase.rpc("tk_update_ticket", {
    p_id: ticketId,
    p_org: org.id,
    p_patch: patch,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/app/sac/tickets/${ticketId}`);
  revalidatePath(`/app/sac/tickets`);
}

export async function atribuirTicketAction(formData: FormData) {
  const { user, org } = await requireSession();
  const ticketId = String(formData.get("ticket_id") ?? "");
  if (!ticketId) throw new Error("Ticket inválido.");
  await ensureTicket(ticketId, org.id);

  const supabase = await createClient();
  const { error } = await supabase
    .from("support_tickets")
    .update({ assigned_to: user.id })
    .eq("id", ticketId);
  if (error) throw new Error(error.message);

  await supabase.rpc("op_add_ticket_message", {
    p_ticket_id: ticketId,
    p_body: "Ticket atribuído a um operador.",
    p_kind: "sistema",
  });

  revalidatePath(`/app/sac/tickets/${ticketId}`);
  revalidatePath(`/app/sac/tickets`);
}

export async function criarTicketAction(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const subject = String(formData.get("subject") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const category = String(formData.get("category") ?? "outro").trim();
  const priority = String(formData.get("priority") ?? "media").trim();
  const department = String(formData.get("department") ?? "sac").trim();
  const company_id = String(formData.get("company_id") ?? "").trim();
  const shipment_id = String(formData.get("shipment_id") ?? "").trim();

  if (!subject) {
    throw new Error("Assunto é obrigatório.");
  }

  const { data: newId, error } = await supabase.rpc("op_create_ticket", {
    p_payload: {
      organization_id: org.id,
      company_id,
      subject,
      category,
      description,
      priority,
      department,
      shipment_id,
      status: "aberto",
    },
  });
  if (error) throw new Error(error.message);

  revalidatePath("/app/sac/tickets");
  revalidatePath("/app/sac");
  if (newId) redirect(`/app/sac/tickets/${newId}?ok=created`);
  redirect("/app/sac/tickets?ok=created");
}
