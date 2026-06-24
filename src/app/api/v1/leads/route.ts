import { type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "@/lib/integrations/dispatcher";
import { guardV1, v1Json, v1Error, parseListParams, v1Options } from "../_lib";

export const dynamic = "force-dynamic";

const createSchema = z.object({
  full_name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  message: z.string().optional(),
  source: z.string().default("api"),
  source_detail: z.string().optional(),
  custom_fields: z.record(z.any()).optional(),
});

export async function GET(req: NextRequest) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  const { limit, offset, url } = parseListParams(req);
  const status = url.searchParams.get("status");
  const source = url.searchParams.get("source");

  const admin = createAdminClient();
  let q = admin
    .from("leads")
    .select(
      "id, full_name, email, phone, whatsapp, company_name, job_title, status, source, score, created_at, updated_at",
      { count: "exact" },
    )
    .eq("organization_id", guard.ctx.orgId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (status) q = q.eq("status", status);
  if (source) q = q.eq("source", source);
  const { data, count, error } = await q;
  if (error) return v1Error(error.message, 500);
  return v1Json({ data: data ?? [], count: count ?? 0, limit, offset });
}

export async function POST(req: NextRequest) {
  const guard = await guardV1(req);
  if ("error" in guard) return guard.error;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return v1Error("Body inválido (JSON esperado).", 400, "invalid_body");
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return v1Error("Dados inválidos.", 400, "invalid_payload");
  }
  const d = parsed.data;
  const admin = createAdminClient();
  const { data: lead, error } = await admin
    .from("leads")
    .insert({
      organization_id: guard.ctx.orgId,
      source: d.source,
      source_detail: d.source_detail ?? "public_api_v1",
      full_name: d.full_name,
      email: d.email,
      phone: d.phone,
      whatsapp: d.whatsapp,
      company_name: d.company_name,
      job_title: d.job_title,
      message: d.message,
      custom_fields: d.custom_fields ?? {},
    })
    .select("id, created_at")
    .single();
  if (error) return v1Error(error.message, 500);

  dispatchEvent(guard.ctx.orgId, "lead.created", {
    id: (lead as { id: string }).id,
    full_name: d.full_name,
    email: d.email,
    source: d.source,
  });

  return v1Json({ data: lead }, { status: 201 });
}

export { v1Options as OPTIONS };
