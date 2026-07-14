import { createAdminClient } from "@/lib/supabase/admin";
import { sendSlackNotification } from "./clients/slack";
import { sendDiscordNotification } from "./clients/discord";
import { sendTelegramMessage } from "./clients/telegram";
import { dispatchWebhook } from "./clients/webhook-generic";
import { createCalendarEventForAppointment } from "./google-calendar";

export type DispatchEvent =
  | "lead.created"
  | "lead.converted"
  | "ticket.created"
  | "ticket.replied"
  | "appointment.created"
  | "appointment.confirmed"
  | "deal.won"
  | "deal.lost";

type IntegrationRow = {
  id: string;
  provider: string;
  credentials: Record<string, string> | null;
  settings: Record<string, unknown> | null;
  is_active: boolean;
};

/**
 * Dispara um evento pra todas as integrações ativas da org que tenham
 * `event` listado em settings.events. Não bloqueia o caller — registra
 * resultado em `webhooks` (best effort).
 */
export async function dispatchEvent(
  orgId: string,
  event: DispatchEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  // Fire-and-forget: não bloqueia o caller
  void runDispatch(orgId, event, payload).catch((e) => {
    console.error("[dispatcher] erro:", e);
  });
}

async function runDispatch(
  orgId: string,
  event: DispatchEvent,
  payload: Record<string, unknown>,
) {
  const admin = createAdminClient();
  const { data } = await admin
    .from("integrations")
    .select("id, provider, credentials, settings, is_active")
    .eq("organization_id", orgId)
    .eq("is_active", true);

  const rows = (data ?? []) as IntegrationRow[];
  if (rows.length === 0) return;

  const enriched = {
    event,
    timestamp: new Date().toISOString(),
    organization_id: orgId,
    data: payload,
  };

  const tasks = rows
    .filter((row) => {
      // Google Calendar: cria evento só na criação (sem depender de settings.events;
      // só "created" pra não duplicar quando o agendamento é confirmado depois)
      if (row.provider === "google_calendar") {
        return event === "appointment.created";
      }
      const subs = (row.settings?.events as string[] | undefined) ?? [];
      // se "settings.events" não existir, NÃO dispara (opt-in)
      return Array.isArray(subs) && subs.includes(event);
    })
    .map((row) => sendOne(row, event, enriched));

  await Promise.allSettled(tasks);
}

async function sendOne(
  row: IntegrationRow,
  event: DispatchEvent,
  payload: Record<string, unknown>,
): Promise<void> {
  const cred = row.credentials ?? {};
  let result: { ok: boolean; error?: string } = { ok: false, error: "no handler" };
  const text = formatEventText(event, payload);

  try {
    switch (row.provider) {
      case "slack":
        result = await sendSlackNotification(cred.webhook_url ?? "", text);
        break;
      case "discord":
        result = await sendDiscordNotification(cred.webhook_url ?? "", text);
        break;
      case "telegram":
        result = await sendTelegramMessage(
          cred.bot_token ?? "",
          cred.chat_id ?? "",
          text,
        );
        break;
      case "webhook":
        result = await dispatchWebhook(
          cred.url ?? "",
          payload,
          cred.secret || undefined,
        );
        break;
      case "google_calendar": {
        const orgId = payload.organization_id as string | undefined;
        const apptId = (payload.data as { id?: string } | undefined)?.id;
        result =
          orgId && apptId
            ? await createCalendarEventForAppointment(orgId, apptId, cred)
            : { ok: false, error: "missing_org_or_appt" };
        break;
      }
      default:
        // outros providers (resend/twilio/etc) não são notificadores de evento
        return;
    }
  } catch (e) {
    result = { ok: false, error: e instanceof Error ? e.message : "erro" };
  }

  // Loga em webhooks (best effort — tabela tem org, name, url, events, secret, is_active)
  try {
    const admin = createAdminClient();
    await admin
      .from("integrations")
      .update({
        last_test_at: new Date().toISOString(),
        last_test_ok: result.ok,
        last_test_error: result.ok ? null : result.error ?? null,
      })
      .eq("id", row.id);
  } catch {
    /* ignore */
  }
}

function formatEventText(
  event: DispatchEvent,
  payload: Record<string, unknown>,
): string {
  const data = (payload.data as Record<string, unknown>) ?? {};
  switch (event) {
    case "lead.created":
      return `🎯 *Novo lead*: ${data.full_name ?? data.email ?? "sem nome"} (${data.source ?? "n/d"})`;
    case "lead.converted":
      return `✨ *Lead convertido*: ${data.full_name ?? data.email ?? "sem nome"}`;
    case "ticket.created":
      return `🎫 *Novo ticket*: ${data.subject ?? data.protocol ?? "novo chamado"}`;
    case "ticket.replied":
      return `💬 *Resposta em ticket*: ${data.protocol ?? data.id ?? ""}`;
    case "appointment.created":
      return `📅 *Agendamento*: ${data.title ?? "novo compromisso"} — ${data.scheduled_at ?? ""}`;
    case "appointment.confirmed":
      return `✅ *Agendamento confirmado*: ${data.title ?? ""}`;
    case "deal.won":
      return `🏆 *Negócio ganho*: ${data.title ?? ""} — R$ ${data.amount ?? "?"}`;
    case "deal.lost":
      return `❌ *Negócio perdido*: ${data.title ?? ""}`;
    default:
      return `Evento: ${event}`;
  }
}
