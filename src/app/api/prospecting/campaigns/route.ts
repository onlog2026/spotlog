import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(2),
  icp: z.record(z.any()),
  sources: z.array(z.string()).default([]),
  daily_limit: z.number().int().min(1).max(2000).default(50),
  total_target: z.number().int().min(1).max(50000).default(500),
  sequence_id: z.string().uuid().nullable().optional(),
  auto_enroll: z.boolean().default(false),
  ai_persona: z.string().optional(),
  start: z.boolean().default(false),
});

export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  const body = schema.parse(await req.json());
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("prospecting_campaigns")
    .insert({
      organization_id: ctx.org.id,
      name: body.name,
      icp: body.icp,
      sources: body.sources,
      daily_limit: body.daily_limit,
      total_target: body.total_target,
      sequence_id: body.sequence_id,
      auto_enroll: body.auto_enroll,
      ai_persona: body.ai_persona,
      status: body.start ? "running" : "draft",
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const campaignId = (data as { id: string }).id;

  if (body.start) {
    // dispara primeiro job em background
    fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/prospecting/run`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal": process.env.WEBHOOK_SECRET ?? "",
      },
      body: JSON.stringify({ campaign_id: campaignId }),
    }).catch(() => null);
  }

  return NextResponse.json({ id: campaignId });
}
