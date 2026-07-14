import { type NextRequest, NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { getIntegration } from "@/lib/integrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Tab = "chats" | "fila" | "contatos";
const LIMIT = 40;

type DContact = {
  id: string | number;
  name?: string;
  internalName?: string;
  unread?: number;
  isGroup?: boolean;
  lastMessageAt?: string;
  serviceId?: string;
  idFromService?: string;
  number?: string;
  data?: { number?: string };
  lastMessage?: { text?: string; type?: string; createdAt?: string };
  currentTicket?: { userId?: string | null } | null;
};

function preview(lm?: { text?: string; type?: string }): string {
  if (!lm) return "";
  if (lm.text) return lm.text;
  switch (lm.type) {
    case "image":
      return "📷 Imagem";
    case "ptt":
    case "audio":
      return "🎤 Áudio";
    case "video":
      return "🎥 Vídeo";
    case "document":
      return "📄 Documento";
    case "location":
      return "📍 Localização";
    case "contact":
    case "vcard":
      return "👤 Contato";
    default:
      return lm.type ? "[mensagem]" : "";
  }
}

/** Monta o include do currentTicket conforme a aba (igual à própria Digisac). */
function ticketInclude(tab: Tab): Record<string, unknown> {
  if (tab === "chats")
    return { model: "currentTicket", where: { userId: { $ne: null } }, include: ["user"] };
  if (tab === "fila") return { model: "currentTicket", where: { userId: null } };
  return { model: "currentTicket", required: false };
}

/**
 * Lista LIVE de conversas da Digisac, por aba:
 *  - chats    = ticket em atendimento (com operador)
 *  - fila     = ticket aguardando (sem operador)
 *  - contatos = todos os contatos
 * Usa o mesmo endpoint interno da Digisac (POST /contacts/list) com nosso token.
 */
export async function GET(req: NextRequest) {
  const ctx = await requireSession();
  const sp = new URL(req.url).searchParams;
  const tab = (["chats", "fila", "contatos"].includes(sp.get("tab") || "")
    ? sp.get("tab")
    : "fila") as Tab;
  const offset = Math.max(0, Number.parseInt(sp.get("offset") || "0", 10) || 0);
  const q = (sp.get("q") || "").trim();

  const dg = await getIntegration(ctx.org.id, "digisac");
  if (!dg?.credentials?.token)
    return NextResponse.json({ conversations: [], total: 0, error: "Digisac não conectada." });
  const base = String(dg.credentials.base_url || "").replace(/\/+$/, "");

  const where: Record<string, unknown> = { visible: true };
  if (q)
    where.$or = {
      name: { $iLike: `%${q}%` },
      internalName: { $iLike: `%${q}%` },
      alternativeName: { $iLike: `%${q}%` },
    };

  const body = {
    where,
    include: [{ model: "lastMessage" }, ticketInclude(tab)],
    orderByLastMessage: true,
    offset,
    limit: LIMIT,
  };

  try {
    const r = await fetch(`${base}/api/v1/contacts/list`, {
      method: "POST",
      headers: { Authorization: `Bearer ${dg.credentials.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!r.ok) return NextResponse.json({ conversations: [], total: 0, error: `Erro ${r.status}` });
    const j = (await r.json()) as { data?: DContact[]; total?: number } | DContact[];
    const arr: DContact[] = Array.isArray(j) ? j : (j.data ?? []);
    const total: number = !Array.isArray(j) && typeof j.total === "number" ? j.total : arr.length;

    const conversations = arr.map((c) => {
      const num =
        c.data?.number || String(c.idFromService || "").replace(/@.*/, "") || c.number || "";
      return {
        id: String(c.id),
        name: c.name || c.internalName || num || "Sem nome",
        number: num,
        unread: Number(c.unread || 0),
        lastText: preview(c.lastMessage),
        lastAt: String(c.lastMessageAt || c.lastMessage?.createdAt || ""),
        serviceId: c.serviceId || dg.credentials.service_id,
        assigned: !!(c.currentTicket && c.currentTicket.userId),
        isGroup: !!c.isGroup,
      };
    });

    return NextResponse.json({
      conversations,
      total,
      offset,
      hasMore: offset + arr.length < total,
    });
  } catch {
    return NextResponse.json({ conversations: [], total: 0, error: "Erro ao carregar conversas." });
  }
}
