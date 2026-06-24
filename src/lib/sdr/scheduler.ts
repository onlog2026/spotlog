/**
 * Spotlog SDR — Scheduler do outbound_queue.
 *
 * Enfileira mensagens IA-geradas pra envio respeitando suppression list
 * e janelas de envio razoáveis (horário comercial Brasília).
 */
import { getSdrClient } from "@/lib/sdr/db";
import { isSafeToContact } from "./lgpd";

export interface QueueMessageInput {
  orgId: string;
  enrollmentId?: string | null;
  channel: "email" | "whatsapp";
  toEmail?: string | null;
  toPhone?: string | null;
  subject?: string | null;
  body: string;
  scheduledFor?: Date;
}

function nextBusinessSlot(from: Date = new Date()): Date {
  // Horário comercial: ter-qui 09h-18h Brasília
  const d = new Date(from);
  const hour = d.getHours();
  if (hour < 9) d.setHours(9, 30, 0, 0);
  else if (hour >= 18) {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 30, 0, 0);
  }
  // Pula domingo/sábado
  while (d.getDay() === 0 || d.getDay() === 6) {
    d.setDate(d.getDate() + 1);
    d.setHours(9, 30, 0, 0);
  }
  return d;
}

/**
 * Enfileira mensagem — só passa se for safe (LGPD).
 */
export async function enqueueOutbound(
  input: QueueMessageInput,
): Promise<{ queued: boolean; reason?: string; id?: string }> {
  const supabase = await getSdrClient();

  const safe = await isSafeToContact(input.orgId, input.toEmail, input.toPhone);
  if (!safe) {
    await supabase.from("outbound_queue").insert({
      organization_id: input.orgId,
      enrollment_id: input.enrollmentId ?? null,
      channel: input.channel,
      to_email: input.toEmail ?? null,
      to_phone: input.toPhone ?? null,
      subject: input.subject ?? null,
      body: input.body,
      scheduled_for: new Date().toISOString(),
      status: "suprimido",
      error: "LGPD: contato em suppression list ou sem consentimento",
    });
    return { queued: false, reason: "lgpd_unsafe" };
  }

  const scheduledFor = input.scheduledFor ?? nextBusinessSlot();
  const { data, error } = await supabase
    .from("outbound_queue")
    .insert({
      organization_id: input.orgId,
      enrollment_id: input.enrollmentId ?? null,
      channel: input.channel,
      to_email: input.toEmail ?? null,
      to_phone: input.toPhone ?? null,
      subject: input.subject ?? null,
      body: input.body,
      scheduled_for: scheduledFor.toISOString(),
      status: "pendente",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[scheduler.enqueueOutbound]", error);
    return { queued: false, reason: error.message };
  }

  return { queued: true, id: data.id };
}

/**
 * Enfileira sequência completa (3 emails) a partir de uma cadência IA.
 */
export async function enqueueSequence(input: {
  orgId: string;
  toEmail: string;
  enrollmentId?: string | null;
  sequence: Array<{
    subject: string;
    body: string;
    days_after_previous: number;
  }>;
}) {
  const results: Array<{ index: number; queued: boolean; reason?: string }> = [];
  let cumulativeDays = 0;
  for (let i = 0; i < input.sequence.length; i++) {
    const step = input.sequence[i];
    cumulativeDays += step.days_after_previous;
    const scheduledFor = nextBusinessSlot(
      new Date(Date.now() + cumulativeDays * 24 * 60 * 60 * 1000),
    );
    const r = await enqueueOutbound({
      orgId: input.orgId,
      enrollmentId: input.enrollmentId ?? null,
      channel: "email",
      toEmail: input.toEmail,
      subject: step.subject,
      body: step.body,
      scheduledFor,
    });
    results.push({ index: i, queued: r.queued, reason: r.reason });
  }
  return results;
}
