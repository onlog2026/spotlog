import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardV1, v1Json, v1Error, v1Options } from "../../_lib";

export const dynamic = "force-dynamic";

const patchSchema = z.object({
  full_name: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  job_title: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  const { id } = await ctx.params;
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contacts")
    .select("*")
    .eq("id", id)
    .eq("organization_id", guard.ctx.orgId)
    .maybeSingle();
  if (error) return v1Error(error.message, 500);
  if (!data) return v1Error("Contato não encontrado.", 404);
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
    .from("contacts")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", guard.ctx.orgId)
    .select("*")
    .maybeSingle();
  if (error) return v1Error(error.message, 500);
  if (!data) return v1Error("Contato não encontrado.", 404);
  return v1Json({ data });
}

export { v1Options as OPTIONS };
