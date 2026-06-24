import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireApiAuth, checkRateLimit, rateLimitResponse } from "@/lib/api-auth";
import { createAdminClient } from "@/lib/supabase/admin";

const messageSchema = z.object({
  body: z.string().min(1).max(8000),
  author_name: z.string().optional(),
  author_kind: z.enum(["cliente", "sistema"]).default("cliente"),
  attachments_urls: z.array(z.string().url()).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ protocol: string }> },
) {
  const auth = await requireApiAuth(req, "tickets:write");
  if (auth.error) return auth.error;
  const { ctx } = auth;

  const rl = checkRateLimit(ctx.apiKeyId);
  if (!rl.allowed) return rateLimitResponse(rl.resetAt);

  const { protocol } = await params;
  let payload: z.infer<typeof messageSchema>;
  try {
    payload = messageSchema.parse(await req.json());
  } catch (err) {
    return NextResponse.json(
      { error: "Payload inválido.", details: String(err), code: "validation_error" },
      { status: 400 },
    );
  }

  const admin = createAdminClient();
  const { data: ticket } = await admin
    .from("support_tickets")
    .select("id")
    .eq("organization_id", ctx.orgId)
    .eq("protocol", protocol)
    .maybeSingle();

  if (!ticket) {
    return NextResponse.json(
      { error: "Ticket não encontrado.", code: "not_found" },
      { status: 404 },
    );
  }

  const ticketId = ticket.id as string;
  const now = new Date().toISOString();
  const finalBody = payload.author_name
    ? `[${payload.author_name}]\n${payload.body}`
    : payload.body;

  const { data: msg, error } = await admin
    .from("ticket_messages")
    .insert({
      ticket_id: ticketId,
      author_user_id: null,
      author_kind: payload.author_kind,
      body: finalBody,
      attachments_json: payload.attachments_urls
        ? { urls: payload.attachments_urls }
        : null,
    })
    .select("id, created_at")
    .single();

  if (error || !msg) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao gravar mensagem.", code: "db_error" },
      { status: 500 },
    );
  }

  await admin
    .from("support_tickets")
    .update({ last_response_at: now })
    .eq("id", ticketId);

  return NextResponse.json(
    {
      id: msg.id,
      created_at: msg.created_at,
    },
    { status: 201 },
  );
}
