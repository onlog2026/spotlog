import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { dispatchEvent } from "@/lib/integrations/dispatcher";
import { sendNewLeadNotification } from "@/lib/email/new-lead-notification";

const schema = z.object({
  full_name: z.string().min(2),
  email: z.string().email(),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  company_name: z.string().optional(),
  job_title: z.string().optional(),
  message: z.string().optional(),
  team_size: z.string().optional(),
  source: z.string().default("form"),
  source_detail: z.string().optional(),
  organization_id: z.string().uuid().optional(),
  utm_source: z.string().nullish(),
  utm_medium: z.string().nullish(),
  utm_campaign: z.string().nullish(),
  utm_term: z.string().nullish(),
  utm_content: z.string().nullish(),
  page_url: z.string().nullish(),
  referrer: z.string().nullish(),
  custom_fields: z.record(z.any()).optional(),
});

/**
 * POST /api/leads
 * Endpoint público que aceita lead do formulário do site e cria registro
 * na tabela `leads` da organização-destino. Quando o domínio do e-mail bate
 * com `organizations.domain`, atribui à organização certa. Senão usa a env
 * NEXT_PUBLIC_DEFAULT_ORG_ID (ou rejeita).
 *
 * Em embed externo, o cliente pode passar `organization_id` explicitamente.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);
    const supabase = createAdminClient();

    let orgId = data.organization_id;

    // Se não veio org_id, tenta resolver pelo domínio do e-mail
    if (!orgId) {
      const emailDomain = data.email.split("@")[1]?.toLowerCase();
      if (emailDomain) {
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .eq("domain", emailDomain)
          .maybeSingle();
        orgId = (org as { id: string } | null)?.id;
      }
    }

    // Fallback final 1: env var
    if (!orgId) orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID;

    // Fallback final 2: se ainda não tem, pega a primeira (ÚNICA em deploy single-tenant)
    if (!orgId) {
      const { data: firstOrg } = await supabase
        .from("organizations")
        .select("id")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      orgId = (firstOrg as { id: string } | null)?.id;
    }

    if (!orgId) {
      return NextResponse.json(
        {
          error:
            "Nenhuma organização-destino encontrada. Configure NEXT_PUBLIC_DEFAULT_ORG_ID ou crie a primeira organização.",
        },
        { status: 400 },
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
        source: data.source,
        source_detail: data.source_detail,
        full_name: data.full_name,
        email: data.email,
        whatsapp: data.whatsapp,
        phone: data.phone,
        company_name: data.company_name,
        job_title: data.job_title,
        message: data.message,
        utm_source: data.utm_source ?? undefined,
        utm_medium: data.utm_medium ?? undefined,
        utm_campaign: data.utm_campaign ?? undefined,
        utm_term: data.utm_term ?? undefined,
        utm_content: data.utm_content ?? undefined,
        page_url: data.page_url ?? undefined,
        referrer: data.referrer ?? undefined,
        ip,
        user_agent: req.headers.get("user-agent") ?? undefined,
        custom_fields: { team_size: data.team_size, ...data.custom_fields },
      })
      .select("id")
      .single();

    if (error) {
      console.error("[/api/leads] insert error", error);
      return NextResponse.json(
        { error: "Não foi possível registrar o lead.", details: error.message },
        { status: 500 },
      );
    }

    // notificação para os admins (best-effort)
    try {
      const { data: admins } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId)
        .in("role", ["owner", "admin", "manager"]);

      if (admins?.length) {
        await supabase.from("notifications").insert(
          admins.map((m) => ({
            organization_id: orgId!,
            user_id: (m as { user_id: string }).user_id,
            kind: "new_lead",
            title: "Novo lead recebido",
            body: `${data.full_name} — ${data.company_name ?? data.email}`,
            link: `/app/leads/${(lead as { id: string }).id}`,
          })),
        );
      }
    } catch (e) {
      console.warn("[/api/leads] notify failed", e);
    }

    // E-mail de notificação para o time comercial (best-effort)
    await sendNewLeadNotification({
      id: (lead as { id: string }).id,
      full_name: data.full_name,
      email: data.email,
      whatsapp: data.whatsapp,
      company_name: data.company_name,
      message: data.message,
      source_detail: data.source_detail,
      custom_fields: data.custom_fields as Record<string, string> | undefined,
    });

    // Dispara para integrações nativas (Slack, Discord, Telegram, webhook genérico)
    dispatchEvent(orgId, "lead.created", {
      id: (lead as { id: string }).id,
      full_name: data.full_name,
      email: data.email,
      phone: data.phone,
      company_name: data.company_name,
      source: data.source,
    });

    return NextResponse.json({ ok: true, id: (lead as { id: string }).id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: err.issues },
        { status: 400 },
      );
    }
    console.error(err);
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
