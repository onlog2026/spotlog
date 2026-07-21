import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { tickTimeWaits } from "@/lib/fluxos/engine";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Worker do Robô — retoma execuções de fluxo pausadas por TEMPO (delays)
 * cujo `wait_until` já passou. Espelha `/api/cadence/tick`.
 *
 * Obs.: as respostas inbound do robô são SÍNCRONAS (via webhook), então não
 * dependem deste cron. Ele só existe pros blocos de "esperar X horas" do
 * roadmap — hoje roda como no-op até esses blocos existirem.
 */
function isAuthorized(req: NextRequest): boolean {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && req.headers.get("authorization") === `Bearer ${cronSecret}`)
    return true;
  const webhook = process.env.WEBHOOK_SECRET;
  if (webhook && req.headers.get("x-internal") === webhook) return true;
  // NÃO confiar em user-agent — qualquer curl finge ser "vercel-cron". Com
  // CRON_SECRET configurado, a Vercel manda o Bearer automaticamente (checado
  // acima); essa linha era um bypass total do segredo.
  return !cronSecret && !webhook;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const processed = await tickTimeWaits(createAdminClient());
  return NextResponse.json({ ok: true, processed });
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req))
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  const processed = await tickTimeWaits(createAdminClient());
  return NextResponse.json({ ok: true, processed });
}
