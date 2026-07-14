import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dispatchEvent } from "@/lib/integrations/dispatcher";

/**
 * POST /api/agenda/book
 *
 * body: { org, owner, scheduled_at, duration?, title?, description?,
 *         external_name?, external_email?, external_phone?,
 *         lead_id?, contact_id?, company_id?,
 *         meeting_type?, meeting_url?, meeting_location?, source? }
 */
export async function POST(req: Request) {
  let body: Record<string, unknown> = {};
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }
  const org = body.org as string | undefined;
  const owner = body.owner as string | undefined;
  const scheduledAt = body.scheduled_at as string | undefined;
  if (!org || !owner || !scheduledAt) {
    return NextResponse.json(
      { error: "org, owner e scheduled_at obrigatórios" },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  const payload = {
    organization_id: org,
    owner_user_id: owner,
    lead_id: (body.lead_id as string | undefined) ?? null,
    contact_id: (body.contact_id as string | undefined) ?? null,
    company_id: (body.company_id as string | undefined) ?? null,
    external_name: (body.external_name as string | undefined) ?? null,
    external_email: (body.external_email as string | undefined) ?? null,
    external_phone: (body.external_phone as string | undefined) ?? null,
    title: (body.title as string | undefined) ?? "Reunião agendada",
    description: (body.description as string | undefined) ?? null,
    scheduled_at: scheduledAt,
    duration_minutes: (body.duration as number | undefined) ?? 30,
    meeting_type: (body.meeting_type as string | undefined) ?? "video",
    meeting_url: (body.meeting_url as string | undefined) ?? null,
    meeting_location: (body.meeting_location as string | undefined) ?? null,
    source: (body.source as string | undefined) ?? "public_form",
    notes: (body.notes as string | undefined) ?? null,
  };

  const { data: apptId, error } = await supabase.rpc("create_appointment", {
    p_payload: payload,
  });

  if (error) {
    console.error("[agenda/book] rpc error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notifica o owner (best-effort)
  try {
    await supabase.from("notifications").insert({
      organization_id: org,
      user_id: owner,
      kind: "lead",
      title: "Novo agendamento",
      body: `${payload.external_name ?? "Lead"} agendou pra ${new Date(scheduledAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })}`,
      link: `/app/agenda`,
      is_read: false,
    });
  } catch (e) {
    console.warn("[agenda/book] notification insert failed", e);
  }

  // Dispara integrações: Google Calendar cria o evento; Slack/Discord/Telegram/webhook notificam
  dispatchEvent(org, "appointment.created", {
    id: apptId as string,
    title: payload.title,
    scheduled_at: scheduledAt,
  });

  return NextResponse.json({ ok: true, appointment_id: apptId });
}
