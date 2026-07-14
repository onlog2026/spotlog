import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { onlyDigits } from "@/lib/utils";
import { runSdrConversation } from "@/lib/sdr/conversation";
import { recordOutcome } from "@/lib/sdr/brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// O agente SDR conversa dentro do request (IA + delay humanizado) — precisa de folga.
export const maxDuration = 60;

/**
 * Webhook inbound da EVOLUTION API (WhatsApp não-oficial).
 * Configure na Evolution: Webhook URL = https://www.spotlog.com.br/api/webhooks/evolution?org=<orgId>
 * com o evento MESSAGES_UPSERT ligado.
 *
 * Identifica a org por ?org OU pelo nome da instância (credentials.instance).
 * Espelha o webhook Digisac: grava a mensagem, para a cadência quando o lead
 * responde e aciona o SDR conversacional — respondendo pelo MESMO canal
 * (provider "evolution"). Sempre responde 200 (best-effort).
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let org = url.searchParams.get("org");
  const secret = url.searchParams.get("secret");

  const admin = createAdminClient();
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;

  const event = String(payload?.event ?? "").toLowerCase();
  const instance = String(payload?.instance ?? "");
  const data = (payload?.data ?? {}) as Record<string, unknown>;
  const key = (data?.key ?? {}) as Record<string, unknown>;

  // Identifica a integração por ?org OU pela instância do payload.
  const { data: integs } = await admin
    .from("integrations")
    .select("organization_id, credentials")
    .eq("provider", "evolution");
  const list = (integs ?? []) as Array<{
    organization_id: string;
    credentials: Record<string, string>;
  }>;
  const integ =
    (org ? list.find((i) => i.organization_id === org) : undefined) ||
    (instance ? list.find((i) => i.credentials?.instance === instance) : undefined) ||
    (list.length === 1 ? list[0] : null);

  if (!integ) {
    try {
      await admin.from("integration_webhook_events").insert({
        organization_id: org,
        source: "evolution",
        event_type: event || "unidentified",
        payload,
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json({ ok: true, note: "no matching integration" });
  }
  org = integ.organization_id;

  // Auth suave: se a URL trouxer ?secret, valida contra a integração/env.
  if (secret) {
    const expected = integ.credentials?.webhook_secret || process.env.WEBHOOK_SECRET;
    if (expected && secret !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 403 });
    }
  }

  // Log cru SEMPRE (pra validar o envelope real da Evolution)
  try {
    await admin.from("integration_webhook_events").insert({
      organization_id: org,
      source: "evolution",
      event_type: event || "unknown",
      payload,
    });
  } catch {
    /* ignore */
  }

  // Só mensagens novas recebidas (não enviadas por nós, não grupos)
  if (event && !event.includes("messages.upsert")) {
    return NextResponse.json({ ok: true, note: "event ignored" });
  }
  const isFromMe = Boolean(key?.fromMe ?? false);
  const remoteJid = String(key?.remoteJid ?? "");
  if (remoteJid.endsWith("@g.us")) {
    return NextResponse.json({ ok: true, note: "group ignored" });
  }
  const number = onlyDigits(remoteJid.split("@")[0] ?? "");

  // Texto: Evolution manda conversation | extendedTextMessage.text
  const msg = (data?.message ?? {}) as Record<string, unknown>;
  const ext = (msg?.extendedTextMessage ?? {}) as Record<string, unknown>;
  const text = String(msg?.conversation ?? ext?.text ?? "").trim();

  if (!isFromMe && text && number) {
    try {
      // Casa o telefone COM e SEM o DDI 55 (contatos salvos sem o país).
      const variants = new Set<string>([number]);
      if (number.length >= 12 && number.startsWith("55")) variants.add(number.slice(2));
      else if (number.length === 10 || number.length === 11) variants.add(`55${number}`);
      const phoneOr = [...variants]
        .flatMap((n) => [`phone.eq.${n}`, `whatsapp.eq.${n}`])
        .join(",");
      let { data: contact } = await admin
        .from("contacts")
        .select("id")
        .eq("organization_id", org)
        .or(phoneOr)
        .limit(1)
        .maybeSingle();
      if (!contact) {
        const name = String(data?.pushName ?? number);
        const { data: nc } = await admin
          .from("contacts")
          .insert({ organization_id: org, full_name: name, phone: number, whatsapp: number })
          .select("id")
          .single();
        contact = nc;
      }
      const cid = (contact as { id: string } | null)?.id;
      if (cid) {
        let { data: convo } = await admin
          .from("conversations")
          .select("id, unread_count")
          .eq("organization_id", org)
          .eq("contact_id", cid)
          .eq("channel", "whatsapp")
          .eq("is_open", true)
          .order("last_message_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!convo) {
          const { data: nconvo } = await admin
            .from("conversations")
            .insert({ organization_id: org, channel: "whatsapp", contact_id: cid, unread_count: 1, is_open: true })
            .select("id, unread_count")
            .single();
          convo = nconvo;
        } else {
          await admin
            .from("conversations")
            .update({
              last_message_at: new Date().toISOString(),
              unread_count: ((convo as { unread_count: number }).unread_count ?? 0) + 1,
            })
            .eq("id", (convo as { id: string }).id);
        }
        const convoId = (convo as { id: string } | null)?.id;
        if (convoId) {
          await admin.from("messages").insert({
            organization_id: org,
            conversation_id: convoId,
            channel: "whatsapp",
            direction: "inbound",
            status: "delivered",
            from_address: number,
            body_text: text,
            contact_id: cid,
            provider: "evolution",
            provider_message_id: String(key?.id ?? ""),
            metadata: payload,
          });
        }

        // ── SDR: lead em cadência RESPONDEU → para o follow-up na hora ───
        let justReplied = false;
        try {
          const { data: activeEnr } = await admin
            .from("sequence_enrollments")
            .select("id")
            .eq("organization_id", org)
            .eq("contact_id", cid)
            .eq("status", "active")
            .limit(1);
          if (activeEnr && activeEnr.length > 0) {
            justReplied = true;
            await admin
              .from("sequence_enrollments")
              .update({ status: "replied", finished_at: new Date().toISOString() })
              .eq("organization_id", org)
              .eq("contact_id", cid)
              .eq("status", "active");
            await recordOutcome(admin, { orgId: org, stage: "reply", channel: "whatsapp" });
          }
        } catch (e) {
          console.error("[webhook/evolution] sdr replied", e);
        }

        // ── AGENTE SDR CONVERSACIONAL — responde pelo MESMO canal (evolution)
        try {
          await runSdrConversation({
            admin,
            orgId: org,
            contactId: cid,
            phone: number,
            inboundText: text,
            inboundMessageId: String(key?.id ?? "") || undefined,
            conversationId: convoId ?? null,
            provider: "evolution",
            justReplied,
          });
        } catch (e) {
          console.error("[webhook/evolution] sdr conversation", e);
        }
      }
    } catch (e) {
      console.error("[webhook/evolution] persist", e);
    }
  }

  return NextResponse.json({ ok: true });
}
