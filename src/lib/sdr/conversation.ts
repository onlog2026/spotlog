import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { chatComplete } from "@/lib/ai/openai-client";
import { sendWhatsapp } from "@/lib/integrations/whatsapp";
import { getIntegration } from "@/lib/integrations";
import { recordOptOut } from "@/lib/sdr/lgpd";
import { recordOutcome } from "@/lib/sdr/brain";

/**
 * AGENTE CONVERSACIONAL + QUALIFICADOR do GTM autônomo.
 *
 * Quando um lead de prospecção RESPONDE no WhatsApp, este agente assume a
 * conversa: responde como um SDR humano, com memória do histórico, detecta a
 * intenção, extrai BANT a cada troca e, quando o lead está qualificado,
 * propõe horários reais da agenda e MARCA A REUNIÃO sozinho — gerando o
 * briefing do vendedor.
 *
 * Guard-rails: só fala com quem JÁ respondeu; opt-out → LGPD + encerra;
 * máx 6 respostas/dia; só 8h–20h (São Paulo); humano assumiu → IA muda;
 * nunca inventa preço/prazo.
 *
 * Estado: leads.custom_fields.sdr (jsonb — zero DDL).
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = SupabaseClient<any, any, any>;

export type SdrConvoState = {
  mode: "ai" | "human";
  closed?: boolean;
  turns_today?: number;
  turns_date?: string; // YYYY-MM-DD (São Paulo)
  last_inbound_id?: string;
  last_intent?: string;
  bant?: {
    dor?: string;
    orcamento?: string;
    autoridade?: string;
    timing?: string;
  };
  prob?: number;
  briefing?: string;
  meeting_at?: string;
  updated_at?: string;
};

const MAX_TURNS_PER_DAY = 6;
const OPTOUT_RE =
  /\b(pare|parar|remover|remova|me tire|descadastr|cancelar inscri|sair da lista|n[aã]o quero receber|n[aã]o me mande|stop)\b/i;

function spNow(): { hour: number; dateKey: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    hour: "2-digit",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return {
    hour: Number(get("hour")),
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
  };
}

/** Variantes do telefone com/sem DDI 55 (mesma lógica do webhook). */
function phoneVariants(digits: string): string[] {
  const set = new Set<string>([digits]);
  if (digits.length >= 12 && digits.startsWith("55")) set.add(digits.slice(2));
  else if (digits.length === 10 || digits.length === 11) set.add(`55${digits}`);
  return [...set];
}

/** serviceId do número Comercial (SDR) na integração Digisac. */
async function sdrServiceId(orgId: string): Promise<string | null> {
  const digisac = await getIntegration(orgId, "digisac");
  const sid = (digisac?.credentials as { sdr_service_id?: string } | undefined)
    ?.sdr_service_id;
  return sid ?? null;
}

/** 2-3 horários livres nos próximos dias úteis (10h, 14h, 16h SP), sem conflito. */
async function freeSlots(
  admin: Admin,
  orgId: string,
): Promise<{ iso: string; label: string }[]> {
  const out: { iso: string; label: string }[] = [];
  const busy = new Set<string>();
  try {
    const { data } = await admin
      .from("appointments")
      .select("scheduled_at")
      .eq("organization_id", orgId)
      .gte("scheduled_at", new Date().toISOString())
      .lte("scheduled_at", new Date(Date.now() + 7 * 864e5).toISOString());
    for (const r of (data ?? []) as Array<{ scheduled_at: string }>) {
      busy.add(new Date(r.scheduled_at).toISOString().slice(0, 13)); // hora cheia
    }
  } catch {
    /* fail-open: propõe mesmo assim */
  }
  const hours = [10, 14, 16];
  const d = new Date();
  for (let day = 1; day <= 5 && out.length < 3; day++) {
    const cand = new Date(d);
    cand.setDate(cand.getDate() + day);
    const wd = cand.getDay();
    if (wd === 0 || wd === 6) continue; // fim de semana
    for (const h of hours) {
      if (out.length >= 3) break;
      // horário em SP (UTC-3; Brasil sem horário de verão desde 2019)
      const iso = new Date(
        Date.UTC(cand.getFullYear(), cand.getMonth(), cand.getDate(), h + 3, 0, 0),
      ).toISOString();
      if (busy.has(iso.slice(0, 13))) continue;
      const label = `${cand.toLocaleDateString("pt-BR", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        timeZone: "America/Sao_Paulo",
      })} às ${h}h`;
      out.push({ iso, label });
    }
  }
  return out;
}

