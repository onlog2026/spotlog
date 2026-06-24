import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getSdrClient } from "@/lib/sdr/db";
import {
  SDR_SEQUENCE_SYSTEM_PROMPT,
  buildSdrUserPrompt,
  type SdrGeneratedSequence,
} from "@/lib/ai/sdr-prompts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  leadId: z.string().uuid(),
});

// Rate limit por org: 20 / hora
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 20;
const orgHits = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(orgId: string): boolean {
  const now = Date.now();
  const entry = orgHits.get(orgId);
  if (!entry || entry.resetAt < now) {
    orgHits.set(orgId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count += 1;
  return true;
}

const FALLBACK: SdrGeneratedSequence = {
  sequence: [
    {
      subject: "Operação logística para sua empresa",
      body: "Oi! Sou da Spotlog, operador logístico em SP/Grande SP, focado em ecommerce, farma e dermocosméticos. Vi que vocês podem se beneficiar do nosso modelo de rastreamento ponta-a-ponta e atendimento humano. Faz sentido a gente conversar 15 minutos essa semana pra entender melhor a operação de vocês?",
      days_after_previous: 0,
    },
    {
      subject: "Recap rápido",
      body: "Voltando aqui pra reforçar: muitos clientes de ecommerce e dermo trocam o transportador porque perdem visibilidade no last-mile. Nosso painel mostra tudo ao vivo, sem URA. Vale uma call rápida pra ver se faz sentido?",
      days_after_previous: 3,
    },
    {
      subject: "Encerro por aqui?",
      body: "Sem retorno, presumo que não é prioridade agora — sem problema. Só me diz se devo parar de te incomodar ou se vale tentar de novo daqui uns meses. Abraço!",
      days_after_previous: 4,
    },
  ],
};

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSession();
    if (!checkRateLimit(ctx.org.id)) {
      return NextResponse.json(
        { error: "Limite de geração de sequências atingido (20/hora)." },
        { status: 429 },
      );
    }

    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const supabase = await getSdrClient();
    const { data: lead } = await supabase
      .from("leads")
      .select(
        "id, organization_id, full_name, job_title, company_name, email, score",
      )
      .eq("id", parsed.data.leadId)
      .eq("organization_id", ctx.org.id)
      .maybeSingle();

    if (!lead) {
      return NextResponse.json({ error: "Lead não encontrado." }, { status: 404 });
    }

    // Tenta achar company + enrichment
    let companyData: {
      industry?: string | null;
      city?: string | null;
      state?: string | null;
    } | null = null;
    let enrichmentSummary: string | null = null;
    if (lead.company_name) {
      const { data: c } = await supabase
        .from("companies")
        .select("industry, city, state, cnpj")
        .eq("organization_id", ctx.org.id)
        .ilike("name", lead.company_name)
        .maybeSingle();
      companyData = c;
      if (c?.cnpj) {
        const { data: enr } = await supabase
          .from("company_enrichment")
          .select("enriched_data")
          .eq("organization_id", ctx.org.id)
          .eq("cnpj", c.cnpj)
          .maybeSingle();
        if (enr?.enriched_data) {
          const ed = enr.enriched_data as Record<string, unknown>;
          enrichmentSummary = [
            ed.cnae_descricao,
            ed.porte && `porte ${ed.porte}`,
            ed.capital_social && `capital R$${ed.capital_social}`,
          ]
            .filter(Boolean)
            .join(" · ");
        }
      }
    }

    // Score reasons mais recente
    const { data: scoreRow } = await supabase
      .from("lead_scores")
      .select("reasons")
      .eq("lead_id", lead.id)
      .order("computed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const userPrompt = buildSdrUserPrompt({
      leadName: lead.full_name,
      jobTitle: lead.job_title,
      companyName: lead.company_name,
      industry: companyData?.industry ?? null,
      city: companyData?.city ?? null,
      state: companyData?.state ?? null,
      scoreReasons:
        (scoreRow?.reasons as Array<{ label: string; points: number }>) ?? [],
      enrichmentSummary,
      senderName: ctx.user.full_name,
      senderCompany: ctx.org.name,
    });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ sequence: FALLBACK.sequence, fallback: true });
    }

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.6,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SDR_SEQUENCE_SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!upstream.ok) {
      console.error(
        "[/api/sdr/generate-sequence] upstream",
        upstream.status,
        await upstream.text().catch(() => ""),
      );
      return NextResponse.json({ sequence: FALLBACK.sequence, fallback: true });
    }

    const payload = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content ?? "{}";

    try {
      const parsedSequence = JSON.parse(content) as SdrGeneratedSequence;
      if (!Array.isArray(parsedSequence.sequence) || parsedSequence.sequence.length === 0) {
        return NextResponse.json({ sequence: FALLBACK.sequence, fallback: true });
      }
      return NextResponse.json({ sequence: parsedSequence.sequence });
    } catch (err) {
      console.error("[/api/sdr/generate-sequence] parse", err);
      return NextResponse.json({ sequence: FALLBACK.sequence, fallback: true });
    }
  } catch (err) {
    console.error("[/api/sdr/generate-sequence] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado." },
      { status: 500 },
    );
  }
}
