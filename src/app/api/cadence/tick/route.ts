import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/integrations/email";
import { sendWhatsapp } from "@/lib/integrations/whatsapp";
import { aiGenerate } from "@/lib/integrations/ai";

/**
 * "Tick" do worker de cadência. Processa enrollments que estão com
 * next_action_at <= now() e dispara o próximo passo. Idempotente por step.
 *
 * Pra rodar em produção: configurar Vercel Cron pra POST /api/cadence/tick
 * a cada 5–15 min. Header `x-internal: <WEBHOOK_SECRET>` obrigatório.
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-internal");
  if (
    process.env.WEBHOOK_SECRET &&
    secret !== process.env.WEBHOOK_SECRET
  ) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const now = new Date().toISOString();

  const { data: enrollments } = await admin
    .from("sequence_enrollments")
    .select(
      "id, organization_id, sequence_id, contact_id, current_step, status, next_action_at",
    )
    .eq("status", "active")
    .lte("next_action_at", now)
    .limit(100);

  let processed = 0;

  for (const e of enrollments ?? []) {
    const en = e as unknown as {
      id: string;
      organization_id: string;
      sequence_id: string;
      contact_id: string;
      current_step: number;
    };
    try {
      const { data: stepRow } = await admin
        .from("sequence_steps")
        .select("*")
        .eq("sequence_id", en.sequence_id)
        .eq("position", en.current_step)
        .maybeSingle();

      if (!stepRow) {
        // sem mais passos: finalizar
        await admin
          .from("sequence_enrollments")
          .update({
            status: "finished",
            finished_at: now,
          })
          .eq("id", en.id);
        continue;
      }

      const step = stepRow as unknown as {
        kind: string;
        wait_days: number;
        wait_hours: number;
        subject: string | null;
        body: string | null;
        ai_personalize: boolean;
      };

      const { data: contactRow } = await admin
        .from("contacts")
        .select(
          "id, full_name, first_name, last_name, email, whatsapp, phone, job_title, do_not_contact, companies(name, industry)",
        )
        .eq("id", en.contact_id)
        .single();
      const contact = contactRow as unknown as {
        full_name: string;
        first_name: string | null;
        email: string | null;
        whatsapp: string | null;
        phone: string | null;
        job_title: string | null;
        do_not_contact: boolean;
        companies: { name?: string; industry?: string } | null;
      };

      if (contact.do_not_contact) {
        await admin
          .from("sequence_enrollments")
          .update({ status: "opted_out" })
          .eq("id", en.id);
        continue;
      }

      const firstName =
        contact.first_name ?? contact.full_name.split(" ")[0] ?? "Olá";
      const company = contact.companies?.name ?? "sua empresa";

      // Renderização básica + IA opcional
      let body = (step.body ?? "")
        .replaceAll("{{first_name}}", firstName)
        .replaceAll("{{full_name}}", contact.full_name)
        .replaceAll("{{company}}", company);
      let subject = (step.subject ?? "")
        .replaceAll("{{first_name}}", firstName)
        .replaceAll("{{company}}", company);

      if (step.ai_personalize && (step.kind === "email" || step.kind === "whatsapp")) {
        try {
          const { data: seqRow } = await admin
            .from("sequences")
            .select("ai_prompt")
            .eq("id", en.sequence_id)
            .single();
          const persona =
            (seqRow as { ai_prompt?: string } | null)?.ai_prompt ??
            "Tom profissional, direto, gentil.";
          const out = await aiGenerate({
            organization_id: en.organization_id,
            max_tokens: 400,
            temperature: 0.6,
            messages: [
              {
                role: "system",
                content: `${persona}\n\nVocê está escrevendo uma mensagem ${
                  step.kind === "whatsapp" ? "de WhatsApp (informal, curta)" : "de e-mail"
                }. Use o texto-base como referência, mas adapte ao contato. Não invente dados.`,
              },
              {
                role: "user",
                content: `Contato: ${contact.full_name}, ${
                  contact.job_title ?? "cargo desconhecido"
                } na empresa ${company} (setor: ${contact.companies?.industry ?? "n/d"}).\n\nTexto-base:\n${body}\n\nReescreva a mensagem final (não use markdown, não inclua placeholders).`,
              },
            ],
          });
          if (out) body = out;
        } catch (err) {
          console.warn("ai_personalize failed", err);
          // segue com texto-base
        }
      }

      let providerMessageId: string | undefined;
      let providerName: string | undefined;
      let sendOk = false;
      let sendError: string | undefined;

      if (step.kind === "email" && contact.email) {
        const r = await sendEmail({
          organization_id: en.organization_id,
          to: contact.email,
          subject: subject || "(sem assunto)",
          html: body.replace(/\n/g, "<br/>"),
          text: body,
        });
        sendOk = r.ok;
        sendError = r.error;
        providerMessageId = r.provider_message_id;
        providerName = "resend";
      } else if (step.kind === "whatsapp") {
        const to = contact.whatsapp ?? contact.phone;
        if (to) {
          const r = await sendWhatsapp({
            organization_id: en.organization_id,
            to,
            text: body,
          });
          sendOk = r.ok;
          sendError = r.error;
          providerMessageId = r.provider_message_id;
          providerName = r.provider;
        } else {
          sendError = "Contato sem WhatsApp/telefone";
        }
      } else if (step.kind === "wait") {
        sendOk = true; // só avança
      } else if (step.kind === "manual_task") {
        sendOk = true; // cria activity
        await admin.from("activities").insert({
          organization_id: en.organization_id,
          type: "task",
          status: "pending",
          subject: step.subject ?? "Tarefa manual da cadência",
          content: step.body,
          contact_id: en.contact_id,
          due_at: new Date().toISOString(),
        });
      }

      if (step.kind === "email" || step.kind === "whatsapp") {
        await admin.from("messages").insert({
          organization_id: en.organization_id,
          channel: step.kind,
          direction: "outbound",
          status: sendOk ? "sent" : "failed",
          to_address:
            step.kind === "email"
              ? contact.email
              : contact.whatsapp ?? contact.phone,
          subject,
          body_text: body,
          body_html: step.kind === "email" ? body.replace(/\n/g, "<br/>") : null,
          contact_id: en.contact_id,
          sequence_id: en.sequence_id,
          enrollment_id: en.id,
          provider: providerName,
          provider_message_id: providerMessageId,
          sent_at: sendOk ? now : null,
          error: sendError,
        });
      }

      // Avança próximo passo
      const { data: nextStep } = await admin
        .from("sequence_steps")
        .select("wait_days, wait_hours")
        .eq("sequence_id", en.sequence_id)
        .eq("position", en.current_step + 1)
        .maybeSingle();

      if (nextStep) {
        const wait = nextStep as { wait_days: number; wait_hours: number };
        const ms =
          (wait.wait_days * 24 + wait.wait_hours) * 60 * 60 * 1000 +
          5 * 60 * 1000;
        await admin
          .from("sequence_enrollments")
          .update({
            current_step: en.current_step + 1,
            next_action_at: new Date(Date.now() + ms).toISOString(),
          })
          .eq("id", en.id);
      } else {
        await admin
          .from("sequence_enrollments")
          .update({ status: "finished", finished_at: now })
          .eq("id", en.id);
      }

      processed++;
    } catch (err) {
      console.error("enrollment tick error", err);
    }
  }

  return NextResponse.json({ ok: true, processed });
}
