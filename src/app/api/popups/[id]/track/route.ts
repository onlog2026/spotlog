import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const COLUMN_BY_EVENT: Record<string, "impressions" | "clicks" | "conversions"> = {
  impression: "impressions",
  click: "clicks",
  conversion: "conversions",
};

/**
 * Incrementa impressions/clicks/conversions de um pop-up. Mesmo padrão
 * select-then-update já usado em bio/go/[linkId] (sem RPC nova).
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { event?: string };
  const column = COLUMN_BY_EVENT[body.event ?? ""];
  if (!column) {
    return NextResponse.json({ error: "event inválido" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: current } = await admin
    .from("popups")
    .select(column)
    .eq("id", id)
    .maybeSingle();
  if (!current) return NextResponse.json({ ok: false }, { status: 404 });
  const next = (Number((current as Record<string, number>)[column]) || 0) + 1;
  await admin.from("popups").update({ [column]: next }).eq("id", id);
  return NextResponse.json({ ok: true });
}
