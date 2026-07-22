import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/integrations/email";
import { sendWhatsapp } from "@/lib/integrations/whatsapp";
import { getIntegration } from "@/lib/integrations";
import { aiGenerate } from "@/lib/integrations/ai";
import { isSafeToContact } from "@/lib/sdr/lgpd";
import { recordOutcome } from "@/lib/sdr/brain";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Autoriza: (1) Vercel Cron — manda `Authorization: Bearer <CRON_SECRET>` (GET);
 * (2) chamada interna/manual — header `x-internal: <WEBHOOK_SECRET>` (POST).
 * Se nenhum secret estiver configurado, libera (dev).
 */
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`)
    return true;
  const webhook = process.env.WEBHOOK_SECRET;
  if (webhook && req.headers.get("x-internal") === webhook) return true;
  // NÃO confiar em user-agent — é só um header, qualquer curl finge ser
  // "vercel-cron". Com CRON_SECRET configurado, a Vercel já manda o Bearer
  // automaticamente na chamada agendada (checado acima); sem isso, esta
  // linha era um bypass total do segredo.
  return !cronSecret && !webhook;
}

// Anti-ban WhatsApp (Evolution é API não-oficial): poucos envios por tick,
// com intervalo humano entre eles. Enrollments que sobrarem ficam pro
// próximo tick do cron — o ritmo total fica naturalmente espaçado.
const MAX_WHATSAPP_PER_TICK = 6;
const waJitter = () =>
  new Promise((r) => setTimeout(r, 3000 + Math.random() * 4000));

/**
 * Chave do NÚMERO/CANAL de WhatsApp que essa org realmente vai usar (mesma
 * cascata de `sendWhatsapp` sem provider forçado: Evolution → Z-API → Digisac).
 * Orgs com integração própria (linha no banco) têm `id` único → cota
 * independente. Orgs que caem no fallback de env (`id === "env"`) COMPARTILHAM
 * o mesmo número — por isso usam a mesma chave fixa entre si, preservando o
 * anti-ban original pra esse número compartilhado.
 */
async function whatsappChannelKey(orgId: string): Promise<string> {
  for (const provider of ["evolution", "zapi", "digisac"] as const) {
    const row = await getIntegration(orgId, provider);
    if (row) return row.id === "env" ? `env:${provider}` : row.id;
  }
  return `no-channel:${orgId}`;
}

/**
 * Curva de aquecimento (add-on Prospecção Avançada) — soma-se ao teto de
 * 6/tick acima, não o substitui. Org que começou a mandar WhatsApp
 * automático há pouco tempo tem um teto DIÁRIO mais baixo, subindo aos
 * poucos. Depois de ~7 dias, só o limite por tick vale (sem teto extra).
 * Granularidade por org (não por número real) — suficiente pro objetivo:
 * não deixar uma org nova disparar em volume desde o dia 1.
 */
const WARMUP_PROVIDER = "cadence";
const WARMUP_IDENTIFIER = "org";

function warmupDailyLimit(startedAt: string): number {
  const ageMs = Date.now() - new Date(startedAt).getTime();
  const days = ageMs / (24 * 60 * 60 * 1000);
  if (days < 3) return 10;
  if (days < 7) return 25;
  return Infinity;
}

/**
 * Confere se a org ainda tem "cota de aquecimento" hoje. Se sim, incrementa
 * o contador e retorna true. Se não (bateu o teto do dia), retorna false —
 * o chamador pula o envio (fica pro próximo tick/dia, igual ao MAX_WHATSAPP_PER_TICK).
 * Best-effort: qualquer falha de leitura/escrita LIBERA o envio (fail-open,
 * mesma filosofia do resto do projeto — nunca travar produção por uma
 * tabela nova).
 */
async function warmupAllowsAndIncrement(
  admin: ReturnType<typeof createAdminClient>,
  orgId: string,
): Promise<boolean> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const { data: rowRaw } = await admin
      .from("whatsapp_number_warmup")
      .select("started_at, send_date, sent_today")
      .eq("organization_id", orgId)
      .eq("provider", WARMUP_PROVIDER)
      .eq("identifier", WARMUP_IDENTIFIER)
      .maybeSingle();
    const row = rowRaw as { started_at: string; send_date: string; sent_today: number } | null;

    if (!row) {
      // Primeiro envio automático desta org — nasce a curva agora.
      await admin.from("whatsapp_number_warmup").insert({
        organization_id: orgId,
        provider: WARMUP_PROVIDER,
        identifier: WARMUP_IDENTIFIER,
        started_at: new Date().toISOString(),
        send_date: today,
        sent_today: 1,
      });
      return true;
    }

    const sentToday = row.send_date === today ? row.sent_today : 0; // novo dia → reseta
    const limit = warmupDailyLimit(row.started_at);
    if (sentToday >= limit) return false;

    await admin
      .from("whatsapp_number_warmup")
      .update({
        send_date: today,
        sent_today: sentToday + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("organization_id", orgId)
      .eq("provider", WARMUP_PROVIDER)
      .eq("identifier", WARMUP_IDENTIFIER);
    return true;
  } catch (e) {
    console.warn("[cadence/tick] warmup check falhou — liberando envio (fail-open)", e);
    return true;
  }
}

/** Processa enrollments com next_action_at <= now() e dispara o próximo passo. */
async function runTick(): Promise<number> {
  const admin = createAdminClient();
  const now = new Date().toISOString();
  // Por NÚMERO real de WhatsApp (não por org, não global — ver whatsappChannelKey
  // abaixo). Orgs com integração própria em /app/admin/integracoes têm cota
  // independente; orgs no fallback de env (número compartilhado) dividem a
  // mesma cota entre si, preservando o anti-ban original desse número.
  const whatsappSentByOrg = new Map<string, number>();

  // sequences!inner + is_active=true: cadência pausada não deve ser
  // processada (o toggle Ativa/Pausada era só decorativo antes disso).
  const { data: enrollments } = await admin
    .from("sequence_enrollments")
    .select(
      "id, organization_id, sequence_id, contact_id, current_step, status, next_action_at, sequences!inner(is_active)",
    )
    .eq("status", "active")
    .eq("sequences.is_active", true)
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
        await admin
          .from("sequence_enrollments")
          .update({ status: "finished", finished_at: now })
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

      // LGPD: suppression list / opt-out bloqueia QUALQUER envio da cadência.
      try {
        const safe = await isSafeToContact(
          en.organization_id,
          contact.email,
          contact.whatsapp ?? contact.phone,
        );
        if (!safe) {
          await admin
            .from("sequence_enrollments")
            .update({ status: "opted_out" })
            .eq("id", en.id);
          continue;
        }
      } catch (err) {
        console.warn("isSafeToContact falhou — pulando envio por segurança", err);
        continue;
      }

      const firstName =
        contact.first_name ?? contact.full_name.split(" ")[0] ?? "Olá";
      const company = contact.companies?.name ?? "sua empresa";

      let body = (step.body ?? "")
        .replaceAll("{{first_name}}", firstName)
        .replaceAll("{{full_name}}", contact.full_name)
        .replaceAll("{{company}}", company);
      const subject = (step.subject ?? "")
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
        // Teto por tick atingido (por NÚMERO/canal real, não por org) → deixa
        // este enrollment pro próximo tick (não avança o passo).
        const channelKey = await whatsappChannelKey(en.organization_id);
        const sentForOrg = whatsappSentByOrg.get(channelKey) ?? 0;
        if (sentForOrg >= MAX_WHATSAPP_PER_TICK) continue;
        // Curva de aquecimento (org nova manda menos por dia) — soma ao teto acima.
        if (!(await warmupAllowsAndIncrement(admin, en.organization_id))) continue;
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
          if (r.ok) {
            whatsappSentByOrg.set(channelKey, sentForOrg + 1);
            await waJitter(); // intervalo humano entre envios
          }
        } else {
          sendError = "Contato sem WhatsApp/telefone";
        }
      } else if (step.kind === "wait") {
        sendOk = true;
      } else if (step.kind === "manual_task") {
        sendOk = true;
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

      if ((step.kind === "email" || step.kind === "whatsapp") && sendOk) {
        // Cérebro Comercial: registra o ENVIO (aprendizado por canal/hora).
        await recordOutcome(admin, {
          orgId: en.organization_id,
          stage: "sent",
          channel: step.kind === "email" ? "email" : "whatsapp",
        });
      }

      if (step.kind === "email" || step.kind === "whatsapp") {
        await admin.from("messages").insert({
          organization_id: en.organization_id,
          channel: step.kind,
          direction: "outbound",
          status: sendOk ? "sent" : "failed",
          to_address:
            step.kind === "email" ? contact.email : contact.whatsapp ?? contact.phone,
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

      const { data: nextStep } = await admin
        .from("sequence_steps")
        .select("wait_days, wait_hours")
        .eq("sequence_id", en.sequence_id)
        .eq("position", en.current_step + 1)
        .maybeSingle();

      if (nextStep) {
        const wait = nextStep as { wait_days: number; wait_hours: number };
        const ms =
          (wait.wait_days * 24 + wait.wait_hours) * 60 * 60 * 1000 + 5 * 60 * 1000;
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

  return processed;
}

/** Vercel Cron (GET) — roda o tick da cadência. */
export async function GET(req: NextRequest) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const processed = await runTick();
  return NextResponse.json({ ok: true, processed });
}

/** Disparo manual/interno (POST com x-internal). */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const processed = await runTick();
  return NextResponse.json({ ok: true, processed });
}
