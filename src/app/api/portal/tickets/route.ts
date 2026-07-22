import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireClientSession } from "@/lib/auth-client";

function genProtocol() {
  const d = new Date();
  const y = d.getFullYear().toString().slice(-2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const rnd = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `T${y}${m}-${rnd}`;
}

export async function POST(req: Request) {
  const ctx = await requireClientSession();
  const body = (await req.json().catch(() => ({}))) as {
    company_id?: string;
    organization_id?: string;
    subject?: string;
    category?: string;
    priority?: string;
    description?: string;
  };
  if (!body.subject?.trim() || !body.description?.trim()) {
    return NextResponse.json(
      { error: "subject e description obrigatórios" },
      { status: 400 },
    );
  }
  // Sempre força pro contexto do cliente — ignora valores enviados se diferentes
  const company_id = ctx.company.id;
  const organization_id = ctx.organization.id;

  // A coluna só aceita valores em português (CHECK CONSTRAINT) — o form do
  // portal manda em inglês, então sem esse mapa TODO chamado quebrava com
  // erro de constraint do Postgres.
  const PRIORITY_MAP: Record<string, string> = {
    low: "baixa",
    normal: "media",
    high: "alta",
    urgent: "urgente",
  };
  const priority = PRIORITY_MAP[body.priority ?? "normal"] ?? "media";

  const supabase = await createClient();
  const protocol = genProtocol();
  const { data, error } = await supabase
    .from("support_tickets")
    .insert({
      organization_id,
      company_id,
      protocol,
      subject: body.subject.trim(),
      category: body.category ?? "geral",
      priority,
      description: body.description.trim(),
      status: "aberto",
      created_by: ctx.user.id,
      opened_at: new Date().toISOString(),
    })
    .select("id, protocol")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id, protocol: data.protocol });
}
