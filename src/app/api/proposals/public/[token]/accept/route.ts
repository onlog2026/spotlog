import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const body = schema.parse(await req.json());
  const admin = createAdminClient();

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? undefined;

  const { data: prop } = await admin
    .from("proposals")
    .select("id, status, expires_at, organization_id, deal_id")
    .eq("public_token", token)
    .maybeSingle();

  if (!prop)
    return NextResponse.json({ error: "Proposta não encontrada" }, { status: 404 });

  const p = prop as unknown as {
    id: string;
    status: string;
    expires_at: string | null;
    organization_id: string;
    deal_id: string | null;
  };

  if (p.status === "accepted")
    return NextResponse.json({ error: "Já aceita" }, { status: 400 });
  if (p.expires_at && new Date(p.expires_at) < new Date())
    return NextResponse.json({ error: "Expirada" }, { status: 400 });

  await admin
    .from("proposals")
    .update({
      status: "accepted",
      signed_by_name: body.name,
      signed_by_email: body.email,
      signed_at: new Date().toISOString(),
      signed_ip: ip,
    })
    .eq("id", p.id);

  // Marca o deal como ganho (se vinculado)
  if (p.deal_id) {
    const { data: wonStage } = await admin
      .from("pipeline_stages")
      .select("id")
      .eq("organization_id", p.organization_id)
      .eq("is_won", true)
      .limit(1)
      .maybeSingle();
    if (wonStage) {
      await admin
        .from("deals")
        .update({
          stage_id: (wonStage as { id: string }).id,
          status: "won",
          closed_at: new Date().toISOString(),
        })
        .eq("id", p.deal_id);
    }
  }

  // Notifica admins
  const { data: admins } = await admin
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", p.organization_id)
    .in("role", ["owner", "admin", "manager"]);

  if (admins?.length) {
    await admin.from("notifications").insert(
      admins.map((m) => ({
        organization_id: p.organization_id,
        user_id: (m as { user_id: string }).user_id,
        kind: "proposal_accepted",
        title: "Proposta aceita!",
        body: `${body.name} aceitou a proposta.`,
        link: `/app/propostas/${p.id}`,
      })),
    );
  }

  return NextResponse.json({ ok: true });
}
