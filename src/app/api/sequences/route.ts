import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  default_channel: z.enum(["email", "whatsapp", "sms", "linkedin"]).default("email"),
  ai_prompt: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  const body = schema.parse(await req.json());
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("sequences")
    .insert({
      organization_id: ctx.org.id,
      name: body.name,
      description: body.description,
      default_channel: body.default_channel,
      ai_prompt: body.ai_prompt,
      is_active: true,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: (data as { id: string }).id });
}
