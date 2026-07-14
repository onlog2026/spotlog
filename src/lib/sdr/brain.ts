import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * CÉREBRO COMERCIAL v1 (Fase 3.2 do GTM autônomo).
 *
 * Aprende com vitórias e perdas: registra cada desfecho (envio → resposta →
 * reunião) por CANAL e HORÁRIO em `gtm_outcomes`, e recomenda o melhor canal
 * e a melhor faixa de horário pelas taxas reais de conversão.
 *
 * Tudo é FAIL-OPEN: se a tabela `gtm_outcomes` ainda não existe (o dono cola o
 * SQL quando quiser), nada quebra — só não aprende ainda.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = SupabaseClient<any, any, any>;

export type OutcomeStage = "sent" | "reply" | "meeting";
export type OutcomeChannel = "whatsapp" | "email";

/** Hora atual (0-23) em America/Sao_Paulo. */
export function spHour(): number {
  const parts = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(new Date());
  return Number(parts.find((p) => p.type === "hour")?.value ?? "0");
}

/** Registra um desfecho pro aprendizado. Nunca lança (best-effort). */
export async function recordOutcome(
  admin: Admin,
  input: {
    orgId: string;
    stage: OutcomeStage;
    channel: OutcomeChannel;
    campaignId?: string | null;
    leadId?: string | null;
    hour?: number;
  },
): Promise<void> {
  try {
    await admin.from("gtm_outcomes").insert({
      organization_id: input.orgId,
      stage: input.stage,
      channel: input.channel,
      campaign_id: input.campaignId ?? null,
      lead_id: input.leadId ?? null,
      hour_sp: input.hour ?? spHour(),
    });
  } catch {
    /* tabela ausente ou erro — aprendizado é opcional, segue o jogo */
  }
}

export type ChannelStat = {
  channel: OutcomeChannel;
  sent: number;
  reply: number;
  meeting: number;
  replyRate: number; // reply/sent
  meetingRate: number; // meeting/reply
};

export type BrainStats = {
  available: boolean;
  byChannel: ChannelStat[];
  byHour: { hour: number; sent: number; reply: number }[];
  recommendedChannel: OutcomeChannel;
  recommendedHour: number | null;
  totalSent: number;
  totalReply: number;
  totalMeeting: number;
};

/** Agrega as taxas de conversão por canal e horário. Fail-open → available:false. */
export async function getBrainStats(admin: Admin, orgId: string): Promise<BrainStats> {
  const empty: BrainStats = {
    available: false,
    byChannel: [],
    byHour: [],
    recommendedChannel: "whatsapp",
    recommendedHour: null,
    totalSent: 0,
    totalReply: 0,
    totalMeeting: 0,
  };
  let rows: Array<{ stage: string; channel: string; hour_sp: number | null }> = [];
  try {
    const { data, error } = await admin
      .from("gtm_outcomes")
      .select("stage, channel, hour_sp")
      .eq("organization_id", orgId)
      .limit(5000);
    if (error) return empty;
    rows = (data ?? []) as typeof rows;
  } catch {
    return empty;
  }

  const chan = (c: string): OutcomeChannel => (c === "email" ? "email" : "whatsapp");
  const acc: Record<OutcomeChannel, { sent: number; reply: number; meeting: number }> = {
    whatsapp: { sent: 0, reply: 0, meeting: 0 },
    email: { sent: 0, reply: 0, meeting: 0 },
  };
  const hourAcc = new Map<number, { sent: number; reply: number }>();

  for (const r of rows) {
    const c = chan(r.channel);
    if (r.stage === "sent") acc[c].sent++;
    else if (r.stage === "reply") acc[c].reply++;
    else if (r.stage === "meeting") acc[c].meeting++;

    if (typeof r.hour_sp === "number") {
      const h = hourAcc.get(r.hour_sp) ?? { sent: 0, reply: 0 };
      if (r.stage === "sent") h.sent++;
      if (r.stage === "reply") h.reply++;
      hourAcc.set(r.hour_sp, h);
    }
  }

  const byChannel: ChannelStat[] = (["whatsapp", "email"] as OutcomeChannel[]).map((c) => ({
    channel: c,
    sent: acc[c].sent,
    reply: acc[c].reply,
    meeting: acc[c].meeting,
    replyRate: acc[c].sent > 0 ? acc[c].reply / acc[c].sent : 0,
    meetingRate: acc[c].reply > 0 ? acc[c].meeting / acc[c].reply : 0,
  }));

  const byHour = [...hourAcc.entries()]
    .map(([hour, v]) => ({ hour, ...v }))
    .sort((a, b) => a.hour - b.hour);

  // Recomenda o canal com melhor taxa de RESPOSTA e volume mínimo (≥10 envios).
  const candidates = byChannel.filter((c) => c.sent >= 10);
  const recommendedChannel =
    (candidates.sort((a, b) => b.replyRate - a.replyRate)[0]?.channel) ?? "whatsapp";

  // Melhor horário: maior taxa de resposta com ao menos 5 envios na faixa.
  const recommendedHour =
    byHour
      .filter((h) => h.sent >= 5)
      .sort((a, b) => b.reply / b.sent - a.reply / a.sent)[0]?.hour ?? null;

  const totalSent = acc.whatsapp.sent + acc.email.sent;
  const totalReply = acc.whatsapp.reply + acc.email.reply;
  const totalMeeting = acc.whatsapp.meeting + acc.email.meeting;

  return {
    available: rows.length > 0,
    byChannel,
    byHour,
    recommendedChannel,
    recommendedHour,
    totalSent,
    totalReply,
    totalMeeting,
  };
}
