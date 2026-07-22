import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { guardV1, v1Json, v1Error, parseListParams, v1Options } from "../_lib";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  job_title: z.string().optional(),
  company_id: z.string().uuid().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export async function GET(req: NextRequest) {
  const guard = await guardV1(req, "contacts:read");
  if ("error" in guard) return guard.error;
  const { limit, offset, url } = parseListParams(req);
  const search = url.searchParams.get("search");
  const admin = createAdminClient();
  let q = admin
    .from("contacts")
    .select("id, full_name, email, phone, job_title, company_id, city, state, created_at", { count: "exact" })
    .eq("organization_id", guard.ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (search) q = q.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  const { data, count, error } = await q;
  if (error) return v1Error(error.message, 500);
  return v1Json({ data: data ?? [], count: count ?? 0, limit, offset });
}

export async function POST(req: NextRequest) {
  const guard = await guardV1(req, "contacts:write");
  if ("error" in guard) return guard.error;
  const body = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) return v1Error("Dados inválidos.", 400);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("contacts")
    .insert({ organization_id: guard.ctx.orgId, source: "api", ...parsed.data })
    .select("id, created_at")
    .single();
  if (error) return v1Error(error.message, 500);
  return v1Json({ data }, { status: 201 });
}

export { v1Options as OPTIONS };
