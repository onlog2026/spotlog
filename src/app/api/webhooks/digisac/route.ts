import { type NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { onlyDigits } from "@/lib/utils";
import { handleInboundMessage } from "@/lib/fluxos/engine";
import { runSdrConversation } from "@/lib/sdr/conversation";
import { recordOutcome } from "@/lib/sdr/brain";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// O agente SDR conversa dentro do request (IA + delay humanizado) — precisa de folga.
export const maxDuration = 60;

/**
 * Webhook inbound da DIGISAC. A Digisac chama:
 *   POST /api/webhooks/digisac?org=<orgId>&secret=<segredo>
 * Valida o segredo contra a integração da org, loga o payload cru e tenta
 * gravar a mensagem recebida em conversations/messages (best-effort, sempre 200).
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  let org = url.searchParams.get("org");
  const secret = url.searchParams.get("secret");

  const admin = createAdminClient();
  const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const get = (o: unknown, k: string): unknown =>
    o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined;

  // Mensagem (envelope não 100% confirmado — tenta data/message/raiz)
  const m = (payload?.data ?? payload?.message ?? payload) as Record<string, unknown>;
  const serviceId = String(
    m?.serviceId ?? m?.service_id ?? payload?.serviceId ?? get(get(m, "service"), "id") ?? "",
  );

  // Identifica a integração por ?org OU pela conexão (serviceId) do payload —
  // assim o webhook já existente na Digisac (sem parâmetros) funciona sem alterar nada lá.
  const { data: integs } = await admin
    .from("integrations")
    .select("organization_id, credentials")
    .eq("provider", "digisac");
  const list = (integs ?? []) as Array<{
    organization_id: string;
    credentials: Record<string, string>;
  }>;
  const integ =
    (org ? list.find((i) => i.organization_id === org) : undefined) ||
    (serviceId ? list.find((i) => i.credentials?.service_id === serviceId) : undefined) ||
    null;

  if (!integ) {
    try {
      await admin.from("integration_webhook_events").insert({
        organization_id: org,
        source: "digisac",
        event_type: String(payload?.event ?? payload?.type ?? "unidentified"),
        payload,
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json({ ok: true, note: "no matching integration" });
  }
  org = integ.organization_id;

  // Auth suave: se a URL trouxer ?secret, valida; senão confia na conexão (serviceId).
  if (secret) {
    const expected = integ.credentials?.webhook_secret || process.env.WEBHOOK_SECRET;
    if (expected && secret !== expected) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 403 });
    }
  }

  // Log cru SEMPRE (pra validar o envelope real da Digisac)
  try {
    await admin.from("integration_webhook_events").insert({
      organization_id: org,
      source: "digisac",
      event_type: String(payload?.event ?? payload?.type ?? "unknown"),
      payload,
    });
  } catch {
    /* ignore */
  }
  const isFromMe = Boolean(m?.isFromMe ?? m?.fromMe ?? false);
  const text = String(m?.text ?? m?.body ?? get(get(m, "message"), "text") ?? "");
  const numberRaw = String(
    get(get(m, "contact"), "number") ?? m?.number ?? m?.from ?? m?.fromId ?? "",
  );
  const number = onlyDigits(numberRaw);

  if (!isFromMe && text && number) {
    try {
      // Casa o telefone COM e SEM o DDI 55 — a Digisac manda "5511..." e os
      // contatos do SDR são salvos normalizados sem o país ("11..."). Sem isso
      // a resposta criaria contato duplicado e a cadência não pararia.
      const variants = new Set<string>([number]);
      if (number.length >= 12 && number.startsWith("55"))
        variants.add(number.slice(2));
      else if (number.length === 10 || number.length === 11)
        variants.add(`55${number}`);
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
        const name = String(get(get(m, "contact"), "name") ?? m?.name ?? number);
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
            provider: "digisac",
            provider_message_id: String(m?.id ?? ""),
            metadata: payload,
          });
        }

        // ── SDR: lead em cadência RESPONDEU → para o follow-up na hora ───
        // A fila "Responderam — agendar reunião" (/app/sdr) lê esses replied.
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
            // Cérebro Comercial: registra a RESPOSTA (aprendizado por canal/hora).
            await recordOutcome(admin, { orgId: org, stage: "reply", channel: "whatsapp" });
          }
        } catch (e) {
          console.error("[webhook/digisac] sdr replied", e);
        }

        // ── ROBÔ / Flow Builder ──────────────────────────────────────────
        // Dispara/retoma o fluxo automático (best-effort, nunca quebra o 200).
        // Responde pelo MESMO serviço Digisac que recebeu (número certo).
        const contactName = String(
          get(get(m, "contact"), "name") ?? m?.name ?? number,
        );
        let flowActed = false;
        try {
          const flowRes = await handleInboundMessage({
            admin,
            organizationId: org,
            contactId: cid,
            contactRef: number,
            conversationId: convoId ?? null,
            serviceId: serviceId || undefined,
            contactName,
            text,
          });
          flowActed = flowRes.action !== "none";
        } catch (e) {
          console.error("[webhook/digisac] flow engine", e);
        }

        // ── AGENTE SDR CONVERSACIONAL (GTM autônomo) ─────────────────────
        // Só quando o Robô NÃO agiu (evita resposta dupla). A IA conduz a
        // conversa de prospecção: qualifica (BANT) e marca reunião sozinha.
        // Guard-rails dentro de runSdrConversation (opt-out, horário, cap,
        // humano assumiu). Best-effort: nunca quebra o 200.
        if (!flowActed) {
          try {
            await runSdrConversation({
              admin,
              orgId: org,
              contactId: cid,
              phone: number,
              inboundText: text,
              inboundMessageId: String(m?.id ?? "") || undefined,
              conversationId: convoId ?? null,
              serviceId: serviceId || undefined,
              justReplied,
            });
          } catch (e) {
            console.error("[webhook/digisac] sdr conversation", e);
          }
        }
      }
    } catch (e) {
      console.error("[webhook/digisac] persist", e);
    }
  }

  return NextResponse.json({ ok: true });
}
