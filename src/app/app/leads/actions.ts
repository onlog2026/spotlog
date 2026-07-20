"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendConvertedEmail } from "@/lib/email/lead-converted-notification";
import { isSafeToContact } from "@/lib/sdr/lgpd";
import { normalizePhoneBR, isValidEmail } from "@/lib/sdr/validate";

const LEAD_STATUS = [
  "new",
  "contacted",
  "qualified",
  "disqualified",
  "converted",
  "recycled",
] as const;

const LeadSchema = z.object({
  full_name: z.string().min(2, "Nome obrigatório"),
  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  company_name: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  source: z.string().min(1, "Origem obrigatória"),
  source_detail: z.string().optional().nullable(),
  status: z.enum(LEAD_STATUS).default("new"),
  score: z.number().int().min(0).max(100).optional().nullable(),
  message: z.string().optional().nullable(),
});

function parseForm(formData: FormData) {
  const v = (key: string) => {
    const raw = formData.get(key);
    if (raw === null) return null;
    const s = String(raw).trim();
    return s === "" ? null : s;
  };
  const scoreRaw = v("score");
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: v("email"),
    phone: v("phone"),
    whatsapp: v("whatsapp"),
    company_name: v("company_name"),
    job_title: v("job_title"),
    source: String(formData.get("source") ?? "manual").trim() || "manual",
    source_detail: v("source_detail"),
    status: (v("status") ?? "new") as (typeof LEAD_STATUS)[number],
    score: scoreRaw ? Number(scoreRaw) : null,
    message: v("message"),
  };
}

/**
 * COLOCAR NA CADÊNCIA (em massa) — inscreve leads novos com WhatsApp/e-mail
 * na sequência escolhida. O cron /api/cadence/tick dispara os envios sozinho.
 * Guardas: LGPD (opt-out), dedupe de contato, unique(sequence, contact).
 */
/**
 * @param minScore Nota de corte opcional (add-on Prospecção Avançada) —
 * quando informado, só inscreve leads com `score >= minScore`. Sem informar,
 * comportamento igual a sempre (todos os leads contatáveis entram).
 */
export async function colocarLeadsNaCadencia(sequenceId: string, minScore?: number) {
  const ctx = await requireSession();
  if (!sequenceId) throw new Error("Escolha uma cadência.");
  const admin = createAdminClient();

  let query = admin
    .from("leads")
    .select("id, full_name, email, phone, company_name, job_title, score")
    .eq("organization_id", ctx.org.id)
    .in("status", ["new", "contacted"]);
  if (typeof minScore === "number" && minScore > 0) {
    query = query.gte("score", minScore);
  }
  const { data: leadsRaw } = await query.limit(300);

  let enrolled = 0;
  let skipped = 0;
  for (const l of (leadsRaw ?? []) as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
    company_name: string | null;
    job_title: string | null;
    score: number | null;
  }>) {
    try {
      const phone = normalizePhoneBR(l.phone ?? undefined) || null;
      const email = l.email && isValidEmail(l.email) ? l.email : null;
      if (!phone && !email) {
        skipped++;
        continue;
      }
      const safe = await isSafeToContact(ctx.org.id, email, phone);
      if (!safe) {
        skipped++;
        continue;
      }

      // find-or-create do contato (a cadência trabalha com `contacts`)
      const orParts: string[] = [];
      if (email) orParts.push(`email.eq.${email}`);
      if (phone) orParts.push(`whatsapp.eq.${phone}`, `phone.eq.${phone}`);
      let contactId: string | null = null;
      const { data: existingCt } = await admin
        .from("contacts")
        .select("id")
        .eq("organization_id", ctx.org.id)
        .or(orParts.join(","))
        .limit(1)
        .maybeSingle();
      if (existingCt) {
        contactId = (existingCt as { id: string }).id;
      } else {
        const { data: newCt } = await admin
          .from("contacts")
          .insert({
            organization_id: ctx.org.id,
            full_name: l.full_name ?? l.company_name ?? "Contato",
            email,
            whatsapp: phone,
            phone,
            job_title: l.job_title ?? null,
            source: "leads-cadencia",
          })
          .select("id")
          .single();
        contactId = (newCt as { id: string } | null)?.id ?? null;
      }
      if (!contactId) {
        skipped++;
        continue;
      }

      // unique(sequence_id, contact_id) → duplicata vira erro silencioso
      const { error: enrErr } = await admin.from("sequence_enrollments").insert({
        organization_id: ctx.org.id,
        sequence_id: sequenceId,
        contact_id: contactId,
      });
      if (enrErr) skipped++;
      else enrolled++;
    } catch {
      skipped++;
    }
  }

  revalidatePath("/app/leads");
  return { enrolled, skipped };
}

