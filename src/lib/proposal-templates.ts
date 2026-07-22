// Helpers compartilhados dos Modelos de Proposta (tabela de preços por
// região/CEP/peso + abrangência + regras gerais, importados de planilha).
// Função PURA — usada tanto no admin (lib/queries) quanto na página pública.

export const WEIGHT_BRACKETS = [
  "0.250 kg", "0.500 kg", "0.750 kg", "1 kg", "2 kg", "3 kg", "4 kg", "5 kg",
  "6 kg", "7 kg", "8 kg", "9 kg", "10 kg", "15 kg", "20 kg", "25 kg", "30 kg",
];

export type TemplateRegionRow = {
  uf: string;
  cidade: string;
  regiao: string;
  cep_inicio: string;
  cep_fim: string;
  prazo_entrega: string | null;
  precos: Record<string, number>;
};

/** Aplica o % de reajuste (ex: 0.08 = 8%) sobre o preço base de uma faixa de peso. */
export function applyReajuste(basePrice: number, reajustePct: number): number {
  return basePrice * (1 + reajustePct);
}

/**
 * Resumo por região (igual à aba "RESUMO" da planilha): min/média/máx por
 * faixa de peso, agrupado por região. Reajuste já aplicado se informado.
 */
export function buildRegionSummary(
  regions: TemplateRegionRow[],
  reajustePct = 0,
): {
  regioes: string[];
  byRegiao: Record<string, Record<string, { min: number; max: number; avg: number; count: number }>>;
} {
  const regioes = Array.from(new Set(regions.map((r) => r.regiao).filter(Boolean))).sort();
  const byRegiao: Record<string, Record<string, { min: number; max: number; avg: number; count: number }>> = {};

  for (const regiao of regioes) {
    const rowsInRegiao = regions.filter((r) => r.regiao === regiao);
    const stats: Record<string, { min: number; max: number; avg: number; count: number }> = {};
    for (const w of WEIGHT_BRACKETS) {
      const values = rowsInRegiao
        .map((r) => r.precos[w])
        .filter((v): v is number => typeof v === "number")
        .map((v) => applyReajuste(v, reajustePct));
      if (values.length === 0) continue;
      stats[w] = {
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((a, b) => a + b, 0) / values.length,
        count: values.length,
      };
    }
    byRegiao[regiao] = stats;
  }

  return { regioes, byRegiao };
}
