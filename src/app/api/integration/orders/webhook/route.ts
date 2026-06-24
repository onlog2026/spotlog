import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const orderSchema = z.object({
  source: z.enum(["vtex", "shopify", "magento", "custom"]),
  event_type: z.string().min(1),
  order: z.object({
    external_id: z.string(),
    customer_name: z.string().optional(),
    customer_email: z.string().email().optional(),
    customer_phone: z.string().optional(),
    total: z.number().optional(),
    status: z.string().optional(),
    note: z.string().optional(),
  }),
});

function genProtocol(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SPT-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, "orders:webhook");
  if (auth.error) return auth.error;
  const { ctx } = auth;

  const rl = checkRateLimit(ctx.apiKeyId);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  let payload: z.infer<typeof orderSchema>;
  try {
    payload = orderSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Payload inválido.", details: String(err), code: "validation_error" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  // Log do webhook bruto
  const { data: webhookRow } = await admin
    .from("integration_webhook_events")
    .insert({
      organization_id: ctx.orgId,
      source: payload.source,
      event_type: payload.event_type,
      payload,
      processed: false,
    })
    .select("id")
    .single();

  // Upsert do external_order
  const { data: orderRow, error: orderErr } = await admin
    .from("external_orders")
    .upsert(
      {
        organization_id: ctx.orgId,
        external_id: payload.order.external_id,
        external_source: payload.source,
        customer_name: payload.order.customer_name ?? null,
        customer_email: payload.order.customer_email ?? null,
        customer_phone: payload.order.customer_phone ?? null,
        total: payload.order.total ?? null,
        status: payload.order.status ?? null,
        raw_payload: payload,
        updated_at: now,
      },
      { onConflict: "organization_id,external_source,external_id" },
    )
    .select("id, ticket_id")
    .single();

  if (orderErr || !orderRow) {
    if (webhookRow) {
      await admin
        .from("integration_webhook_events")
        .update({ processed: false, error_message: orderErr?.message ?? "upsert failed" })
        .eq("id", webhookRow.id);
    }
    return NextResponse.json(
      { error: orderErr?.message ?? "Erro ao salvar pedido.", code: "db_error" },
      { status: 500 },
    );
  }

  let ticketProtocol: string | null = null;
  let ticketId: string | null = (orderRow.ticket_id as string | null) ?? null;

  // Se for evento de reclamação, abre ticket SAC automaticamente
  if (payload.event_type === "complaint_opened" && !ticketId) {
    const protocol = genProtocol();
    const customerLine = [
      payload.order.customer_name && `Cliente: ${payload.order.customer_name}`,
      payload.order.customer_email && `E-mail: ${payload.order.customer_email}`,
      payload.order.customer_phone && `Telefone: ${payload.order.customer_phone}`,
      `Pedido externo: ${payload.source}/${payload.order.external_id}`,
    ]
      .filter(Boolean)
      .join("\n");
    const description = `${customerLine}\n\n${payload.order.note ?? "Reclamação aberta na plataforma de pedidos."}`;

    const { data: newTicket, error: tErr } = await admin
      .from("support_tickets")
      .insert({
        organization_id: ctx.orgId,
        protocol,
        subject: `Reclamação pedido ${payload.order.external_id} (${payload.source})`,
        description,
        // @ts-expect-error coluna nova
        department: "sac",
        priority: "alta",
        status: "aberto",
        opened_at: now,
      })
      .select("id, protocol")
      .single();

    if (!tErr && newTicket) {
      ticketId = newTicket.id as string;
      ticketProtocol = newTicket.protocol as string;
      await admin
        .from("external_orders")
        .update({ ticket_id: ticketId })
        .eq("id", orderRow.id);

      await admin.from("ticket_messages").insert({
        ticket_id: ticketId,
        author_user_id: null,
        author_kind: "cliente",
        body: payload.order.note ?? "Reclamação aberta na plataforma de pedidos.",
      });
    }
  }

  if (webhookRow) {
    await admin
      .from("integration_webhook_events")
      .update({
        processed: true,
        external_order_id: orderRow.id,
        ticket_id: ticketId,
      })
      .eq("id", webhookRow.id);
  }

  return NextResponse.json(
    {
      ok: true,
      external_order_id: orderRow.id,
      ticket_id: ticketId,
      ticket_protocol: ticketProtocol,
    },
    { status: 200 },
  );
}
