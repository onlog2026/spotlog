import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const body = (await req.json().catch(() => ({}))) as { broadcast_id?: string };
  if (!body.broadcast_id)
    return NextResponse.json({ error: "broadcast_id required" }, { status: 400 });
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("portal_mark_broadcast_read", {
    p_broadcast: body.broadcast_id,
    p_user: user.id,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
