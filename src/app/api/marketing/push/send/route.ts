import { NextResponse } from "next/server";

/**
 * Stub de envio Web Push. VAPID/web-push não está configurado.
 * Quando VAPID_PUBLIC + VAPID_PRIVATE estiverem disponíveis,
 * implementar envio real iterando em web_push_subs por organização.
 */
export async function POST() {
  const hasKeys = Boolean(process.env.VAPID_PUBLIC && process.env.VAPID_PRIVATE);
  if (!hasKeys) {
    return NextResponse.json(
      {
        ok: false,
        message:
          "VAPID keys ausentes — Web Push em modo stub. Configure VAPID_PUBLIC e VAPID_PRIVATE em /app/admin/integracoes.",
      },
      { status: 503 },
    );
  }
  return NextResponse.json({ ok: true, message: "Envio enfileirado (stub)." });
}
