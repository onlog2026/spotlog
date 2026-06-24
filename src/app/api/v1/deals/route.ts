import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardV1, v1Json, v1Error, parseListParams, v1Options } from "../_lib";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(2),
  pipeline_id: z.string().uuid(),
  stage_id: z.string().uuid(),
  amount: z.number().optional(),
  currency: z.string().default("BRL").optional(),
  contact_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  expected_close_date: z.string().optional(),
  source: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  const { limit, offset, url } = parseListParams(req);
  const status = url.searchParams.get("status");
  const admin = createAdminClient();
  let q = admin
    .from("deals")
    .select("id, title, amount, currency, status, stage_id, pipeline_id, contact_id, company_id, expected_close_date, created_at", { count: "exact" })
    .eq("organization_id", guard.ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq("status", status);
  const { data, count, error } = await q;
  if (error) return v1Error(error.message, 500);
  return v1Json({ data: data ?? [], count: count ?? 0, limit, offset });
}

export async function POST(req: NextRequest) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return v1Error("Dados inválidos.", 400);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("deals")
    .insert({
      organization_id: guard.ctx.orgId,
      status: "open",
      currency: parsed.data.currency ?? "BRL",
      ...parsed.data,
    })
    .select("id, created_at")
    .single();
  if (error) return v1Error(error.message, 500);
  return v1Json({ data }, { status: 201 });
}

export { v1Options as OPTIONS };
