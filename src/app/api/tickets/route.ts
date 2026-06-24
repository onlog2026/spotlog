import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const DEPARTMENTS = ["comercial", "financeiro", "sac", "tecnico"] as const;
const PRIORITIES = ["baixa", "media", "alta", "urgente"] as const;

const createSchema = z.object({
  department: z.enum(DEPARTMENTS).default("sac"),
  subject: z.string().min(3).max(200),
  description: z.string().min(1).max(8000),
  priority: z.enum(PRIORITIES).default("media"),
  customer_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  customer_phone: z.string().optional(),
  external_order_id: z.string().uuid().optional(),
  attachments_urls: z.array(z.string().url()).optional(),
  category: z.string().optional(),
  company_id: z.string().uuid().optional(),
});

function genProtocol(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `SPT-${ts}-${rand}`;
}

export async function POST(req: NextRequest) {
  const auth = await requireApiAuth(req, "tickets:write");
  if (auth.error) return auth.error;
  const { ctx } = auth;

  const rl = checkRateLimit(ctx.apiKeyId);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  let payload: z.infer<typeof createSchema>;
  try {
    const json = await req.json();
    payload = createSchema.parse(json);
  } catch (err) {
    return NextResponse.json(
      { error: "Payload inválido.", details: String(err), code: "validation_error" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const protocol = genProtocol();
  const now = new Date().toISOString();

  const customerLine = [
    payload.customer_name && `Cliente: ${payload.customer_name}`,
    payload.customer_email && `E-mail: ${payload.customer_email}`,
    payload.customer_phone && `Telefone: ${payload.customer_phone}`,
  ]
    .filter(Boolean)
    .join("\n");

  const description = customerLine
    ? `${customerLine}\n\n${payload.description}`
    : payload.description;

  const { data: ticket, error } = await admin
    .from("support_tickets")
    .insert({
      organization_id: ctx.orgId,
      protocol,
      subject: payload.subject,
      description,
      // @ts-expect-error coluna nova
      department: payload.department,
      priority: payload.priority,
      status: "aberto",
      category: payload.category ?? null,
      company_id: payload.company_id ?? null,
      opened_at: now,
    })
    .select("id, protocol, status, created_at")
    .single();

  if (error || !ticket) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao criar ticket.", code: "db_error" },
      { status: 500 },
    );
  }

  // Mensagem inicial (do cliente, via API)
  await admin.from("ticket_messages").insert({
    ticket_id: ticket.id,
    author_user_id: null,
    author_kind: "cliente",
    body: payload.description,
    attachments_json: payload.attachments_urls
      ? { urls: payload.attachments_urls }
      : null,
  });

  // Linka external order se fornecido
  if (payload.external_order_id) {
    await admin
      .from("external_orders")
      .update({ ticket_id: ticket.id })
      .eq("id", payload.external_order_id)
      .eq("organization_id", ctx.orgId);
  }

  // Auditoria
  await admin.from("audit_logs").insert({
    organization_id: ctx.orgId,
    user_id: null,
    entity: "support_tickets",
    entity_id: ticket.id,
    action: "create_via_api",
    diff: { api_key_id: ctx.apiKeyId, department: payload.department },
  });

  return NextResponse.json(
    {
      id: ticket.id,
      protocol: ticket.protocol,
      status: ticket.status,
      created_at: ticket.created_at,
    },
    {
      status: 201,
      headers: {
        "X-RateLimit-Remaining": String(rl.remaining),
        "X-RateLimit-Reset": String(rl.resetAt),
      },
    },
  );
}
