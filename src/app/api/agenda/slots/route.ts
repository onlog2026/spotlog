import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/agenda/slots?date=YYYY-MM-DD&owner=uuid|auto&org=uuid
 *
 * Retorna lista de slots disponíveis pro owner indicado no dia.
 * Se owner=auto, escolhe o member com role sdr|closer da org que tem
 * MENOS appointments no dia (round-robin natural).
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date");
  const ownerParam = searchParams.get("owner");
  const org = searchParams.get("org");

  if (!date || !org) {
    return NextResponse.json({ error: "date e org obrigatórios" }, { status: 400 });
  }

  const supabase = await createClient();

  let owner = ownerParam ?? "auto";

  if (owner === "auto") {
    const { data: members } = await supabase
      .from("organization_members")
      .select("user_id, role")
      .eq("organization_id", org)
      .in("role", ["sdr", "closer", "admin", "owner"]);

    if (!members?.length) {
      return NextResponse.json({ slots: [], reason: "no_members" });
    }

    // Conta agendamentos do dia pra cada um
    const dayStart = new Date(`${date}T00:00:00-03:00`).toISOString();
    const dayEnd = new Date(`${date}T23:59:59-03:00`).toISOString();
    const { data: dayAppts } = await supabase
      .from("appointments")
      .select("owner_user_id")
      .eq("organization_id", org)
      .gte("scheduled_at", dayStart)
      .lte("scheduled_at", dayEnd);
    const counts = new Map<string, number>();
    for (const m of members) counts.set(m.user_id, 0);
    for (const a of dayAppts ?? []) {
      if (!a.owner_user_id) continue;
      counts.set(a.owner_user_id, (counts.get(a.owner_user_id) ?? 0) + 1);
    }
    let min = Infinity;
    let pick = members[0].user_id;
    for (const [u, c] of counts.entries()) {
      if (c < min) {
        min = c;
        pick = u;
      }
    }
    owner = pick;
  }

  const { data, error } = await supabase.rpc("list_available_slots", {
    p_user: owner,
    p_org: org,
    p_date: date,
  });

  if (error) {
    console.error("[agenda/slots] rpc error", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ owner, slots: data ?? [] });
}
