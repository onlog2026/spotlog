import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * POST /api/leads/:id/assign
 * Body: { user_id?: string }
 *  - sem user_id => self-claim (RPC claim_lead)
 *  - com user_id => admin/manager reatribui (RPC reassign_lead)
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireSession();
  const { id } = await params;
  const body = (await req.json().catch(() => ({}))) as { user_id?: string };
  const supabase = await createClient();

  if (body.user_id) {
    if (!["owner", "admin", "manager"].includes(ctx.org.role)) {
      return NextResponse.json(
        { error: "Apenas admins podem reatribuir." },
        { status: 403 },
      );
    }
    const { error } = await supabase.rpc("reassign_lead", {
      p_lead_id: id,
      p_to_user: body.user_id,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, status: "reassigned" });
  }

  const { data, error } = await supabase.rpc("claim_lead", { p_lead_id: id });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { ok: true });
}
