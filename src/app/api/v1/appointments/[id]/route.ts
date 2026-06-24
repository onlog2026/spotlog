import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "@/lib/integrations/dispatcher";
import { guardV1, v1Json, v1Error, v1Options } from "../../_lib";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  title: z.string().optional(),
  scheduled_at: z.string().optional(),
  duration_minutes: z.number().int().optional(),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).optional(),
  meeting_url: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments").select("*").eq("id", id)
    .eq("organization_id", guard.ctx.orgId).maybeSingle();
  if (error) return v1Error(error.message, 500);
  if (!data) return v1Error("Agendamento não encontrado.", 404);
  return v1Json({ data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return v1Error("Dados inválidos.", 400);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("appointments").update(parsed.data).eq("id", id)
    .eq("organization_id", guard.ctx.orgId).select("*").maybeSingle();
  if (error) return v1Error(error.message, 500);
  if (!data) return v1Error("Agendamento não encontrado.", 404);
  if (parsed.data.status === "confirmed") {
    dispatchEvent(guard.ctx.orgId, "appointment.confirmed", data as Record<string, unknown>);
  }
  return v1Json({ data });
}

export { v1Options as OPTIONS };
