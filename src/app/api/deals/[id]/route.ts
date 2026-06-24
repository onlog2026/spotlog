import { NextResponse, type NextRequest } from "next/server";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireSession();
    const { id } = await params;
    const supabase = await createClient();

    // 1) Busca deal SEM joins (PostgREST cache não conhece todas as FKs)
    const { data: deal, error } = await supabase
      .from("deals")
      .select(
        "id, title, amount, currency, status, source, tags, probability, expected_close_date, created_at, stage_id, company_id, contact_id, owner_id",
      )
      .eq("organization_id", ctx.org.id)
      .eq("id", id)
      .maybeSingle();

    if (error || !deal) {
      console.error("[/api/deals/:id] not found", error);
      return NextResponse.json(
        { error: "deal não encontrado", details: error?.message },
        { status: 404 },
      );
    }

    const d = deal as {
      id: string;
      title: string;
      amount: number | string | null;
      currency: string;
      status: string;
      source: string | null;
      tags: string[] | null;
      probability: number | null;
      expected_close_date: string | null;
      created_at: string;
      stage_id: string | null;
      company_id: string | null;
      contact_id: string | null;
      owner_id: string | null;
    };

    // 2) Busca relações em paralelo, cada uma com try independente
    const [stageRes, companyRes, contactRes, profileRes] = await Promise.all([
      d.stage_id
        ? supabase
            .from("pipeline_stages")
            .select("id, name, color")
            .eq("id", d.stage_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      d.company_id
        ? supabase
            .from("companies")
            .select("id, name, cnpj")
            .eq("id", d.company_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      d.contact_id
        ? supabase
            .from("contacts")
            .select("id, full_name, email, phone")
            .eq("id", d.contact_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      d.owner_id
        ? supabase
            .from("profiles")
            .select("id, full_name, email")
            .eq("id", d.owner_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

    return NextResponse.json({
      deal: {
        id: d.id,
        title: d.title,
        amount: Number(d.amount) || 0,
        currency: d.currency,
        status: d.status,
        source: d.source,
        tags: d.tags,
        probability: d.probability,
        expected_close_date: d.expected_close_date,
        created_at: d.created_at,
        stage: stageRes.data ?? null,
        company: companyRes.data ?? null,
        contact: contactRes.data ?? null,
        owner: profileRes.data
          ? {
              id: (profileRes.data as { id: string }).id,
              full_name:
                (profileRes.data as { full_name: string | null }).full_name ??
                (profileRes.data as { email: string | null }).email ??
                "Sem nome",
            }
          : null,
      },
    });
  } catch (err) {
    console.error("[/api/deals/:id] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado", details: err instanceof Error ? err.message : "unknown" },
      { status: 500 },
    );
  }
}
