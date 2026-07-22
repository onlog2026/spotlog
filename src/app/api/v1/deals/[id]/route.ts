import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "@/lib/integrations/dispatcher";
import { guardV1, v1Json, v1Error, v1Options } from "../../_lib";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().optional(),
  amount: z.number().optional(),
  status: z.enum(["open", "won", "lost"]).optional(),
  stage_id: z.string().uuid().optional(),
  lost_reason: z.string().optional(),
  probability: z.number().int().optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardV1(req, "deals:read");
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals").select("*").eq("id", id)
    .eq("organization_id", guard.ctx.orgId).maybeSingle();
  if (error) return v1Error(error.message, 500);
  if (!data) return v1Error("Negócio não encontrado.", 404);
  return v1Json({ data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardV1(req, "deals:write");
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return v1Error("Dados inválidos.", 400);
  const admin = createAdminClient();
  const patch: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.status === "won" || parsed.data.status === "lost") {
    patch.closed_at = new Date().toISOString();
  }
  const { data, error } = await admin
    .from("deals").update(patch).eq("id", id)
    .eq("organization_id", guard.ctx.orgId).select("*").maybeSingle();
  if (error) return v1Error(error.message, 500);
  if (!data) return v1Error("Negócio não encontrado.", 404);

  if (parsed.data.status === "won") {
    dispatchEvent(guard.ctx.orgId, "deal.won", data as Record<string, unknown>);
  } else if (parsed.data.status === "lost") {
    dispatchEvent(guard.ctx.orgId, "deal.lost", data as Record<string, unknown>);
  }
  return v1Json({ data });
}

export { v1Options as OPTIONS };
