import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSessionByToken, appendMessage } from "@/lib/ai/chatbot-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const onlyDigits = (s: string) => s.replace(/\D/g, "");

const schema = z.object({
  session_token: z.string().min(8).max(120),
  name: z.string().min(2).max(120),
  email: z.string().email().max(180),
  phone: z
    .string()
    .max(40)
    .optional()
    .refine((v) => !v || onlyDigits(v).length >= 8, "Telefone inválido"),
  company: z.string().max(160).optional(),
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
    const session = await getSessionByToken(data.session_token);
    if (!session) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 404 });
    }

    const supabase = createAdminClient();
    let orgId = session.organization_id;
    if (!orgId) {
      orgId = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? null;
      if (!orgId) {
        const { data: org } = await supabase
          .from("organizations")
          .select("id")
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        orgId = (org as { id: string } | null)?.id ?? null;
      }
    }
    if (!orgId) {
      return NextResponse.json(
        { error: "Sem organização-destino." },
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
        source: "chatbot",
        source_detail: "spotlog_assist_widget",
        full_name: data.name,
        email: data.email,
        phone: data.phone,
        whatsapp: data.phone,
        company_name: data.company,
        message: data.message ?? "Conversão via chatbot Spotlog Assist",
        ip,
        user_agent: req.headers.get("user-agent") ?? undefined,
        utm_source: "chatbot",
        utm_medium: "widget",
        utm_campaign: "spotlog_assist",
        custom_fields: { chatbot_session_token: data.session_token },
      })
      .select("id")
      .single();

    if (error || !lead) {
      console.error("[/api/chatbot/convert] insert error", error);
      return NextResponse.json(
        { error: "Não foi possível registrar." },
        { status: 500 },
      );
    }

    const leadId = (lead as { id: string }).id;

    await supabase
      .from("chatbot_sessions")
      .update({ converted: true, lead_id: leadId })
      .eq("id", session.id);

    await appendMessage(
      session.id,
      "system",
      `Lead convertido: ${data.name} (${data.email})`,
    );

    return NextResponse.json({ lead_id: leadId, status: "created" });
  } catch (err) {
    console.error("[/api/chatbot/convert] fatal", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
