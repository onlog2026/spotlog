import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Histórico LIVE de uma conversa (GET /messages?contactId) da Digisac. */
export async function GET(req: NextRequest) {
  const ctx = await requireSession();
  const cid = new URL(req.url).searchParams.get("c");
  if (!cid) return NextResponse.json({ messages: [] });
  const dg = await getIntegration(ctx.org.id, "digisac");
  if (!dg?.credentials?.token) return NextResponse.json({ messages: [] });
  const base = String(dg.credentials.base_url || "").replace(/\/+$/, "");
  try {
    const r = await fetch(`${base}/api/v1/messages?contactId=${encodeURIComponent(cid)}&perPage=80`, {
      headers: { Authorization: `Bearer ${dg.credentials.token}` },
    });
    if (!r.ok) return NextResponse.json({ messages: [] });
    const j = await r.json();
    const arr: Array<Record<string, unknown>> = Array.isArray(j) ? j : (j.data ?? []);
    const messages = arr
      .map((m) => ({
        id: String(m.id),
        direction: m.isFromMe ? "outbound" : "inbound",
        body_text: m.text ? String(m.text) : "",
        created_at: String(m.createdAt || m.timestamp || ""),
      }))
      .filter((m) => m.body_text)
      .sort((a, b) => a.created_at.localeCompare(b.created_at));
    return NextResponse.json({ messages });
  } catch {
    return NextResponse.json({ messages: [] });
  }
}
