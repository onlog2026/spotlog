import { NextResponse } from "next/server";
import { after } from "next/server";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendSms } from "@/lib/integrations/clients/twilio";

export const dynamic = "force-dynamic";

/**
 * Dispara campanha SMS de verdade via Twilio (cliente já existia em
 * lib/integrations/clients/twilio.ts, só nunca tinha sido chamado daqui —
 * a campanha ficava travada em "enviando" pra sempre). Zenvia continua
 * sem adapter — falha explicitamente se for o provedor conectado.
 */
export async function POST(req: Request) {
  let ctx;
  try {
    ctx = await requireSession();
  } catch {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  let body: { campaign_id?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  if (!body.campaign_id)
    return NextResponse.json({ error: "campaign_id obrigatório" }, { status: 400 });

  const supabase = createAdminClient();
  const { data: campaign, error: cErr } = await supabase
    .from("sms_campaigns")
    .select("id, segment_id, organization_id, message")
    .eq("id", body.campaign_id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (cErr || !campaign)
    return NextResponse.json({ error: "Campanha não encontrada" }, { status: 404 });

  // Resolve destinatários
  let recipients: Array<{ id: string; phone: string | null }> = [];
  if (campaign.segment_id) {
    // @ts-expect-error rpc
    const { data } = await supabase.rpc("mkt_compute_segment", {
      p_segment_id: campaign.segment_id,
      p_org: ctx.org.id,
    });
    const ids = ((data?.sample ?? []) as Array<{ id: string }>).map((s) => s.id);
    if (ids.length) {
      const { data: leads } = await supabase
        .from("leads")
        .select("id, phone, whatsapp")
        .in("id", ids);
      recipients = (leads ?? []).map((l) => ({
        id: l.id,
        phone: l.phone ?? l.whatsapp ?? null,
      }));
    }
  } else {
    const { data: leads } = await supabase
      .from("leads")
      .select("id, phone, whatsapp")
      .eq("organization_id", ctx.org.id)
      .limit(50);
    recipients = (leads ?? []).map((l) => ({
      id: l.id,
      phone: l.phone ?? l.whatsapp ?? null,
    }));
  }

  const valid = recipients.filter((r) => r.phone);
  // Verifica provedor SMS conectado
  const { data: integ } = await supabase
    .from("integrations")
    .select("id, provider, status, credentials")
    .eq("organization_id", ctx.org.id)
    .in("provider", ["twilio", "zenvia", "sms"])
    .eq("status", "active")
    .maybeSingle();

  if (!integ) {
    await supabase
      .from("sms_campaigns")
      .update({ status: "falhou", total_count: valid.length })
      .eq("id", campaign.id);
    return NextResponse.json(
      {
        error: "Nenhum provedor SMS conectado. Conecte Twilio ou Zenvia em /app/admin/integracoes",
        total_recipients: valid.length,
      },
      { status: 400 },
    );
  }

  if (integ.provider !== "twilio") {
    await supabase
      .from("sms_campaigns")
      .update({ status: "falhou", total_count: valid.length })
      .eq("id", campaign.id);
    return NextResponse.json(
      { error: `Provedor "${integ.provider}" ainda não tem envio real implementado (só Twilio).` },
      { status: 400 },
    );
  }

  const cred = (integ.credentials ?? {}) as { account_sid?: string; auth_token?: string; from?: string };
  if (!cred.account_sid || !cred.auth_token || !cred.from) {
    await supabase
      .from("sms_campaigns")
      .update({ status: "falhou", total_count: valid.length })
      .eq("id", campaign.id);
    return NextResponse.json(
      { error: "Credenciais Twilio incompletas em /app/admin/integracoes." },
      { status: 400 },
    );
  }

  await supabase
    .from("sms_campaigns")
    .update({ status: "enviando", total_count: valid.length })
    .eq("id", campaign.id);

  // Envio real roda em background (after) -- um loop de N chamadas HTTP pro
  // Twilio não cabe no tempo de resposta da rota.
  after(async () => {
    const admin = createAdminClient();
    let sentCount = 0;
    let failedCount = 0;
    for (const r of valid) {
      const result = await sendSms(
        cred.account_sid!,
        cred.auth_token!,
        cred.from!,
        r.phone!,
        campaign.message,
      );
      await admin.from("sms_logs").insert({
        campaign_id: campaign.id,
        phone: r.phone,
        status: result.ok ? "sent" : "failed",
        error: result.ok ? null : result.error ?? null,
      });
      if (result.ok) sentCount++;
      else failedCount++;
    }
    await admin
      .from("sms_campaigns")
      .update({
        status: failedCount > 0 && sentCount === 0 ? "falhou" : "enviada",
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaign.id);
  });

  return NextResponse.json({
    ok: true,
    total_recipients: valid.length,
    provider: integ.provider,
    note: "Campanha em fila — envio real via Twilio rodando em background.",
  });
}
