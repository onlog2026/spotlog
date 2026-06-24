import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { markSeen, type NotificationModule } from "@/lib/notifications";

const VALID: NotificationModule[] = [
  "leads",
  "deals",
  "tickets_sac",
  "tickets_comercial",
  "tickets_financeiro",
  "chatbot_unanswered",
];

export async function POST(req: NextRequest) {
  await requireSession();
  const body = (await req.json().catch(() => ({}))) as { module?: string };
  const mod = body.module;
  if (!mod || !VALID.includes(mod as NotificationModule)) {
    return NextResponse.json({ error: "invalid module" }, { status: 400 });
  }
  await markSeen(mod);
  return NextResponse.json({ ok: true });
}
