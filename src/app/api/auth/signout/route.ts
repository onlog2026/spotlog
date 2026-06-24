import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function doSignOut(req: NextRequest) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (e) {
    console.warn("[signout] error", e);
  }
  const url = new URL("/login?bye=1", req.url);
  const res = NextResponse.redirect(url, { status: 303 });
  // Limpa cookies do supabase manualmente como fallback
  const allCookies = req.cookies.getAll();
  for (const c of allCookies) {
    if (c.name.includes("sb-") || c.name.includes("supabase")) {
      res.cookies.set(c.name, "", { maxAge: 0, path: "/" });
    }
  }
  return res;
}

export async function POST(req: NextRequest) {
  return doSignOut(req);
}

export async function GET(req: NextRequest) {
  return doSignOut(req);
}
