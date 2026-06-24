"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Solicitar nova coleta (Área do Cliente).
 * Usa RPC `op_create_pickup` pra bypass do schema cache (PGRST205).
 */
export async function solicitarColetaAction(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const cep = String(formData.get("cep") ?? "").trim();
  const endereco = String(formData.get("endereco") ?? "").trim();
  const cidade = String(formData.get("cidade") ?? "").trim();
  const uf = String(formData.get("uf") ?? "").trim().toUpperCase();
  const data = String(formData.get("data") ?? "").trim();
  const janela = String(formData.get("janela") ?? "manha").trim();
  const volumes = String(formData.get("volumes") ?? "1").trim();
  const peso = String(formData.get("peso") ?? "").trim();
  const obs = String(formData.get("obs") ?? "").trim();

  if (!cep || !endereco || !cidade || !uf || !data) {
    throw new Error("Preencha endereço, cidade, UF, CEP e data.");
  }

  // janela → start/end ISO timestamp
  let startHour = "08:00:00";
  let endHour = "12:00:00";
  if (janela === "tarde") {
    startHour = "13:00:00";
    endHour = "17:00:00";
  } else if (janela === "comercial") {
    startHour = "08:00:00";
    endHour = "18:00:00";
  }
  const startIso = `${data}T${startHour}-03:00`;
  const endIso = `${data}T${endHour}-03:00`;

  const { error } = await supabase.rpc("op_create_pickup", {
    p_payload: {
      organization_id: org.id,
      address_json: { cep, street: endereco, city: cidade, uf },
      scheduled_window_start: startIso,
      scheduled_window_end: endIso,
      volumes,
      weight_kg: peso,
      notes: obs,
      status: "solicitada",
    },
  });
  if (error) throw new Error(error.message);

  revalidatePath("/app/cliente");
  revalidatePath("/app/cliente/coleta/nova");
  redirect("/app/cliente?ok=coleta");
}

/**
 * Abrir novo chamado (Área do Cliente) — vira ticket SAC.
 * Cria ticket via op_create_ticket + insere primeira mensagem (descricao)
 * como author_kind='cliente' via op_add_ticket_message. Redireciona pelo protocol.
 */
export async function abrirChamadoClienteAction(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const assunto = String(formData.get("assunto") ?? "").trim();
  const descricao = String(formData.get("descricao") ?? "").trim();
  const departamento = String(formData.get("departamento") ?? "sac").trim();
  const prioridade = String(formData.get("prioridade") ?? "media").trim();
  const categoria = String(formData.get("categoria") ?? "outro").trim();
  const remessa = String(formData.get("remessa") ?? "").trim();

  if (!assunto || !descricao) {
    throw new Error("Assunto e descrição são obrigatórios.");
  }

  // Se passou código de remessa, tenta resolver pra UUID
  let shipment_id = "";
  if (remessa) {
    const { data: ship } = await supabase
      .from("shipments")
      .select("id")
      .eq("organization_id", org.id)
      .eq("code", remessa)
      .maybeSingle();
    if (ship) shipment_id = (ship as { id: string }).id;
  }

  const { data: ticketId, error } = await supabase.rpc("op_create_ticket", {
    p_payload: {
      organization_id: org.id,
      subject: assunto,
      category: categoria,
      description: descricao,
      priority: prioridade,
      department: departamento,
      shipment_id,
      status: "aberto",
    },
  });
  if (error) throw new Error(error.message);

  // Primeira mensagem do cliente já registra a descrição como bolha
  if (ticketId) {
    await supabase.rpc("op_add_ticket_message", {
      p_ticket_id: ticketId,
      p_body: descricao,
      p_kind: "cliente",
    });
  }

  // Recupera protocol pra redirect amigável
  let protocol = "";
  if (ticketId) {
    const { data: t } = await supabase
      .from("support_tickets")
      .select("protocol")
      .eq("id", ticketId)
      .maybeSingle();
    protocol = (t as { protocol?: string } | null)?.protocol ?? "";
  }

  revalidatePath("/app/cliente/chamados");
  revalidatePath("/app/sac/tickets");
  revalidatePath("/app/sac");
  if (protocol) {
    redirect(`/app/cliente/chamados/${protocol}?created=1`);
  }
  redirect("/app/cliente/chamados?ok=criado");
}

/**
 * Cliente responde a um ticket existente (chat bidirecional).
 * Identifica ticket pelo protocol; só permite responder se status != fechado.
 */
export async function clienteResponderTicketAction(formData: FormData) {
  const { org } = await requireSession();
  const supabase = await createClient();

  const protocol = String(formData.get("protocol") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  if (!protocol || body.length === 0) {
    throw new Error("Mensagem vazia.");
  }

  const { data: t } = await supabase
    .from("support_tickets")
    .select("id, status")
    .eq("protocol", protocol)
    .eq("organization_id", org.id)
    .maybeSingle();
  const ticket = t as { id: string; status: string } | null;
  if (!ticket) throw new Error("Chamado não encontrado.");
  if (ticket.status === "fechado" || ticket.status === "resolvido") {
    throw new Error("Este chamado está encerrado. Abra um novo chamado.");
  }

  const { error } = await supabase.rpc("op_add_ticket_message", {
    p_ticket_id: ticket.id,
    p_body: body,
    p_kind: "cliente",
  });
  if (error) throw new Error(error.message);

  // Cliente respondeu -> volta para em_analise se estava aguardando_cliente
  if (ticket.status === "aguardando_cliente") {
    await supabase.rpc("tk_update_ticket", {
      p_id: ticket.id,
      p_org: org.id,
      p_patch: { status: "em_analise" },
    });
  }

  revalidatePath(`/app/cliente/chamados/${protocol}`);
  revalidatePath("/app/cliente/chamados");
  revalidatePath(`/app/sac/tickets/${ticket.id}`);
  revalidatePath("/app/sac/tickets");
  revalidatePath("/app/sac");
}
