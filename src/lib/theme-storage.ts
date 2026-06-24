"use client";

/**
 * Persistência local do tema escolhido pelo usuário.
 * Server-side, o tema preferido vem em `ctx.user.theme_preference` (best-effort).
 */
export type SpotlogTheme = "light" | "dark" | "gray" | "neon";

const STORAGE_KEY = "spotlog:theme";
export const SPOTLOG_THEMES: SpotlogTheme[] = ["light", "dark", "gray", "neon"];

export function isSpotlogTheme(v: unknown): v is SpotlogTheme {
  return typeof v === "string" && SPOTLOG_THEMES.includes(v as SpotlogTheme);
}

export function readTheme(): SpotlogTheme {
  if (typeof window === "undefined") return "light";
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return isSpotlogTheme(v) ? v : "light";
  } catch {
    return "light";
  }
}

export function writeTheme(theme: SpotlogTheme) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // ignore
  }
}

export function applyTheme(theme: SpotlogTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  // Compatibilidade com utilitários `dark:` do Tailwind
  if (theme === "dark" || theme === "neon") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

export const THEME_META: Record<
  SpotlogTheme,
  { label: string; description: string; swatch: string[]; accent: string }
> = {
  light: {
    label: "Claro",
    description: "Fundo claro com o azul e o vermelho institucionais.",
    swatch: ["#ffffff", "#f1f4fb", "#011960", "#ba0102"],
    accent: "#011960",
  },
  dark: {
    label: "Escuro",
    description: "Navy profundo para foco em telas com bastante dado.",
    swatch: ["#010d3a", "#011960", "#1f2bb1", "#ba0102"],
    accent: "#ba0102",
  },
  gray: {
    label: "Cinza",
    description: "Minimalista — tons neutros, sem cores vivas.",
    swatch: ["#f8fafc", "#e5e7eb", "#94a3b8", "#1f2937"],
    accent: "#1f2937",
  },
  neon: {
    label: "Azul Neon",
    description: "Navy escuro com glows neon por categoria.",
    swatch: ["#010d3a", "#011960", "#ff3a3a", "#8b5cf6"],
    accent: "#ff3a3a",
  },
};
