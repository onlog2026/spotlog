import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  stage_id: z.string().uuid(),
  position: z.number().int().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireSession();
  const { id } = await params;
  const { stage_id, position } = schema.parse(await req.json());
  const admin = createAdminClient();

  // Verifica que o stage pertence à org
  const { data: stage } = await admin
    .from("pipeline_stages")
    .select("id, organization_id, is_won, is_lost")
    .eq("id", stage_id)
    .single();
  if (!stage || (stage as { organization_id: string }).organization_id !== ctx.org.id) {
    return NextResponse.json({ error: "stage inválido" }, { status: 400 });
  }

  const update: Record<string, unknown> = { stage_id };
  if (typeof position === "number") update.position = position;
  if ((stage as { is_won: boolean }).is_won) {
    update.status = "won";
    update.closed_at = new Date().toISOString();
  } else if ((stage as { is_lost: boolean }).is_lost) {
    update.status = "lost";
    update.closed_at = new Date().toISOString();
  } else {
    update.status = "open";
    update.closed_at = null;
  }

  const { error } = await admin
    .from("deals")
    .update(update)
    .eq("id", id)
    .eq("organization_id", ctx.org.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