export async function runSdrConversation(opts: {
  admin: Admin;
  orgId: string;
  contactId: string;
  phone: string; // só dígitos, como veio do webhook
  inboundText: string;
  inboundMessageId?: string;
  conversationId?: string | null;
  serviceId?: string;
  /** Canal que RECEBEU a mensagem — a resposta sai pelo mesmo (padrão digisac). */
  provider?: "evolution" | "zapi" | "digisac";
  /** true quando o webhook acabou de parar uma cadência ativa deste contato */
  justReplied?: boolean;
}): Promise<{ acted: boolean; reason?: string }> {
  const { admin, orgId, phone, inboundText } = opts;

  // 1) Acha o LEAD de prospecção pelo telefone (com/sem DDI).
  const ors = phoneVariants(phone)
    .map((n) => `phone.eq.${n}`)
    .join(",");
  const { data: leadRow } = await admin
    .from("leads")
    .select("id, full_name, company_name, status, score, custom_fields")
    .eq("organization_id", orgId)
    .or(ors)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!leadRow) return { acted: false, reason: "no-lead" };
  const lead = leadRow as {
    id: string;
    full_name: string | null;
    company_name: string | null;
    status: string | null;
    score: number | null;
    custom_fields: Record<string, unknown> | null;
  };

  const cf = { ...(lead.custom_fields ?? {}) } as Record<string, unknown>;
  const hadState = Boolean(cf.sdr);
  const sdr: SdrConvoState = {
    mode: "ai",
    ...((cf.sdr as SdrConvoState | undefined) ?? {}),
  };

  // Só conversa se: acabou de responder a cadência OU já existe conversa em curso.
  if (!opts.justReplied && !hadState) return { acted: false, reason: "not-sdr-convo" };

  const persist = async () => {
    sdr.updated_at = new Date().toISOString();
    await admin
      .from("leads")
      .update({ custom_fields: { ...cf, sdr } })
      .eq("id", lead.id)
      .eq("organization_id", orgId);
  };

  // 2) Guard-rails que silenciam a IA.
  if (sdr.mode === "human") {
    await persist();
    return { acted: false, reason: "human-takeover" };
  }
  if (sdr.closed) return { acted: false, reason: "closed" };
  if (opts.inboundMessageId && sdr.last_inbound_id === opts.inboundMessageId) {
    return { acted: false, reason: "duplicate" }; // retry do webhook
  }
  sdr.last_inbound_id = opts.inboundMessageId;

  const { hour, dateKey } = spNow();
  if (sdr.turns_date !== dateKey) {
    sdr.turns_date = dateKey;
    sdr.turns_today = 0;
  }
  if ((sdr.turns_today ?? 0) >= MAX_TURNS_PER_DAY) {
    await persist();
    return { acted: false, reason: "daily-cap" };
  }
  if (hour < 8 || hour >= 20) {
    await persist(); // registra o inbound; humano vê na fila e a IA retoma no horário
    return { acted: false, reason: "off-hours" };
  }

  // 3) OPT-OUT antes de qualquer IA.
  if (OPTOUT_RE.test(inboundText)) {
    try {
      await recordOptOut({
        orgId,
        phone,
        reason: "Pediu pra parar na conversa do SDR (WhatsApp)",
        source: "sdr_conversation",
      });
    } catch (e) {
      console.error("[sdr-convo] optout", e);
    }
    sdr.closed = true;
    sdr.last_intent = "optout";
    await persist();
    const bye =
      "Claro, sem problema! Removi seu contato da nossa lista agora mesmo. Se um dia precisar de logística, é só chamar. Um abraço! 🙂";
    await sendWhatsapp({
      organization_id: orgId,
      to: phone,
      text: bye,
      serviceId: opts.serviceId || (await sdrServiceId(orgId)) || undefined,
      provider: opts.provider ?? "digisac",
    });
    return { acted: true, reason: "optout" };
  }

  return runAiTurn(opts, lead, cf, sdr, persist);
}

type LeadRow = {
  id: string;
  full_name: string | null;
  company_name: string | null;
  status: string | null;
  score: number | null;
  custom_fields: Record<string, unknown> | null;
};

