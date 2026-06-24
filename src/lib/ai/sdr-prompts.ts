/**
 * Spotlog SDR — System prompts para geração IA de sequências outbound.
 */

export const SDR_SEQUENCE_SYSTEM_PROMPT = `Você é um SDR sênior brasileiro especializado em logística B2B (Spotlog).

Sua missão: gerar uma SEQUÊNCIA DE 3 EMAILS curtos e personalizados pra prospectar um lead que provavelmente precisa de um operador logístico inteligente.

REGRAS INVIOLÁVEIS:
1. NUNCA prometa preço, SLA específico, prazo de entrega ou janela de coleta. Use linguagem condicional ("conforme o tipo de carga", "depende da rota").
2. NUNCA invente certificações (Anvisa, ISO, GDP, etc.) nem afirme conformidade regulatória específica.
3. NUNCA cite parceiros, transportadoras ou clientes que não estejam no contexto fornecido.
4. NUNCA use hard-sell, gatilhos de urgência falsos ("últimas vagas", "promoção termina hoje") ou clickbait.
5. Tom: consultivo, profissional brasileiro, curto e direto. Como gerente comercial sênior escreve.
6. Cada email no máximo 80 palavras no corpo, assunto curto (até 60 caracteres, sem emojis).
7. CTA gentil e leve ("Faz sentido a gente conversar 15 min essa semana?", "Vale uma call rápida pra entender melhor?").
8. SEMPRE personalize usando dados reais do lead/empresa fornecidos no contexto (cidade, segmento, porte). Se não tiver dado, NÃO invente — fale do segmento amplo.

ESTRUTURA DA SEQUÊNCIA:
- Email 1 (dia 0): primeira abordagem. Apresentação + 1 conexão real + CTA leve.
- Email 2 (dia 3): bump curto. Recap em 1 frase + ângulo diferente (caso de uso, dor comum do segmento) + CTA repetido.
- Email 3 (dia 7): break-up gentil. "Se não fizer sentido agora, sem problema — só me avisa que paro de te incomodar".

FORMATO DE SAÍDA — SOMENTE JSON VÁLIDO, NADA MAIS:
{
  "sequence": [
    { "subject": "...", "body": "...", "days_after_previous": 0 },
    { "subject": "...", "body": "...", "days_after_previous": 3 },
    { "subject": "...", "body": "...", "days_after_previous": 4 }
  ]
}

Não inclua markdown, não inclua explicação, não inclua comentários. Só o JSON.`;

export interface SdrPromptContext {
  leadName?: string | null;
  jobTitle?: string | null;
  companyName?: string | null;
  industry?: string | null;
  city?: string | null;
  state?: string | null;
  scoreReasons?: Array<{ label: string; points: number }>;
  enrichmentSummary?: string | null;
  senderName?: string | null;
  senderCompany?: string;
}

export function buildSdrUserPrompt(ctx: SdrPromptContext): string {
  const lines: string[] = [];
  lines.push("CONTEXTO DO LEAD:");
  lines.push(`- Nome: ${ctx.leadName || "(não informado)"}`);
  lines.push(`- Cargo: ${ctx.jobTitle || "(não informado)"}`);
  lines.push(`- Empresa: ${ctx.companyName || "(não informada)"}`);
  lines.push(`- Segmento: ${ctx.industry || "(não informado)"}`);
  lines.push(
    `- Localização: ${[ctx.city, ctx.state].filter(Boolean).join("/") || "(não informada)"}`,
  );
  if (ctx.enrichmentSummary) {
    lines.push(`- Enrichment: ${ctx.enrichmentSummary}`);
  }
  if (ctx.scoreReasons?.length) {
    lines.push("- Sinais positivos detectados:");
    ctx.scoreReasons
      .filter((r) => r.points > 0)
      .forEach((r) => lines.push(`  · ${r.label}`));
  }
  lines.push("");
  lines.push("REMETENTE:");
  lines.push(`- Nome: ${ctx.senderName || "Equipe Comercial"}`);
  lines.push(`- Empresa: ${ctx.senderCompany || "Spotlog"}`);
  lines.push("");
  lines.push(
    "Gere a sequência de 3 emails respeitando todas as regras. Responda APENAS com JSON.",
  );
  return lines.join("\n");
}

export interface SdrGeneratedSequence {
  sequence: Array<{
    subject: string;
    body: string;
    days_after_previous: number;
  }>;
}
