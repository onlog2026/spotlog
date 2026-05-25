import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  steps: z.array(
    z.object({
      id: z.string().uuid().optional(),
      position: z.number().int(),
      kind: z.enum(["email", "whatsapp", "wait", "manual_task", "linkedin"]),
      wait_days: z.number().int().default(0),
      wait_hours: z.number().int().default(0),
      subject: z.string().nullable().optional(),
      body: z.string().nullable().optional(),
    }),
  ),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireSession();
  const { id } = await params;
  const { steps } = schema.parse(await req.json());
  const admin = createAdminClient();

  // Verifica posse
  const { data: seq } = await admin
    .from("sequences")
    .select("id")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .single();
  if (!seq) return NextResponse.json({ error: "not found" }, { status: 404 });

  await admin.from("sequence_steps").delete().eq("sequence_id", id);
  if (steps.length) {
    const { error } = await admin.from("sequence_steps").insert(
      steps.map((s) => ({
        sequence_id: id,
        organization_id: ctx.org.id,
        position: s.position,
        kind: s.kind,
        wait_days: s.wait_days,
        wait_hours: s.wait_hours,
        subject: s.subject,
        body: s.body,
      })),
    );
    if (error)
      return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
