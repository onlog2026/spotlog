"use client";

import * as React from "react";
import {
  applyTheme,
  readTheme,
  writeTheme,
  isSpotlogTheme,
  type SpotlogTheme,
} from "@/lib/theme-storage";

type ThemeContextValue = {
  theme: SpotlogTheme;
  setTheme: (t: SpotlogTheme) => void;
};

const ThemeContext = React.createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
});

export function useSpotlogTheme() {
  return React.useContext(ThemeContext);
}

/**
 * ThemeProvider 4-cores do Spotlog (light / dark / gray / neon).
 *
 * - Lê o tema inicial do localStorage (cliente) ou usa "light".
 * - Sincroniza `<html data-theme="...">` e classe `.dark` para Tailwind.
 * - `initialTheme` opcional: vem do perfil do usuário (server-side).
 */
export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: React.ReactNode;
  initialTheme?: string | null;
}) {
  const [theme, setThemeState] = React.useState<SpotlogTheme>(() => {
    if (isSpotlogTheme(initialTheme)) return initialTheme;
    return "light";
  });

  // Bootstrap no cliente: respeita localStorage só se nada veio do servidor.
  React.useEffect(() => {
    if (!isSpotlogTheme(initialTheme)) {
      const stored = readTheme();
      setThemeState(stored);
      applyTheme(stored);
    } else {
      applyTheme(initialTheme);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = React.useCallback((t: SpotlogTheme) => {
    setThemeState(t);
    writeTheme(t);
    applyTheme(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
