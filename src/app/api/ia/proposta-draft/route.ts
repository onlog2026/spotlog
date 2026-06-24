import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chatComplete } from "@/lib/ai/openai-client";
import { proposalDraftSystem } from "@/lib/ai/proposal-prompts";
import { checkIaRateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z
  .object({
    leadId: z.string().uuid().optional(),
    companyId: z.string().uuid().optional(),
    contactId: z.string().uuid().optional(),
    briefing: z.string().min(10).max(4000),
  })
  .refine((v) => v.leadId || v.companyId || v.contactId || v.briefing.length > 0, {
    message: "Forneça pelo menos um briefing.",
  });

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSession();
    const rate = checkIaRateLimit(ctx.org.id);
    if (!rate.ok) {
      return NextResponse.json(
        {
          error:
            "Limite de uso da IA atingido. Tente novamente em alguns minutos.",
          retryAfterSec: rate.retryAfterSec,
        },
        { status: 429 },
      );
    }

    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }
    const { leadId, companyId, contactId, briefing } = parsed.data;

    // Carrega contexto opcional do lead/company/contact pra dar mais material
    const sb = await createClient();
    const contextChunks: string[] = [];

    if (companyId) {
      const { data } = await sb
        .from("companies")
        .select("name, segment, size, website, notes")
        .eq("id", companyId)
        .eq("organization_id", ctx.org.id)
        .maybeSingle();
      if (data) {
        contextChunks.push(`EMPRESA: ${JSON.stringify(data)}`);
      }
    }
    if (contactId) {
      const { data } = await sb
        .from("contacts")
        .select("full_name, role, email")
        .eq("id", contactId)
        .eq("organization_id", ctx.org.id)
        .maybeSingle();
      if (data) {
        contextChunks.push(`CONTATO: ${JSON.stringify(data)}`);
      }
    }
    if (leadId) {
      const { data } = await sb
        .from("leads")
        .select("name, company_name, segment, notes, source")
        .eq("id", leadId)
        .eq("organization_id", ctx.org.id)
        .maybeSingle();
      if (data) {
        contextChunks.push(`LEAD: ${JSON.stringify(data)}`);
      }
    }

    const userContent = [
      contextChunks.length ? contextChunks.join("\n\n") : null,
      `BRIEFING DO CLIENTE:\n${briefing}`,
    ]
      .filter(Boolean)
      .join("\n\n");

    const result = await chatComplete({
      messages: [
        { role: "system", content: proposalDraftSystem },
        { role: "user", content: userContent },
      ],
      temperature: 0.5,
    });

    if (!result.ok) {
      // Fallback estruturado (canned) — preenche um esqueleto pro humano editar
      const fallbackMarkdown = `## Contexto do cliente\n${briefing.slice(0, 280)}\n\n## Problema\n- Visibilidade limitada das entregas\n- Atendimento lento quando algo dá errado\n- Integração manual entre sistemas\n\n## Solução Spotlog\n- Rastreamento ponta-a-ponta em tempo real\n- Atendimento humano + IA\n- Painel próprio com indicadores\n- Integrações via API\n- Foco em produtos sensíveis (farma, dermo, suplementos)\n\n## Escopo\n- Operação em São Paulo capital e Grande SP\n- Painel de acompanhamento incluso\n- Suporte em horário comercial\n\n## Próximos passos\n- Aceitar a proposta digitalmente\n- Kick-off em até 5 dias úteis\n- Gerente de conta dedicado`;
      return NextResponse.json({
        markdown: fallbackMarkdown,
        usedFallback: true,
        fallbackReason: result.fallback,
      });
    }

    return NextResponse.json({
      markdown: result.content,
      usedFallback: false,
    });
  } catch (err) {
    console.error("[/api/ia/proposta-draft] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado ao gerar proposta." },
      { status: 500 },
    );
  }
}
