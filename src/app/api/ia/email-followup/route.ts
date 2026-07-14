import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { chatComplete, safeParseJson } from "@/lib/ai/openai-client";
import { emailFollowupSystem } from "@/lib/ai/proposal-prompts";
import { checkIaRateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  proposalId: z.string().uuid(),
});

type EmailDraft = { subject: string; body: string };

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSession();
    const rate = checkIaRateLimit(ctx.org.id);
    if (!rate.ok) {
      return NextResponse.json(
        {
          error: "Limite de uso da IA atingido. Tente novamente em alguns minutos.",
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

    const sb = await createClient();
    const { data: prop } = await sb
      .from("proposals")
      .select(
        "id, number, title, status, total, currency, sent_at, viewed_at, contact:contacts(full_name, email), company:companies(name)",
      )
      .eq("id", parsed.data.proposalId)
      .eq("organization_id", ctx.org.id)
      .maybeSingle();

    if (!prop) {
      return NextResponse.json(
        { error: "Proposta não encontrada." },
        { status: 404 },
      );
    }

    const p = prop as unknown as {
      number: number;
      title: string;
      status: string;
      total: number;
      currency: string;
      sent_at: string | null;
      viewed_at: string | null;
      contact: { full_name: string; email: string | null } | null;
      company: { name: string } | null;
    };

    const contextSummary = [
      `Título: ${p.title}`,
      `Número: #${p.number}`,
      `Status atual: ${p.status}`,
      `Valor total: ${p.currency} ${Number(p.total).toFixed(2)}`,
      p.sent_at ? `Enviada em: ${p.sent_at}` : "Ainda não enviada",
      p.viewed_at ? `Visualizada em: ${p.viewed_at}` : "Ainda não visualizada pelo cliente",
      `Cliente: ${p.contact?.full_name ?? p.company?.name ?? "Cliente"}`,
    ].join("\n");

    const result = await chatComplete({
      orgId: ctx.org.id,
      messages: [
        { role: "system", content: emailFollowupSystem },
        {
          role: "user",
          content: `CONTEXTO DA PROPOSTA:\n${contextSummary}\n\nEscreva o follow-up.`,
        },
      ],
      temperature: 0.5,
      jsonMode: true,
    });

    const cliente = p.contact?.full_name?.split(" ")[0] ?? "tudo bem";

    if (!result.ok) {
      const fallback: EmailDraft = {
        subject: `Sobre a proposta #${p.number} — ${p.title}`,
        body: `Olá ${cliente},\n\nPassando pra saber se conseguiu olhar a proposta #${p.number} que enviei. Fico à disposição pra tirar qualquer dúvida — posso abrir uma call rápida de 15 min em horário que for melhor pra você.\n\nAbraço,\nEquipe Spotlog`,
      };
      return NextResponse.json({
        ...fallback,
        usedFallback: true,
        fallbackReason: result.fallback,
      });
    }

    const draft = safeParseJson<EmailDraft>(result.content);
    if (!draft?.subject || !draft?.body) {
      const fallback: EmailDraft = {
        subject: `Sobre a proposta #${p.number} — ${p.title}`,
        body: result.content.trim() ||
          `Olá ${cliente},\n\nPassando pra saber se conseguiu olhar a proposta #${p.number}. Fico à disposição.\n\nAbraço,\nEquipe Spotlog`,
      };
      return NextResponse.json({
        ...fallback,
        usedFallback: true,
        fallbackReason: "Resposta da IA não estava no formato esperado.",
      });
    }

    return NextResponse.json({
      subject: draft.subject,
      body: draft.body,
      usedFallback: false,
    });
  } catch (err) {
    console.error("[/api/ia/email-followup] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado ao gerar follow-up." },
      { status: 500 },
    );
  }
}
