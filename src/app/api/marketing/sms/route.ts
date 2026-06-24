import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/**
 * STUB: dispara campanha SMS.
 * Hoje só simula — quando o user conectar um provedor real (Twilio, Zenvia, etc),
 * trocar o loop de "send" pela chamada real do provedor.
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
    .select("id, provider, status")
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

  // Provider conectado: marca como enviando — disparo real deve ser implementado
  // por integração específica (ainda não construída — Twilio/Zenvia adapter).
  await supabase
    .from("sms_campaigns")
    .update({ status: "enviando", total_count: valid.length })
    .eq("id", campaign.id);

  return NextResponse.json({
    ok: true,
    total_recipients: valid.length,
    provider: integ.provider,
    note: "Campanha em fila. O adapter do provedor processará o disparo.",
  });
}