async function runAiTurn(
  opts: {
    admin: Admin;
    orgId: string;
    contactId: string;
    phone: string;
    inboundText: string;
    conversationId?: string | null;
    serviceId?: string;
    provider?: "evolution" | "zapi" | "digisac";
  },
  lead: LeadRow,
  cf: Record<string, unknown>,
  sdr: SdrConvoState,
  persist: () => Promise<void>,
): Promise<{ acted: boolean; reason?: string }> {
  const { admin, orgId, phone, inboundText } = opts;

  // 4) Contexto: campanha/persona/ICP + empresa + histórico da conversa.
  const resultId = String(cf.prospecting_result_id ?? "");
  let persona =
    "Consultor comercial da Spotlog, operador logístico B2B em São Paulo (armazenagem, fulfillment, entregas same-day/next-day, logística farma com AFE Anvisa).";
  let icpCtx = "";
  let companyCtx = `Empresa: ${lead.company_name ?? lead.full_name ?? "?"}.`;
  try {
    if (resultId) {
      const { data: r } = await admin
        .from("prospecting_results")
        .select("company_data, campaign_id")
        .eq("id", resultId)
        .maybeSingle();
      const rr = r as { company_data?: Record<string, unknown>; campaign_id?: string } | null;
      const cd = (rr?.company_data ?? {}) as Record<string, unknown>;
      const dores = Array.isArray(cd.dores) ? (cd.dores as string[]).slice(0, 3) : [];
      companyCtx =
        `Empresa: ${String(cd.name ?? lead.company_name ?? "?")}` +
        `${cd.city ? ` (${cd.city})` : ""}${cd.industry ? ` — setor ${cd.industry}` : ""}.` +
        `${dores.length ? ` Dores observadas no site: ${dores.join("; ")}.` : ""}` +
        `${cd.pitch ? ` Primeira mensagem que enviamos: "${String(cd.pitch).slice(0, 220)}"` : ""}`;
      if (rr?.campaign_id) {
        const { data: camp } = await admin
          .from("prospecting_campaigns")
          .select("ai_persona, icp")
          .eq("id", rr.campaign_id)
          .maybeSingle();
        const c = camp as { ai_persona?: string | null; icp?: Record<string, unknown> } | null;
        if (c?.ai_persona) persona = c.ai_persona;
        const ai = (c?.icp as { ai?: Record<string, unknown> } | undefined)?.ai;
        if (ai) {
          const doresSeg = Array.isArray(ai.dores_provaveis)
            ? (ai.dores_provaveis as string[]).join("; ")
            : "";
          icpCtx = `Segmento-alvo: ${String(ai.segmento ?? "")}. Dores típicas do segmento: ${doresSeg}.`;
        }
      }
    }
  } catch {
    /* contexto é best-effort */
  }

  // Histórico (últimas 14 mensagens da conversa WhatsApp deste contato)
  let history: { role: "user" | "assistant"; content: string }[] = [];
  try {
    const { data: msgs } = await admin
      .from("messages")
      .select("direction, body_text, created_at")
      .eq("organization_id", orgId)
      .eq("contact_id", opts.contactId)
      .eq("channel", "whatsapp")
      .order("created_at", { ascending: false })
      .limit(14);
    history = ((msgs ?? []) as Array<{ direction: string; body_text: string | null }>)
      .reverse()
      .filter((m) => (m.body_text ?? "").trim())
      .map((m) => ({
        role: m.direction === "inbound" ? ("user" as const) : ("assistant" as const),
        content: (m.body_text ?? "").slice(0, 600),
      }));
  } catch {
    /* sem histórico ainda */
  }

  // Horários reais disponíveis (pra IA oferecer quando qualificar)
  const slots = await freeSlots(admin, orgId);
  const slotsTxt = slots.map((s, i) => `${i + 1}) ${s.label} [${s.iso}]`).join("\n");

  // 5) UM call de IA: resposta + intenção + BANT + decisão de reunião (JSON).
  const sys = `Você é um SDR HUMANO brasileiro (nunca diga que é IA/robô/assistente virtual). ${persona}
${icpCtx}
${companyCtx}
BANT já apurado: ${JSON.stringify(sdr.bant ?? {})}.

SUA MISSÃO: conduzir a conversa no WhatsApp com naturalidade até marcar uma REUNIÃO de 15 minutos. Empatia antes de solução; UMA pergunta por vez; mensagens CURTAS (máx 40 palavras); tom caloroso, zero robotizado; no máx 1 emoji. NUNCA invente preço, prazo, número ou certificação — se pedirem preço, explique que depende do volume/rota e que é exatamente isso que a reunião resolve em 15min.
Reconheça a intenção e mude a estratégia: objeção ("já tenho fornecedor") → pergunte o que mais pesa hoje (preço? prazo? ocorrência?); sem autoridade ("quem decide é o sócio") → peça pra incluir o sócio na reunião; timing ("volta mês que vem") → concorde e proponha deixar 15min agendados; interesse → avance pra reunião.
QUANDO o lead demonstrar interesse + (autoridade OU pedir proposta/reunião), OFEREÇA exatamente 2 destes horários (fale o rótulo em linguagem natural, nunca o código):
${slotsTxt || "(sem horários — proponha 'amanhã às 10h')"}
Se o lead ACEITAR um horário, confirme e preencha meeting_iso com o código [ISO] do horário escolhido.

RESPONDA APENAS com JSON válido:
{"reply":"sua mensagem de WhatsApp","intent":"interesse|objecao|sem_autoridade|timing|pedir_proposta|duvida|outro","bant":{"dor":"...","orcamento":"...","autoridade":"...","timing":"..."},"prob":0-100,"qualified":true|false,"meeting_iso":null ou "ISO do horário aceito","briefing":null ou "quando qualified: resumo pro vendedor com dor, objeções, argumentos e próximo passo (4-6 linhas)"}`;

  const res = await chatComplete({
    model: "gpt-4o",
    temperature: 0.7,
    maxTokens: 700,
    orgId,
    messages: [
      { role: "system", content: sys },
      ...history,
      { role: "user", content: inboundText.slice(0, 900) },
    ],
  });

  if (!res.ok || !res.content?.trim()) {
    await persist();
    return { acted: false, reason: "ai-fail" };
  }

  let out: {
    reply?: string;
    intent?: string;
    bant?: SdrConvoState["bant"];
    prob?: number;
    qualified?: boolean;
    meeting_iso?: string | null;
    briefing?: string | null;
  } = {};
  try {
    const raw = res.content.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
    const s = raw.indexOf("{");
    const e = raw.lastIndexOf("}");
    out = JSON.parse(raw.slice(s, e + 1));
  } catch {
    // IA fugiu do JSON: usa o texto cru como resposta (melhor que silêncio)
    out = { reply: res.content.trim().slice(0, 500), intent: "outro" };
  }
  const reply = (out.reply ?? "").trim().slice(0, 900);
  if (!reply) {
    await persist();
    return { acted: false, reason: "empty-reply" };
  }

  // 6) Atualiza estado/qualificação (Agente Qualificador).
  sdr.turns_today = (sdr.turns_today ?? 0) + 1;
  sdr.last_intent = out.intent ?? "outro";
  sdr.bant = { ...(sdr.bant ?? {}), ...(out.bant ?? {}) };
  if (typeof out.prob === "number") sdr.prob = Math.max(0, Math.min(100, out.prob));
  if (out.briefing) sdr.briefing = String(out.briefing).slice(0, 2000);

  // 7) Reunião aceita → cria o compromisso na agenda + status do lead.
  let meetingCreated = false;
  const meetIso =
    out.meeting_iso && /^\d{4}-\d{2}-\d{2}T/.test(String(out.meeting_iso))
      ? String(out.meeting_iso)
      : null;
  if (meetIso && !sdr.meeting_at) {
    try {
      await admin.from("appointments").insert({
        organization_id: orgId,
        lead_id: lead.id,
        contact_id: opts.contactId,
        title: `Reunião SDR — ${lead.company_name ?? lead.full_name ?? "lead"}`,
        description: sdr.briefing ?? "Reunião marcada pelo agente SDR (IA).",
        scheduled_at: meetIso,
        duration_minutes: 30,
        meeting_type: "video",
        status: "agendado",
        source: "sdr_ia",
        notes: sdr.briefing ?? null,
      });
      sdr.meeting_at = meetIso;
      meetingCreated = true;
      // Cérebro Comercial: vitória! registra a REUNIÃO marcada.
      await recordOutcome(admin, {
        orgId,
        stage: "meeting",
        channel: "whatsapp",
        leadId: lead.id,
      });
    } catch (e) {
      console.error("[sdr-convo] appointment", e);
    }
  }

  try {
    await admin
      .from("leads")
      .update({
        status: meetingCreated
          ? "meeting_scheduled"
          : out.qualified
            ? "qualified"
            : lead.status ?? "replied",
      })
      .eq("id", lead.id)
      .eq("organization_id", orgId);
  } catch {
    /* status é best-effort */
  }
  await persist();

  // 8) Envia a resposta (delay curto humanizado) e grava no transcript.
  await new Promise((r) => setTimeout(r, 2500 + Math.random() * 5000));
  const send = await sendWhatsapp({
    organization_id: orgId,
    to: phone,
    text: reply,
    serviceId: opts.serviceId || (await sdrServiceId(orgId)) || undefined,
    provider: opts.provider ?? "digisac",
  });
  if (send.ok && opts.conversationId) {
    try {
      await admin.from("messages").insert({
        organization_id: orgId,
        conversation_id: opts.conversationId,
        channel: "whatsapp",
        direction: "outbound",
        status: "sent",
        body_text: reply,
        contact_id: opts.contactId,
        provider: opts.provider ?? "digisac",
        provider_message_id: send.provider_message_id ?? null,
        metadata: { sdr_ai: true, intent: sdr.last_intent, prob: sdr.prob ?? null },
      });
    } catch {
      /* transcript best-effort */
    }
  }

  return { acted: send.ok, reason: send.ok ? "replied" : `send-fail:${send.error}` };
}
