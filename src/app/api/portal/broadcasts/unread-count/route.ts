import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ count: 0 });
  // @ts-expect-error rpc dinâmico
  const { data } = await supabase.rpc("portal_list_broadcasts", {
    p_user: user.id,
  });
  const list = (data ?? []) as Array<{ read_at: string | null }>;
  return NextResponse.json({ count: list.filter((b) => !b.read_at).length });
}
