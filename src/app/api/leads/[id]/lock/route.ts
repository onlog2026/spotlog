import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * GET    /api/leads/:id/lock  → quem está com o lock ativo (null se ninguém)
 * POST   /api/leads/:id/lock  → refresh (renova TTL 5min p/ o user atual)
 * DELETE /api/leads/:id/lock  → libera lock do user atual
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_lead_lock", { p_lead_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const row = Array.isArray(data) ? data[0] : data;
  return NextResponse.json({ lock: row ?? null });
}

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.rpc("refresh_lead_lock", { p_lead_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  await requireSession();
  const { id } = await params;
  const supabase = await createClient();
  const { error } = await supabase.rpc("release_lead_lock", { p_lead_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
