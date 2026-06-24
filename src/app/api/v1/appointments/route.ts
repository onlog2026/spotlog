import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "@/lib/integrations/dispatcher";
import { guardV1, v1Json, v1Error, parseListParams, v1Options } from "../_lib";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  title: z.string().min(2),
  scheduled_at: z.string(),
  duration_minutes: z.number().int().default(30).optional(),
  meeting_type: z.string().optional(),
  meeting_url: z.string().optional(),
  meeting_location: z.string().optional(),
  description: z.string().optional(),
  lead_id: z.string().uuid().optional(),
  contact_id: z.string().uuid().optional(),
  company_id: z.string().uuid().optional(),
  external_name: z.string().optional(),
  external_email: z.string().email().optional(),
  external_phone: z.string().optional(),
});

export async function GET(req: NextRequest) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  const { limit, offset, url } = parseListParams(req);
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const admin = createAdminClient();
  let q = admin
    .from("appointments")
    .select("id, title, scheduled_at, duration_minutes, status, meeting_type, meeting_url, lead_id, contact_id, created_at", { count: "exact" })
    .eq("organization_id", guard.ctx.orgId)
    .order("scheduled_at", { ascending: true })
    .range(offset, offset + limit - 1);
  if (from) q = q.gte("scheduled_at", from);
  if (to) q = q.lte("scheduled_at", to);
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
    .from("appointments")
    .insert({
      organization_id: guard.ctx.orgId,
      status: "scheduled",
      source: "api",
      ...parsed.data,
    })
    .select("id, created_at")
    .single();
  if (error) return v1Error(error.message, 500);
  dispatchEvent(guard.ctx.orgId, "appointment.created", {
    id: (data as { id: string }).id,
    title: parsed.data.title,
    scheduled_at: parsed.data.scheduled_at,
  });
  return v1Json({ data }, { status: 201 });
}

export { v1Options as OPTIONS };
