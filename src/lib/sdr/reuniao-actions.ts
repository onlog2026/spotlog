"use server";
/**
 * Fila "Responderam — agendar reunião" do SDR.
 * O lead respondeu à cadência (enrollment status='replied', marcado pelo
 * webhook Digisac). Aqui o dono transforma a resposta em REUNIÃO na agenda
 * interna (appointments) — objetivo final da prospecção.
 */
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Próximo dia útil às 10:00 (horário local do servidor). */
function nextBusinessDay10h(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6) d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

/**
 * Cria o compromisso na agenda a partir de um enrollment respondido e
 * encerra o enrollment. O horário nasce como "amanhã 10h" — o dono confirma
 * o horário real na conversa e ajusta na agenda.
 */
export async function marcarReuniao(enrollmentId: string) {
  const ctx = await requireSession();
  if (!enrollmentId) throw new Error("enrollment obrigatório");
  const admin = createAdminClient();

  const { data: enr } = await admin
    .from("sequence_enrollments")
    .select("id, contact_id, status")
    .eq("id", enrollmentId)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!enr) throw new Error("Resposta não encontrada");
  const contactId = (enr as { contact_id: string }).contact_id;

  const { data: ct } = await admin
    .from("contacts")
    .select("id, full_name, email, whatsapp, phone, company_id, companies(name)")
    .eq("id", contactId)
    .maybeSingle();
  const contact = ct as unknown as {
    id: string;
    full_name: string;
    email: string | null;
    whatsapp: string | null;
    phone: string | null;
    company_id: string | null;
    companies: { name?: string } | null;
  } | null;
  if (!contact) throw new Error("Contato não encontrado");

  // Evita reunião duplicada: a IA do SDR pode já ter marcado um compromisso
  // futuro pra esse mesmo contato (ver conversation.ts) antes do dono clicar aqui.
  const { data: existing } = await admin
    .from("appointments")
    .select("id")
    .eq("organization_id", ctx.org.id)
    .eq("contact_id", contact.id)
    .eq("status", "agendado")
    .gte("scheduled_at", new Date().toISOString())
    .maybeSingle();
  if (existing) {
    await admin
      .from("sequence_enrollments")
      .update({ status: "finished", finished_at: new Date().toISOString() })
      .eq("id", enrollmentId)
      .eq("organization_id", ctx.org.id);
    revalidatePath("/app/sdr");
    revalidatePath("/app/agenda");
    return {
      ok: true,
      appointmentId: (existing as { id: string }).id,
      alreadyExisted: true,
    };
  }

  const empresa = contact.companies?.name;
  const { data: appt, error } = await admin
    .from("appointments")
    .insert({
      organization_id: ctx.org.id,
      owner_user_id: ctx.user.id,
      contact_id: contact.id,
      company_id: contact.company_id,
      title: `Reunião SDR — ${contact.full_name}${empresa ? ` (${empresa})` : ""}`,
      description:
        "Lead respondeu à cadência de prospecção. Confirme o horário na conversa e ajuste aqui se precisar.",
      scheduled_at: nextBusinessDay10h().toISOString(),
      duration_minutes: 30,
      meeting_type: "video",
      status: "agendado",
      source: "sdr",
      created_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (error) throw new Error(`Falha ao criar reunião: ${error.message}`);

  await admin
    .from("sequence_enrollments")
    .update({ status: "finished", finished_at: new Date().toISOString() })
    .eq("id", enrollmentId)
    .eq("organization_id", ctx.org.id);

  revalidatePath("/app/sdr");
  revalidatePath("/app/agenda");
  return { ok: true, appointmentId: (appt as { id: string }).id };
}

/**
 * Reengajar — cadência esgotou sem resposta: reinicia do primeiro toque.
 * Respeita LGPD no envio (o tick checa isSafeToContact/do_not_contact).
 */
export async function reengajarEnrollment(enrollmentId: string) {
  const ctx = await requireSession();
  if (!enrollmentId) throw new Error("enrollment obrigatório");
  const admin = createAdminClient();
  const { error } = await admin
    .from("sequence_enrollments")
    .update({
      status: "active",
      current_step: 0,
      next_action_at: new Date().toISOString(),
      finished_at: null,
    })
    .eq("id", enrollmentId)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/prospeccao");
  revalidatePath("/app/sdr");
  return { ok: true };
}

/** Dispensa a resposta (não vira reunião) — encerra o enrollment. */
export async function dispensarResposta(enrollmentId: string) {
  const ctx = await requireSession();
  if (!enrollmentId) throw new Error("enrollment obrigatório");
  const admin = createAdminClient();
  await admin
    .from("sequence_enrollments")
    .update({ status: "finished", finished_at: new Date().toISOString() })
    .eq("id", enrollmentId)
    .eq("organization_id", ctx.org.id)
    .eq("status", "replied");
  revalidatePath("/app/sdr");
  return { ok: true };
}
