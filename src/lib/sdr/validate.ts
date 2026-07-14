/**
 * Agente de Validação & Limpeza — normaliza e valida contatos de leads.
 * Telefone BR, e-mail e CNPJ. Sem inventar: só marca válido/ inválido e
 * padroniza o formato. Também gera chave de deduplicação.
 */

export function onlyDigits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

// DDDs brasileiros válidos (pra filtrar sequências aleatórias de números).
const VALID_DDD = new Set([
  11, 12, 13, 14, 15, 16, 17, 18, 19, 21, 22, 24, 27, 28, 31, 32, 33, 34, 35,
  37, 38, 41, 42, 43, 44, 45, 46, 47, 48, 49, 51, 53, 54, 55, 61, 62, 63, 64,
  65, 66, 67, 68, 69, 71, 73, 74, 75, 77, 79, 81, 82, 83, 84, 85, 86, 87, 88,
  89, 91, 92, 93, 94, 95, 96, 97, 98, 99,
]);

/** Normaliza telefone BR para dígitos (DDD + número). "" se inválido. */
export function normalizePhoneBR(raw: string | null | undefined): string {
  let d = onlyDigits(raw);
  if (d.length >= 12 && d.startsWith("55")) d = d.slice(2); // remove país
  if (d.length !== 10 && d.length !== 11) return "";
  if (!VALID_DDD.has(Number(d.slice(0, 2)))) return ""; // DDD inexistente
  return d;
}

/** Telefone BR válido (fixo 10 díg. ou celular 11 díg. com 9 na 3ª posição). */
export function isValidPhoneBR(raw: string | null | undefined): boolean {
  const d = normalizePhoneBR(raw);
  if (d.length === 11) return d[2] === "9"; // celular
  if (d.length === 10) return /[2-5]/.test(d[2]); // fixo
  return false;
}

export function isMobileBR(raw: string | null | undefined): boolean {
  const d = normalizePhoneBR(raw);
  return d.length === 11 && d[2] === "9";
}

/** Formata para (11) 91234-5678 / (11) 3123-4567. */
export function formatPhoneBR(raw: string | null | undefined): string {
  const d = normalizePhoneBR(raw);
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw ?? "";
}

const EMAIL_RE = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i;
export function isValidEmail(email: string | null | undefined): boolean {
  const e = (email ?? "").trim().toLowerCase();
  if (!e || e.length > 80) return false;
  return EMAIL_RE.test(e);
}

/** Valida CNPJ pelos dígitos verificadores. */
export function isValidCNPJ(raw: string | null | undefined): boolean {
  const c = onlyDigits(raw);
  if (c.length !== 14 || /^(\d)\1{13}$/.test(c)) return false;
  const calc = (len: number) => {
    let sum = 0;
    let pos = len - 7;
    for (let i = len; i >= 1; i--) {
      sum += Number(c[len - i]) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(c[12]) && calc(13) === Number(c[13]);
}

/** Domínio "cru" de uma URL (pra dedupe). "" se não der. */
export function domainOf(url: string | null | undefined): string {
  const u = (url ?? "").trim();
  if (!u) return "";
  try {
    const withProto = /^https?:\/\//i.test(u) ? u : "https://" + u;
    return new URL(withProto).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

/**
 * Chave de deduplicação de um lead: telefone normalizado > domínio > nome.
 * Dois leads com a mesma chave são a mesma empresa.
 */
export function dedupeKey(input: {
  phone?: string | null;
  website?: string | null;
  name?: string | null;
}): string {
  const phone = normalizePhoneBR(input.phone);
  if (phone) return "p:" + phone;
  const dom = domainOf(input.website);
  if (dom) return "d:" + dom;
  const name = (input.name ?? "").toLowerCase().replace(/\s+/g, " ").trim();
  return name ? "n:" + name : "";
}
