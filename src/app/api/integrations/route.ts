import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { invalidateIntegrationCache, type IntegrationProvider } from "@/lib/integrations";

const upsertSchema = z.object({
  provider: z.string(),
  credentials: z.record(z.string()),
  display_name: z.string().optional(),
  settings: z.record(z.any()).optional(),
});

const patchSchema = z.object({
  provider: z.string(),
  is_active: z.boolean(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireRole(["owner", "admin"]);
  const body = upsertSchema.parse(await req.json());
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("integrations")
    .upsert(
      {
        organization_id: ctx.org.id,
        provider: body.provider,
        credentials: body.credentials,
        settings: body.settings ?? {},
        display_name: body.display_name ?? body.provider,
        is_active: true,
        created_by: ctx.user.id,
      },
      { onConflict: "organization_id,provider" },
    );

  if (error) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  invalidateIntegrationCache(ctx.org.id, body.provider as IntegrationProvider);
  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const ctx = await requireRole(["owner", "admin"]);
  const body = patchSchema.parse(await req.json());
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("integrations")
    .update({ is_active: body.is_active })
    .eq("organization_id", ctx.org.id)
    .eq("provider", body.provider);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  invalidateIntegrationCache(ctx.org.id, body.provider as IntegrationProvider);
  return NextResponse.json({ ok: true });
}
