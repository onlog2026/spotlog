import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    title?: string;
    body?: string;
    audience?: string;
    target_company_id?: string | null;
    target_organization_id?: string | null;
  };
  if (!body.title?.trim() || !body.body?.trim() || !body.audience) {
    return NextResponse.json(
      { error: "title, body e audience obrigatórios" },
      { status: 400 },
    );
  }

  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("sa_send_broadcast", {
    p_title: body.title.trim(),
    p_body: body.body.trim(),
    p_audience: body.audience,
    p_target_company: body.target_company_id ?? null,
    p_target_org: body.target_organization_id ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data });
}
