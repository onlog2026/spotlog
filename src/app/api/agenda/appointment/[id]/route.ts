import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireSession } from "@/lib/auth";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireSession();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const allowed: Record<string, unknown> = {};
  for (const k of ["status", "title", "description", "scheduled_at", "duration_minutes", "meeting_url", "meeting_location", "notes"]) {
    if (k in body) allowed[k] = body[k];
  }
  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "no_fields" }, { status: 400 });
  }
  allowed.updated_at = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .update(allowed)
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireSession();
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase
    .from("appointments")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
