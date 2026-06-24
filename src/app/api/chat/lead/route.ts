import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

const schema = z.object({
  name: z.string().min(2, "Nome muito curto").max(120),
  email: z.string().email("E-mail inválido").max(180),
  phone: z
    .string()
    .max(40)
    .optional()
    .refine(
      (v) => !v || onlyDigits(v).length >= 8,
      "Telefone precisa ter ao menos 8 dígitos",
    ),
  company: z.string().max(160).optional(),
  segment: z.string().max(80).optional(),
  message: z.string().max(2000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }

    const parsed = schema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const data = parsed.data;

    const supabase = createAdminClient();

    // Resolve organização-destino:
    // 1) NEXT_PUBLIC_DEFAULT_ORG_ID, se setado
    // 2) Primeira organização ativa na base
    let orgId: string | undefined = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;

    if (!orgId) {
      const { data: org } = await supabase
        .from("organizations")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      orgId = (org as { id: string } | null)?.id;
    }

    if (!orgId) {
      return NextResponse.json(
        { error: "Nenhuma organização-destino disponível." },
        { status: 500 },
      );
    }

    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      undefined;

    const { data: lead, error } = await supabase
      .from("leads")
      .insert({
        organization_id: orgId,
        source: "chat_widget",
        source_detail: "site_public_chat",
        full_name: data.name,
        email: data.email,
        phone: data.phone,
        whatsapp: data.phone,
        company_name: data.company,
        message: data.message,
        ip,
        user_agent: req.headers.get("user-agent") ?? undefined,
        custom_fields: { segment: data.segment },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[/api/chat/lead] insert error", error);
      return NextResponse.json(
        { error: "Não foi possível registrar o contato." },
        { status: 500 },
      );
    }

    return NextResponse.json({
      ok: true,
      leadId: (lead as { id: string }).id,
    });
  } catch (err) {
    console.error("[/api/chat/lead] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado." },
      { status: 500 },
    );
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
