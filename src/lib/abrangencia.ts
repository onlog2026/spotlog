import ranges from "@/data/abrangencia.json";

export type Faixa = { c: string; uf: string; a: number; b: number; p: string };

const FAIXAS = ranges as Faixa[];

export function normalizeCep(input: string): number | null {
  const d = (input || "").replace(/\D/g, "");
  if (d.length !== 8) return null;
  return parseInt(d, 10);
}

export type ConsultaResultado =
  | { atende: true; prazo: string; cidade: string; uf: string }
  | { atende: false };

/**
 * Consulta um CEP nas faixas de abrangência.
 * Se cair em mais de uma faixa, devolve o MELHOR prazo (menor D+).
 * Expõe só atende/prazo/cidade — nunca valor (dado interno).
 */
export function consultarCep(cep: string): ConsultaResultado {
  const n = normalizeCep(cep);
  if (n === null) return { atende: false };

  let melhor: Faixa | null = null;
  for (const f of FAIXAS) {
    if (n >= f.a && n <= f.b) {
      if (!melhor || prazoNum(f.p) < prazoNum(melhor.p)) melhor = f;
    }
  }
  if (!melhor) return { atende: false };
  return { atende: true, prazo: melhor.p, cidade: melhor.c, uf: melhor.uf };
}

function prazoNum(p: string): number {
  const m = /(\d+)/.exec(p);
  return m ? parseInt(m[1], 10) : 99;
}
