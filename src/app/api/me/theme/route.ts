import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSpotlogTheme } from "@/lib/theme-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  let body: { theme?: unknown } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  if (!isSpotlogTheme(body.theme)) {
    return NextResponse.json({ ok: false, error: "bad_theme" }, { status: 400 });
  }

  // Best-effort: pode não existir a coluna. Não derruba o request.
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ theme_preference: body.theme })
      .eq("id", user.id);
    if (error) {
      return NextResponse.json(
        { ok: true, persisted: false, reason: error.message },
        { status: 200 },
      );
    }
  } catch (e) {
    return NextResponse.json(
      { ok: true, persisted: false, reason: (e as Error).message },
      { status: 200 },
    );
  }

  return NextResponse.json({ ok: true, persisted: true });
}
