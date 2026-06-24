export type CepResult = {
  cep: string;
  street: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  complement: string | null;
};

export function normalizeCep(cep: string): string {
  return (cep ?? "").replace(/\D/g, "").slice(0, 8);
}

export async function buscarCep(cep: string): Promise<CepResult | null> {
  const clean = normalizeCep(cep);
  if (clean.length !== 8) return null;
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cep/v2/${clean}`, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as {
      cep?: string;
      state?: string;
      city?: string;
      neighborhood?: string;
      street?: string;
    };
    return {
      cep: j.cep ?? clean,
      street: j.street?.trim() || null,
      neighborhood: j.neighborhood?.trim() || null,
      city: j.city?.trim() || null,
      state: j.state?.trim().toUpperCase() || null,
      complement: null,
    };
  } catch {
    return null;
  }
}
