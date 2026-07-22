import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClientSession } from "@/lib/auth-client";

function genCode() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `P${y}${m}-${rnd}`;
}

export async function POST(req: Request) {
  const ctx = await requireClientSession();
  const body = (await req.json().catch(() => ({}))) as {
    address?: string;
    window_start?: string;
    window_end?: string | null;
    volumes?: number;
    weight_kg?: number | null;
    notes?: string;
  };
  if (!body.address?.trim() || !body.window_start) {
    return NextResponse.json(
      { error: "address e window_start obrigatórios" },
      { status: 400 },
    );
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pickups")
    .insert({
      organization_id: ctx.organization.id,
      company_id: ctx.company.id,
      code: genCode(),
      address_json: { raw: body.address.trim() },
      scheduled_window_start: new Date(body.window_start).toISOString(),
      scheduled_window_end: body.window_end
        ? new Date(body.window_end).toISOString()
        : null,
      status: "solicitada", // CHECK CONSTRAINT só aceita português — "requested" quebrava todo insert
      volumes: body.volumes ?? 1,
      weight_kg: body.weight_kg ?? null,
      notes: body.notes ?? null,
      created_by: ctx.user.id,
    })
    .select("id, code")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, code: data.code });
}
