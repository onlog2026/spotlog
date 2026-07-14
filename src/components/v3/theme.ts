// Tokens globais de tema do site (editáveis no painel → aplicados no front).
// Os defaults batem com o :root do spotlog-v3.css, então nada muda até editar.

export type ThemeTokens = {
  pageBg: string; // fundo da página
  cardBg: string; // fundo de cards/superfícies
  primary: string; // cor de ação / CTA (vermelho)
  primaryDark: string;
  secondary: string; // azul-marinho institucional
  secondaryDeep: string;
  textStrong: string; // títulos
  textBody: string; // parágrafos
  textMuted: string; // legendas
  radius: number; // raio de borda base (px)
  headingFont: string; // chave de fonte para títulos
  bodyFont: string; // chave de fonte para corpo
  baseFontPx: number; // tamanho base do corpo (px)
  logoUrl: string; // logo do PAINEL ADMIN (cabeçalho do app). Vazio = logo padrão.
  logoSize: number; // altura do logo em px (aplica no site e no app)
  faviconUrl: string; // favicon do PAINEL ADMIN (aba do navegador no /app)
  logoUrlSite: string; // logo do SITE público / home (vazio = usa o do admin)
  faviconUrlSite: string; // favicon do SITE público / home (vazio = usa o do admin)
};

export const DEFAULT_THEME: ThemeTokens = {
  pageBg: "#F4F5FA",
  cardBg: "#FFFFFF",
  primary: "#E11B22",
  primaryDark: "#B3141A",
  secondary: "#14225A",
  secondaryDeep: "#0C1640",
  textStrong: "#121A33",
  textBody: "#38416A",
  textMuted: "#6B739A",
  radius: 18,
  headingFont: "display",
  bodyFont: "sans",
  baseFontPx: 16,
  logoUrl: "",
  logoSize: 46,
  faviconUrl: "",
  logoUrlSite: "",
  faviconUrlSite: "",
};

const FONT_STACKS: Record<string, string> = {
  display: "'Bricolage Grotesque','Geist',sans-serif",
  sans: "'Geist',system-ui,sans-serif",
  serif: "Georgia,'Times New Roman',serif",
  mono: "'JetBrains Mono',ui-monospace,monospace",
  handwrite: "'Caveat',cursive",
};

export const THEME_FONT_OPTIONS: { value: string; label: string }[] = [
  { value: "display", label: "Bricolage (display)" },
  { value: "sans", label: "Geist (sans)" },
  { value: "serif", label: "Serifada (Georgia)" },
  { value: "mono", label: "Monoespaçada" },
  { value: "handwrite", label: "Manuscrita (Caveat)" },
];

export function mergeTheme(partial?: Partial<ThemeTokens> | null): ThemeTokens {
  return { ...DEFAULT_THEME, ...(partial ?? {}) };
}

/** Gera o CSS que sobrescreve as variáveis do design, escopado em .v3-root. */
export function buildThemeCss(t: ThemeTokens): string {
  const headFont = FONT_STACKS[t.headingFont] ?? FONT_STACKS.display;
  const bodyFont = FONT_STACKS[t.bodyFont] ?? FONT_STACKS.sans;
  const r = t.radius;
  return `.v3-root{
  --bg:${t.pageBg};
  --bg-2:${t.pageBg};
  --paper:${t.cardBg};
  --red:${t.primary};
  --red-dark:${t.primaryDark};
  --navy:${t.secondary};
  --navy-2:${t.secondary};
  --navy-deep:${t.secondaryDeep};
  --ink:${t.textStrong};
  --ink-soft:${t.textBody};
  --ink-mute:${t.textMuted};
  --radius-sm:${Math.max(6, r - 6)}px;
  --radius:${r}px;
  --radius-lg:${r + 10}px;
  --radius-xl:${r + 22}px;
}
.v3-root{ font-size:${t.baseFontPx}px; }
.v3-root, .v3-root .sans{ font-family:${bodyFont}; }
.v3-root h1, .v3-root h2, .v3-root h3, .v3-root h4, .v3-root .serif, .v3-root .serif-italic{ font-family:${headFont}; }`;
}
