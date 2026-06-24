import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_STATUS = [
  "aberto",
  "em_analise",
  "aguardando_cliente",
  "resolvido",
  "fechado",
] as const;

const patchSchema = z.object({
  status: z.enum(VALID_STATUS),
  resolution_notes: z.string().max(4000).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ protocol: string }> },
) {
  const auth = await requireApiAuth(req, "tickets:read");
  if (auth.error) return auth.error;
  const { ctx } = auth;

  const rl = checkRateLimit(ctx.apiKeyId);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const { protocol } = await params;
  const admin = createAdminClient();

  const { data: ticket } = await admin
    .from("support_tickets")
    .select(
      // @ts-expect-error coluna nova
      "id, protocol, subject, description, status, priority, department, category, opened_at, last_response_at, closed_at, created_at",
    )
    .eq("organization_id", ctx.orgId)
    .eq("protocol", protocol)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket não encontrado.", code: "not_found" },
      { status: 404 },
    );
  }

  // @ts-expect-error tipagem dinâmica
  const ticketId = ticket.id as string;
  const { data: messages } = await admin
    .from("ticket_messages")
    .select("id, author_kind, body, attachments_json, created_at")
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true })
    .limit(50);

  return NextResponse.json({
    ticket,
    messages: messages ?? [],
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ protocol: string }> },
) {
  const auth = await requireApiAuth(req, "tickets:write");
  if (auth.error) return auth.error;
  const { ctx } = auth;

  const rl = checkRateLimit(ctx.apiKeyId);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const { protocol } = await params;
  let payload: z.infer<typeof patchSchema>;
  try {
    payload = patchSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Payload inválido.", details: String(err), code: "validation_error" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: existing } = await admin
    .from("support_tickets")
    .select("id")
    .eq("organization_id", ctx.orgId)
    .eq("protocol", protocol)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json(
      { error: "Ticket não encontrado.", code: "not_found" },
      { status: 404 },
    );
  }

  const ticketId = existing.id as string;
  const now = new Date().toISOString();
  const patch: Record<string, unknown> = { status: payload.status };
  if (payload.status === "resolvido" || payload.status === "fechado") {
    patch.closed_at = now;
  } else {
    patch.closed_at = null;
  }

  const { error } = await admin
    .from("support_tickets")
    .update(patch)
    .eq("id", ticketId);

  if (error) {
    return NextResponse.json(
      { error: error.message, code: "db_error" },
      { status: 500 },
    );
  }

  const sysBody = payload.resolution_notes
    ? `Status alterado para "${payload.status}" via API.\n${payload.resolution_notes}`
    : `Status alterado para "${payload.status}" via API.`;

  await admin.from("ticket_messages").insert({
    ticket_id: ticketId,
    author_user_id: null,
    author_kind: "sistema",
    body: sysBody,
  });

  await admin.from("audit_logs").insert({
    organization_id: ctx.orgId,
    user_id: null,
    entity: "support_tickets",
    entity_id: ticketId,
    action: "patch_via_api",
    diff: { status: payload.status, api_key_id: ctx.apiKeyId },
  });

  return NextResponse.json({ ok: true, status: payload.status });
}
