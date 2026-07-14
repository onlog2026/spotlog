import "server-only";
import { SERVICES } from "@/components/v3/services-data";
import { SOLUCOES } from "@/lib/solucoes-content";
import { MENU_SEGMENTOS, MENU_SERVICOS } from "@/lib/landing-pages";

/**
 * "Auto-aprende do site": monta, EM TEMPO REAL, um catálogo do que a Spotlog
 * oferece a partir do MESMO conteúdo que o site renderiza (serviços, soluções,
 * segmentos). Sempre que o time editar esses conteúdos, o atendente já sabe —
 * sem ninguém treinar nada à mão. Compacto de propósito (cabe no prompt) e
 * factual (nunca inventa preço/prazo).
 */
export function buildSiteKnowledge(): string {
  const servicos = SERVICES.map(
    (s) => `- ${s.name} (${s.buy}): ${s.intro}`,
  ).join("\n");

  const solucoes = SOLUCOES.map((s) => {
    const bens = s.benefits.slice(0, 4).join("; ");
    return `- ${s.title} (/solucoes/${s.slug}): ${s.intro}${bens ? ` Inclui: ${bens}.` : ""}`;
  }).join("\n");

  const segmentos = MENU_SEGMENTOS.map((m) => m.label).join(", ");
  const serviluslinks = MENU_SERVICOS.map((m) => m.label).join(", ");

  return `CATÁLOGO VIVO DA SPOTLOG (gerado do site — use como verdade oficial):

QUEM É: Operador logístico completo em São Paulo capital e Região Metropolitana (RMSP). Frota padronizada, uniforme, embalagem com identidade, rastreio e evidência de entrega. Tem AFE Anvisa para logística farmacêutica.

SERVIÇOS PRINCIPAIS:
${servicos}

SOLUÇÕES (páginas com detalhe):
${solucoes}

SEGMENTOS ATENDIDOS: ${segmentos}.

LINHAS DE SERVIÇO NO MENU: ${serviluslinks}.

COBERTURA: São Paulo capital e Grande SP (consultar disponibilidade de rota para outras regiões).

PREÇOS: não há tabela pública fixa — o valor é sempre por COTAÇÃO, calculado por volume, tipo de operação, região e prazo. Nunca informe um número de preço; encaminhe para o comercial fazer a cotação.`;
}