export async function createLead(formData: FormData) {
  const ctx = await requireSession();
  const parsed = LeadSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    redirect(`/app/leads/novo?error=${encodeURIComponent(msg)}`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("leads")
    .insert({
      organization_id: ctx.org.id,
      assigned_to: ctx.user.id,
      ...parsed.data,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/app/leads/novo?error=${encodeURIComponent(error?.message ?? "Falha ao criar.")}`,
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "lead",
    entity_id: data.id,
    action: "create",
    diff: parsed.data,
  });

  revalidatePath("/app/leads");
  redirect(`/app/leads/${data.id}?created=1`);
}

export async function updateLead(id: string, formData: FormData) {
  const ctx = await requireSession();
  const parsed = LeadSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    redirect(`/app/leads/${id}/editar?error=${encodeURIComponent(msg)}`);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);

  if (error) {
    redirect(
      `/app/leads/${id}/editar?error=${encodeURIComponent(error.message)}`,
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "lead",
    entity_id: id,
    action: "update",
    diff: parsed.data,
  });

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${id}`);
  redirect(`/app/leads/${id}?updated=1`);
}

export async function deleteLead(id: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) {
    redirect(`/app/leads/${id}?error=${encodeURIComponent(error.message)}`);
  }
  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "lead",
    entity_id: id,
    action: "delete",
  });
  revalidatePath("/app/leads");
  redirect("/app/leads?deleted=1");
}

export async function addLeadActivity(leadId: string, formData: FormData) {
  const ctx = await requireSession();
  const type = String(formData.get("type") ?? "note").trim();
  const subject = String(formData.get("subject") ?? "").trim() || null;
  const content = String(formData.get("content") ?? "").trim() || null;
  const supabase = await createClient();
  const { error } = await supabase.from("activities").insert({
    organization_id: ctx.org.id,
    lead_id: leadId,
    type,
    status: "done",
    subject,
    content,
    owner_id: ctx.user.id,
    created_by: ctx.user.id,
    completed_at: new Date().toISOString(),
  });
  if (error) {
    redirect(`/app/leads/${leadId}?error=${encodeURIComponent(error.message)}`);
  }
  revalidatePath(`/app/leads/${leadId}`);
  redirect(`/app/leads/${leadId}?activity=1`);
}

