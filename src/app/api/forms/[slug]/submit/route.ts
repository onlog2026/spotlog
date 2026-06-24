import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getFormBySlug } from "@/lib/forms/queries";
import { validatePayload } from "@/lib/forms/validation";
import { mapPayloadToLead } from "@/lib/forms/lead-mapper";

const RATE_LIMIT = new Map<string, { count: number; reset: number }>();
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 10;

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = RATE_LIMIT.get(ip);
  if (!entry || entry.reset < now) {
    RATE_LIMIT.set(ip, { count: 1, reset: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_MAX) return true;
  return false;
}

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params;
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("x-real-ip") ??
      "unknown";

    if (rateLimited(ip)) {
      return NextResponse.json(
        { error: "Muitas tentativas. Aguarde 1 minuto." },
        { status: 429 },
      );
    }

    const form = await getFormBySlug(slug);
    if (!form) {
      return NextResponse.json({ error: "Formulario nao encontrado" }, { status: 404 });
    }

    const body = await req.json();
    const payload = body?.payload ?? {};
    const consent_given = Boolean(body?.consent_given);
    const source_url = body?.source_url ?? body?.page_url ?? null;

    if (form.definition.show_consent && !consent_given) {
      return NextResponse.json(
        { error: "Consentimento e obrigatorio (LGPD)." },
        { status: 400 },
      );
    }

    const validation = validatePayload(form.fields, payload);
    if (!validation.ok) {
      return NextResponse.json(
        { error: "Dados invalidos", issues: validation.errors },
        { status: 400 },
      );
    }

    const mapped = mapPayloadToLead(form.fields, validation.data);
    const supabase = createAdminClient();
    const orgId = form.definition.organization_id;

    const leadInsert: Record<string, unknown> = {
      organization_id: orgId,
      source: form.definition.lead_source,
      source_detail: form.definition.lead_source_detail,
      ...mapped.columns,
      utm_source: body?.utm_source ?? null,
      utm_medium: body?.utm_medium ?? null,
      utm_campaign: body?.utm_campaign ?? null,
      utm_term: body?.utm_term ?? null,
      utm_content: body?.utm_content ?? null,
      page_url: source_url,
      referrer: body?.referrer ?? null,
      ip: ip !== "unknown" ? ip : null,
      user_agent: req.headers.get("user-agent") ?? null,
      custom_fields: mapped.custom_fields,
    };

    const { data: lead, error: leadErr } = await supabase
      .from("leads")
      .insert(leadInsert)
      .select("id")
      .single();

    if (leadErr) {
      console.error("[/api/forms/submit] lead insert error", leadErr);
      return NextResponse.json(
        { error: "Nao foi possivel registrar o lead." },
        { status: 500 },
      );
    }

    const leadId = (lead as { id: string }).id;

    // Usa RPC pra bypass schema cache do PostgREST
    // @ts-expect-error rpc dinâmico
    const { data: submissionId, error: subErr } = await supabase.rpc("fb_create_submission", {
      p_form_id: form.definition.id,
      p_payload: validation.data,
      p_lead_id: leadId,
      p_source_url: source_url,
      p_ip: ip !== "unknown" ? ip : null,
      p_ua: req.headers.get("user-agent") ?? null,
      p_consent: consent_given,
    });

    if (subErr) {
      console.warn("[/api/forms/submit] submission insert warn", subErr);
    }
    const submission = submissionId ? { id: submissionId as string } : null;

    // notify admins (best-effort)
    try {
      const { data: admins } = await supabase
        .from("organization_members")
        .select("user_id")
        .eq("organization_id", orgId)
        .in("role", ["owner", "admin", "manager"]);
      if (admins?.length) {
        const summary =
          (mapped.columns.full_name as string | undefined) ??
          (mapped.columns.email as string | undefined) ??
          "Nova submissao";
        await supabase.from("notifications").insert(
          admins.map((m) => ({
            organization_id: orgId,
            user_id: (m as { user_id: string }).user_id,
            kind: "new_lead",
            title: `Novo lead via ${form.definition.title}`,
            body: summary,
            link: `/app/leads/${leadId}`,
          })),
        );
      }
    } catch (e) {
      console.warn("[/api/forms/submit] notify failed", e);
    }

    return NextResponse.json({
      ok: true,
      submission_id: submission?.id ?? null,
      lead_id: leadId,
      success_title: form.definition.success_title,
      success_message: form.definition.success_message,
      redirect_url: form.definition.redirect_url,
    });
  } catch (err) {
    console.error("[/api/forms/submit] error", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
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
