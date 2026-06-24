// Tipos/constantes compartilhados client+server (sem server-only)
export type RewriteMode =
  | "mais_curto"
  | "mais_formal"
  | "mais_persuasivo"
  | "corrigir_gramatica"
  | "traduzir_en";

export const REWRITE_MODES: RewriteMode[] = [
  "mais_curto",
  "mais_formal",
  "mais_persuasivo",
  "corrigir_gramatica",
  "traduzir_en",
];

export const REWRITE_LABELS: Record<RewriteMode, string> = {
  mais_curto: "Mais curto",
  mais_formal: "Mais formal",
  mais_persuasivo: "Mais persuasivo",
  corrigir_gramatica: "Corrigir gramática",
  traduzir_en: "Traduzir EN",
};

export function isRewriteMode(value: unknown): value is RewriteMode {
  return typeof value === "string" && (REWRITE_MODES as string[]).includes(value);
}