export async function convertLeadToDeal(leadId: string) {
  const ctx = await requireSession();
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name, company_name, email, phone, score")
    .eq("organization_id", ctx.org.id)
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) {
    redirect(`/app/leads?error=${encodeURIComponent("Lead não encontrado")}`);
  }

  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id")
    .eq("organization_id", ctx.org.id)
    .eq("is_default", true)
    .maybeSingle();
  if (!pipeline) {
    redirect(
      `/app/leads/${leadId}?error=${encodeURIComponent("Configure um pipeline default antes de converter.")}`,
    );
  }

  const { data: stage } = await supabase
    .from("pipeline_stages")
    .select("id")
    .eq("organization_id", ctx.org.id)
    .eq("pipeline_id", pipeline.id)
    .order("position", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!stage) {
    redirect(
      `/app/leads/${leadId}?error=${encodeURIComponent("Pipeline default sem estágios.")}`,
    );
  }

  // tenta achar / criar company a partir do company_name
  let company_id: string | null = null;
  if (lead.company_name) {
    const { data: foundCo } = await supabase
      .from("companies")
      .select("id")
      .eq("organization_id", ctx.org.id)
      .ilike("name", lead.company_name)
      .maybeSingle();
    if (foundCo) {
      company_id = foundCo.id;
    } else {
      const { data: newCo } = await supabase
        .from("companies")
        .insert({
          organization_id: ctx.org.id,
          owner_id: ctx.user.id,
          name: lead.company_name,
          source: "lead_conversion",
        })
        .select("id")
        .single();
      company_id = newCo?.id ?? null;
    }
  }

  // contato a partir do lead
  let contact_id: string | null = null;
  if (lead.full_name) {
    const { data: newContact } = await supabase
      .from("contacts")
      .insert({
        organization_id: ctx.org.id,
        owner_id: ctx.user.id,
        full_name: lead.full_name,
        email: lead.email,
        phone: lead.phone,
        company_id,
        source: "lead_conversion",
      })
      .select("id")
      .single();
    contact_id = newContact?.id ?? null;
  }

  const { data: deal } = await supabase
    .from("deals")
    .insert({
      organization_id: ctx.org.id,
      pipeline_id: pipeline.id,
      stage_id: stage.id,
      title: `${lead.full_name ?? "Lead"}${lead.company_name ? ` - ${lead.company_name}` : ""}`,
      status: "open",
      contact_id,
      company_id,
      owner_id: ctx.user.id,
      source: "lead_conversion",
    })
    .select("id")
    .single();

  if (!deal) {
    redirect(
      `/app/leads/${leadId}?error=${encodeURIComponent("Falha ao criar deal.")}`,
    );
  }

  await supabase
    .from("leads")
    .update({
      status: "converted",
      converted_contact_id: contact_id,
      converted_deal_id: deal.id,
      converted_at: new Date().toISOString(),
    })
    .eq("id", leadId)
    .eq("organization_id", ctx.org.id);

  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "lead",
    entity_id: leadId,
    action: "convert",
    diff: { deal_id: deal.id, contact_id, company_id },
  });

  // RPC convert_lead — notificações in-app
  try {
    await supabase.rpc("convert_lead", { p_lead_id: leadId, p_deal_id: deal.id });
  } catch {}

  // Email best-effort
  try {
    await sendConvertedEmail(ctx.org.id, leadId);
  } catch {}

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${leadId}`);
  const leadName = lead.full_name ?? lead.company_name ?? "Lead";
  redirect(
    `/app/leads/${leadId}?celebrate=1&name=${encodeURIComponent(leadName)}&converted=1`,
  );
}

/**
 * Marca lead como convertido SEM criar deal (caso o user já tenha pipeline manual).
 * Dispara celebração + email + notificações in-app.
 */
export async function markLeadConverted(leadId: string) {
  const ctx = await requireSession();
  const supabase = await createClient();

  const { data: lead } = await supabase
    .from("leads")
    .select("id, full_name, company_name, email, status, converted_deal_id")
    .eq("organization_id", ctx.org.id)
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) {
    redirect(`/app/leads?error=${encodeURIComponent("Lead não encontrado")}`);
  }
  if (lead.status === "converted") {
    redirect(`/app/leads/${leadId}?error=${encodeURIComponent("Lead já convertido")}`);
  }

  try {
    await supabase.rpc("convert_lead", {
      p_lead_id: leadId,
      p_deal_id: lead.converted_deal_id ?? null,
    });
  } catch {
    await supabase
      .from("leads")
      .update({ status: "converted", converted_at: new Date().toISOString() })
      .eq("id", leadId)
      .eq("organization_id", ctx.org.id);
  }

  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "lead",
    entity_id: leadId,
    action: "convert_manual",
  });

  try {
    await sendConvertedEmail(ctx.org.id, leadId);
  } catch {}

  revalidatePath("/app/leads");
  revalidatePath(`/app/leads/${leadId}`);
  const leadName = lead.full_name ?? lead.company_name ?? "Lead";
  redirect(
    `/app/leads/${leadId}?celebrate=1&name=${encodeURIComponent(leadName)}&converted=1`,
  );
}
