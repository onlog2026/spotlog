import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/lib/auth";
import { buildAuthUrl, callbackUrl, googleConfigured } from "@/lib/integrations/google-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sign(v: string): string {
  return crypto
    .createHmac("sha256", process.env.WEBHOOK_SECRET ?? "spotlog")
    .update(v)
    .digest("hex")
    .slice(0, 32);
}

export async function GET(req: NextRequest) {
  const ctx = await requireRole(["owner", "admin"]);
  const back = (s: string) =>
    NextResponse.redirect(new URL(`/app/admin/integracoes?gcal=${s}`, req.url));

  if (!googleConfigured()) return back("missing_config");

  const orgId = ctx.org.id;
  const state = `${orgId}.${sign(orgId)}`;
  const url = buildAuthUrl(state, callbackUrl(req.url));
  if (!url) return back("missing_config");
  return NextResponse.redirect(url);
}
