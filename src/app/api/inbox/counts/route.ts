import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Tab = "chats" | "fila" | "contatos";

function ticketInclude(tab: Tab): Record<string, unknown> {
  if (tab === "chats") return { model: "currentTicket", where: { userId: { $ne: null } } };
  if (tab === "fila") return { model: "currentTicket", where: { userId: null } };
  return { model: "currentTicket", required: false };
}

type CountsCacheEntry = {
  at: number;
  counts: { chats: number; fila: number; contatos: number };
};
const countsCache = new Map<string, CountsCacheEntry>();
const COUNTS_TTL_MS = 10_000;

/** Totais por aba (badges), via o mesmo /contacts/list (limit 1, lê o total). */
export async function GET() {
  const ctx = await requireSession();

  const cached = countsCache.get(ctx.org.id);
  if (cached && Date.now() - cached.at < COUNTS_TTL_MS) {
    return NextResponse.json({ counts: cached.counts });
  }

  const dg = await getIntegration(ctx.org.id, "digisac");
  if (!dg?.credentials?.token)
    return NextResponse.json({ counts: { chats: 0, fila: 0, contatos: 0 } });
  const base = String(dg.credentials.base_url || "").replace(/\/+$/, "");
  const headers = {
    Authorization: `Bearer ${dg.credentials.token}`,
    "Content-Type": "application/json",
  };

  async function countOf(tab: Tab): Promise<number> {
    try {
      const r = await fetch(`${base}/api/v1/contacts/list`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          where: { visible: true },
          include: [ticketInclude(tab)],
          orderByLastMessage: true,
          offset: 0,
          limit: 1,
        }),
      });
      if (!r.ok) return 0;
      const j = (await r.json()) as { total?: number; data?: unknown[] } | unknown[];
      if (!Array.isArray(j) && typeof j.total === "number") return j.total;
      return 0;
    } catch {
      return 0;
    }
  }

  const [chats, fila, contatos] = await Promise.all([
    countOf("chats"),
    countOf("fila"),
    countOf("contatos"),
  ]);

  const counts = { chats, fila, contatos };
  countsCache.set(ctx.org.id, { at: Date.now(), counts });
  return NextResponse.json({ counts });
}
