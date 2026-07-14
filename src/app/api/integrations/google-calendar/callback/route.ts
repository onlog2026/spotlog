import { type NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { callbackUrl, exchangeCode } from "@/lib/integrations/google-calendar";

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
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const back = (s: string) =>
    NextResponse.redirect(new URL(`/app/admin/integracoes?gcal=${s}`, req.url));

  if (url.searchParams.get("error")) return back("denied");
  if (!code || !state) return back("error");

  const [orgId, sig] = state.split(".");
  if (!orgId || sig !== sign(orgId) || orgId !== ctx.org.id) return back("bad_state");

  const tokens = await exchangeCode(code, callbackUrl(req.url));
  if (!tokens?.refresh_token) return back("no_refresh");

  const admin = createAdminClient();
  const { error } = await admin.from("integrations").upsert(
    {
      organization_id: orgId,
      provider: "google_calendar",
      credentials: { refresh_token: tokens.refresh_token, calendar_id: "primary" },
      settings: {},
      display_name: "Google Calendar",
      is_active: true,
      created_by: ctx.user.id,
    },
    { onConflict: "organization_id,provider" },
  );
  if (error) {
    console.error("[gcal] upsert", error);
    return back("save_error");
  }
  return back("connected");
}
