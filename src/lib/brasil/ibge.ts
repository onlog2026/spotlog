import { unstable_cache } from "next/cache";

export type Municipio = { id: number; nome: string };

async function fetchMunicipios(uf: string): Promise<Municipio[]> {
  const sigla = uf.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(sigla)) return [];
  try {
    const r = await fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${sigla}/municipios?orderBy=nome`,
      { next: { revalidate: 60 * 60 * 24 } },
    );
    if (!r.ok) return [];
    const data = (await r.json()) as Array<{ id: number; nome: string }>;
    return data.map((m) => ({ id: m.id, nome: m.nome }));
  } catch {
    return [];
  }
}

// 24h cache, indexed por UF
export const listarMunicipios = unstable_cache(
  fetchMunicipios,
  ["ibge-municipios-v1"],
  { revalidate: 60 * 60 * 24, tags: ["ibge-municipios"] },
);
