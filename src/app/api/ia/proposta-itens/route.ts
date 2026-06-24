import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { chatComplete, safeParseJson } from "@/lib/ai/openai-client";
import { proposalItemsSuggestSystem } from "@/lib/ai/proposal-prompts";
import { checkIaRateLimit } from "@/lib/ai/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  briefing: z.string().min(10).max(4000),
});

export type SuggestedItem = {
  description: string;
  quantity: number;
  unit_price: number;
  justification: string;
};

type ParsedJson = { items?: SuggestedItem[] };

const FALLBACK_ITEMS: SuggestedItem[] = [
  {
    description: "Coleta diária na origem do cliente (São Paulo)",
    quantity: 22,
    unit_price: 45,
    justification: "Base operacional mínima para garantir fluxo recorrente.",
  },
  {
    description: "Last-mile capital + Grande SP (por entrega)",
    quantity: 100,
    unit_price: 18,
    justification: "Volume estimado mensal — ajuste conforme histórico do cliente.",
  },
  {
    description: "Integração via API com plataforma do cliente (setup)",
    quantity: 1,
    unit_price: 1800,
    justification: "Setup pontual, depois o fluxo roda automaticamente.",
  },
  {
    description: "Painel de acompanhamento dedicado + atendimento humano",
    quantity: 1,
    unit_price: 0,
    justification: "Incluso na operação — visibilidade total para o cliente.",
  },
];

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

    const result = await chatComplete({
      messages: [
        { role: "system", content: proposalItemsSuggestSystem },
        { role: "user", content: `BRIEFING:\n${parsed.data.briefing}` },
      ],
      temperature: 0.3,
      jsonMode: true,
    });

    if (!result.ok) {
      return NextResponse.json({
        items: FALLBACK_ITEMS,
        usedFallback: true,
        fallbackReason: result.fallback,
      });
    }

    const parsedJson = safeParseJson<ParsedJson>(result.content);
    const items = parsedJson?.items;
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        items: FALLBACK_ITEMS,
        usedFallback: true,
        fallbackReason: "Resposta inválida da IA, usando sugestão padrão.",
      });
    }

    // Sanitiza
    const clean = items
      .map((it) => ({
        description: String(it.description ?? "").trim().slice(0, 240),
        quantity: Math.max(1, Math.round(Number(it.quantity) || 1)),
        unit_price: Math.max(0, Number(it.unit_price) || 0),
        justification: String(it.justification ?? "").trim().slice(0, 280),
      }))
      .filter((it) => it.description.length > 0)
      .slice(0, 7);

    return NextResponse.json({ items: clean, usedFallback: false });
  } catch (err) {
    console.error("[/api/ia/proposta-itens] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado ao sugerir itens." },
      { status: 500 },
    );
  }
}
