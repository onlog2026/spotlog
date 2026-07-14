import type { ReactNode } from "react";

/**
 * Renderiza um título com trechos entre *asteriscos* destacados.
 * Ex.: "Um processo *simples*" → "simples" sai com a classe de destaque.
 * Usável em server e client components (é função pura).
 */
export function HeadingHL({
  text,
  hl = "text-gradient-spotlog",
}: {
  text: string;
  hl?: string;
}): ReactNode {
  return text
    .split(/(\*[^*]+\*)/g)
    .filter(Boolean)
    .map((p, i) =>
      p.startsWith("*") && p.endsWith("*") ? (
        <span key={i} className={hl}>
          {p.slice(1, -1)}
        </span>
      ) : (
        <span key={i}>{p}</span>
      ),
    );
}
