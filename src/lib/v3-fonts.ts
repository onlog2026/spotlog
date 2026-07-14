import { Bricolage_Grotesque, Geist, JetBrains_Mono, Caveat } from "next/font/google";

/**
 * Fontes do design editorial v3 — self-hospedadas via next/font (elimina o
 * <link rel="stylesheet"> externo ao Google Fonts que bloqueava a renderização).
 * spotlog-v3.css referencia os nomes das famílias diretamente (ex: 'Bricolage
 * Grotesque'), então basta injetar os @font-face aplicando a className em
 * qualquer elemento — sem precisar de CSS var.
 */
export const bricolageGrotesque = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export const geist = Geist({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const caveat = Caveat({
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const v3FontsClassName = `${bricolageGrotesque.className} ${geist.className} ${jetbrainsMono.className} ${caveat.className}`;
