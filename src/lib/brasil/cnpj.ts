export type CnpjResult = {
  cnpj: string;
  razao_social: string | null;
  nome_fantasia: string | null;
  cnae_descricao: string | null;
  email: string | null;
  phone: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  situacao: string | null;
  raw?: unknown;
};

export function normalizeCnpj(cnpj: string): string {
  return (cnpj ?? "").replace(/\D/g, "").slice(0, 14);
}

export async function buscarCnpj(cnpj: string): Promise<CnpjResult | null> {
  const clean = normalizeCnpj(cnpj);
  if (clean.length !== 14) return null;
  try {
    const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${clean}`, {
      next: { revalidate: 60 * 60 * 24 },
    });
    if (!r.ok) return null;
    const j = (await r.json()) as Record<string, unknown>;

    const ddd = String(j["ddd_telefone_1"] ?? "").trim();
    const phone = ddd ? `(${ddd.slice(0, 2)}) ${ddd.slice(2)}` : null;

    return {
      cnpj: clean,
      razao_social: (j["razao_social"] as string) ?? null,
      nome_fantasia: (j["nome_fantasia"] as string) ?? null,
      cnae_descricao: (j["cnae_fiscal_descricao"] as string) ?? null,
      email: ((j["email"] as string) ?? "").toLowerCase().trim() || null,
      phone,
      cep: ((j["cep"] as string) ?? "").replace(/\D/g, "") || null,
      street:
        [
          (j["descricao_tipo_de_logradouro"] as string) ?? "",
          (j["logradouro"] as string) ?? "",
        ]
          .filter(Boolean)
          .join(" ")
          .trim() || null,
      number: ((j["numero"] as string) ?? "").trim() || null,
      complement: ((j["complemento"] as string) ?? "").trim() || null,
      neighborhood: ((j["bairro"] as string) ?? "").trim() || null,
      city: ((j["municipio"] as string) ?? "").trim() || null,
      state: ((j["uf"] as string) ?? "").trim().toUpperCase() || null,
      situacao:
        ((j["descricao_situacao_cadastral"] as string) ?? "").trim() || null,
    };
  } catch {
    return null;
  }
}
