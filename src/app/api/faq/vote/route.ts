import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const id = body?.id as string | undefined;
  const helpful = Boolean(body?.helpful);
  if (!id) {
    return NextResponse.json({ error: "id obrigatório" }, { status: 400 });
  }
  const supabase = await createClient();
  const { error } = await supabase.rpc("vote_faq", { p_id: id, p_helpful: helpful });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
