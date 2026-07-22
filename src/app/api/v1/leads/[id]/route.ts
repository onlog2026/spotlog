import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardV1, v1Json, v1Error, v1Options } from "../../_lib";

export const dynamic = "force-dynamic";

const updateSchema = z.object({
  full_name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  status: z.string().optional(),
  score: z.number().int().optional(),
  message: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardV1(req, "leads:read");
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .select("*")
    .eq("id", id)
    .eq("organization_id", guard.ctx.orgId)
    .maybeSingle();
  if (error) return v1Error(error.message, 500);
  if (!data) return v1Error("Lead não encontrado.", 404, "not_found");
  return v1Json({ data });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardV1(req, "leads:write");
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  let body: unknown;
  try { body = await req.json(); } catch { return v1Error("Body inválido.", 400); }
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) return v1Error("Dados inválidos.", 400);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("leads")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", guard.ctx.orgId)
    .select("*")
    .maybeSingle();
  if (error) return v1Error(error.message, 500);
  if (!data) return v1Error("Lead não encontrado.", 404, "not_found");
  return v1Json({ data });
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardV1(req, "leads:write");
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { error } = await admin
    .from("leads")
    .delete()
    .eq("id", id)
    .eq("organization_id", guard.ctx.orgId);
  if (error) return v1Error(error.message, 500);
  return v1Json({ ok: true });
}

export { v1Options as OPTIONS };
