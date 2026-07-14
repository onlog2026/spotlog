import type { CSSProperties } from "react";
import type { CardContent } from "@/components/v3/cms";

/**
 * Tipografia por card, editável no painel (metadata.style).
 * Só aplica o que foi definido — campos vazios mantêm o design padrão.
 */
export type CardStyle = {
  titleColor?: string;
  titleSize?: number;
  titleWeight?: string;
  titleFont?: string;
  titleItalic?: boolean;
  titleAlign?: string;
  descColor?: string;
  descSize?: number;
  descWeight?: string;
  descFont?: string;
  descItalic?: boolean;
  descAlign?: string;
};

const FONT_STACKS: Record<string, string> = {
  display: "'Bricolage Grotesque','Geist',sans-serif",
  sans: "'Geist',system-ui,sans-serif",
  mono: "'JetBrains Mono',ui-monospace,monospace",
  serif: "Georgia,'Times New Roman',serif",
  handwrite: "'Caveat',cursive",
};

export const FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Padrão (do design)" },
  { value: "display", label: "Display (Bricolage)" },
  { value: "sans", label: "Sans (Geist)" },
  { value: "serif", label: "Serifada (Georgia)" },
  { value: "mono", label: "Monoespaçada" },
  { value: "handwrite", label: "Manuscrita (Caveat)" },
];

export const WEIGHT_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Padrão" },
  { value: "400", label: "Normal" },
  { value: "500", label: "Médio" },
  { value: "600", label: "Semi-negrito" },
  { value: "700", label: "Negrito" },
  { value: "800", label: "Extra-negrito" },
];

export const ALIGN_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Padrão" },
  { value: "left", label: "Esquerda" },
  { value: "center", label: "Centro" },
  { value: "right", label: "Direita" },
];

function readStyle(card?: CardContent): CardStyle {
  return ((card?.metadata?.style as CardStyle | undefined) ?? {}) as CardStyle;
}

export function cardTitleStyle(card?: CardContent): CSSProperties {
  const s = readStyle(card);
  const out: CSSProperties = {};
  if (s.titleColor) out.color = s.titleColor;
  if (s.titleSize) out.fontSize = `${s.titleSize}px`;
  if (s.titleWeight) out.fontWeight = s.titleWeight;
  if (s.titleFont && FONT_STACKS[s.titleFont]) out.fontFamily = FONT_STACKS[s.titleFont];
  if (s.titleItalic) out.fontStyle = "italic";
  if (s.titleAlign) out.textAlign = s.titleAlign as CSSProperties["textAlign"];
  return out;
}

export function cardDescStyle(card?: CardContent): CSSProperties {
  const s = readStyle(card);
  const out: CSSProperties = {};
  if (s.descColor) out.color = s.descColor;
  if (s.descSize) out.fontSize = `${s.descSize}px`;
  if (s.descWeight) out.fontWeight = s.descWeight;
  if (s.descFont && FONT_STACKS[s.descFont]) out.fontFamily = FONT_STACKS[s.descFont];
  if (s.descItalic) out.fontStyle = "italic";
  if (s.descAlign) out.textAlign = s.descAlign as CSSProperties["textAlign"];
  return out;
}
