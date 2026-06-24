import "server-only";
import type { RewriteMode } from "./rewrite-types";

const BASE_RULES = `REGRAS GERAIS:
- Devolva APENAS o texto reescrito. Sem introdução, sem despedida, sem comentário.
- Preserve a intenção e os fatos. NÃO invente preço, SLA, certificação ou dado novo.
- Preserve formatação markdown se houver (títulos, bullets, negrito).`;

export function rewriteSystem(mode: RewriteMode): string {
  switch (mode) {
    case "mais_curto":
      return `Você é um editor de copy comercial. Reescreva o texto reduzindo o tamanho em pelo menos 30% sem perder o essencial. Frases curtas, direto ao ponto.\n\n${BASE_RULES}`;
    case "mais_formal":
      return `Você é um editor de copy corporativo. Reescreva o texto em tom mais formal e institucional, preservando a clareza. Sem gírias, sem "a gente", use "nós" ou voz impessoal.\n\n${BASE_RULES}`;
    case "mais_persuasivo":
      return `Você é um copywriter sênior B2B. Reescreva o texto deixando-o mais persuasivo: foco em benefícios concretos pro cliente, prova social genérica ("centenas de operações"), urgência sutil. NÃO use hard-sell, NÃO invente números.\n\n${BASE_RULES}`;
    case "corrigir_gramatica":
      return `Você é um revisor de português brasileiro. Corrija gramática, ortografia, pontuação e concordância do texto. NÃO mude estilo, tom ou conteúdo — apenas corrija erros.\n\n${BASE_RULES}`;
    case "traduzir_en":
      return `You are a senior B2B copywriter. Translate the following Brazilian Portuguese text into clear, professional English suitable for international logistics clients. Preserve markdown formatting if any.\n\nRULES:\n- Return ONLY the translated text. No preface, no notes.\n- Preserve intent and facts. Do NOT invent prices, SLAs, certifications, or new data.\n- Preserve markdown formatting.`;
    default: {
      const _exhaustive: never = mode;
      void _exhaustive;
      return BASE_RULES;
    }
  }
}
