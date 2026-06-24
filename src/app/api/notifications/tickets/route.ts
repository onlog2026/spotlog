import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const VALID_SCOPES = new Set([
  "tickets",
  "tickets_cliente",
  "tickets_sac",
  "tickets_comercial",
  "tickets_financeiro",
]);

export async function GET(req: NextRequest) {
  const ctx = await requireSession();
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "tickets";
  if (!VALID_SCOPES.has(scope)) {
    return NextResponse.json({ error: "invalid scope" }, { status: 400 });
  }
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("tk_unread_count", {
      p_org: ctx.org.id,
      p_user: ctx.user.id,
      p_scope: scope,
    });
    if (error) {
      return NextResponse.json({ count: 0 });
    }
    return NextResponse.json({ count: Number(data ?? 0) });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  const url = new URL(req.url);
  const scope = url.searchParams.get("scope") ?? "tickets";
  if (!VALID_SCOPES.has(scope)) {
    return NextResponse.json({ error: "invalid scope" }, { status: 400 });
  }
  try {
    const supabase = await createClient();
    await supabase.rpc("tk_mark_seen", {
      p_user: ctx.user.id,
      p_scope: scope,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
