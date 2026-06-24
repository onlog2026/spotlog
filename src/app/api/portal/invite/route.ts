import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    email?: string;
    company_id?: string;
    organization_id?: string;
    role?: string;
  };
  if (!body.email || !body.company_id || !body.organization_id) {
    return NextResponse.json(
      { error: "email, company_id e organization_id obrigatórios" },
      { status: 400 },
    );
  }
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("portal_invite_user", {
    p_email: body.email,
    p_company_id: body.company_id,
    p_org: body.organization_id,
    p_role: body.role ?? "member",
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? { status: "unknown" });
}
