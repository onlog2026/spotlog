import { NextResponse } from "next/server";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession();
  const url = new URL(req.url);
  const email = (url.searchParams.get("email") ?? "").trim().toLowerCase();
  if (!email || !email.includes("@")) {
    return NextResponse.json({ contact: null });
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select(
      "id, full_name, email, phone, whatsapp, job_title, department, seniority, linkedin_url, company_id, cep, street, number, complement, neighborhood, city, state, country, companies(id,name)",
    )
    .eq("organization_id", ctx.org.id)
    .ilike("email", email)
    .limit(1)
    .maybeSingle();
  return NextResponse.json({ contact: data ?? null });
}
