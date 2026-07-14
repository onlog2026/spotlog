import { type NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z
  .object({
    conversationId: z.string().min(1).optional(), // = contactId de uma conversa existente
    number: z.string().min(8).optional(), // = número p/ iniciar conversa nova
    serviceId: z.string().min(1).optional(), // conexão da conversa (senão usa a padrão)
    text: z.string().min(1).max(4000),
  })
  .refine((v) => v.conversationId || v.number, {
    message: "Informe uma conversa ou um número.",
  });

/** Formata número BR: só dígitos, garante DDI 55. */
function fmtNumber(n: string): string {
  const d = n.replace(/\D/g, "");
  if (d.startsWith("55")) return d;
  if (d.length === 10 || d.length === 11) return `55${d}`;
  return d;
}

/** Responde uma conversa OU inicia uma nova (por número) enviando via Digisac. */
export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "Dados inválidos." }, { status: 400 });
  const { conversationId, number, serviceId, text } = parsed.data;

  const dg = await getIntegration(ctx.org.id, "digisac");
  if (!dg?.credentials?.token)
    return NextResponse.json({ ok: false, error: "Digisac não conectada." }, { status: 400 });
  const base = String(dg.credentials.base_url || "").replace(/\/+$/, "");

  const body: Record<string, unknown> = {
    text,
    type: "chat",
    serviceId: serviceId || dg.credentials.service_id,
  };
  if (number) body.number = fmtNumber(number);
  else body.contactId = conversationId;

  try {
    const r = await fetch(`${base}/api/v1/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${dg.credentials.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok)
      return NextResponse.json(
        { ok: false, error: (d as { message?: string })?.message ?? `Erro ${r.status}` },
        { status: 502 },
      );
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Erro de rede ao enviar." }, { status: 502 });
  }
}
