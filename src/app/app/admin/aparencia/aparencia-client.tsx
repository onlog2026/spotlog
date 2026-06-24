"use client";

import * as React from "react";
import { Check, Sun, Moon, Circle, Zap } from "lucide-react";
import { useSpotlogTheme } from "@/components/theme-provider";
import {
  SPOTLOG_THEMES,
  THEME_META,
  type SpotlogTheme,
} from "@/lib/theme-storage";
import { cn } from "@/lib/utils";

const ICONS: Record<SpotlogTheme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  gray: Circle,
  neon: Zap,
};

// Visual de "preview" pseudo-screenshot
function ThemePreview({ theme }: { theme: SpotlogTheme }) {
  const palettes: Record<
    SpotlogTheme,
    { bg: string; card: string; sidebar: string; accent: string; text: string; border: string }
  > = {
    light: {
      bg: "#f5f7fc",
      card: "#ffffff",
      sidebar: "#ffffff",
      accent: "#011960",
      text: "#0b1a3a",
      border: "#e2e8f0",
    },
    dark: {
      bg: "#010d3a",
      card: "#011960",
      sidebar: "#010a2b",
      accent: "#ba0102",
      text: "#e8eafa",
      border: "#0f1d9d",
    },
    gray: {
      bg: "#f1f5f9",
      card: "#ffffff",
      sidebar: "#ffffff",
      accent: "#475569",
      text: "#0f172a",
      border: "#e2e8f0",
    },
    neon: {
      bg: "#010d3a",
      card: "#011960",
      sidebar: "#010825",
      accent: "#ff3a3a",
      text: "#ffffff",
      border: "#1f2bb1",
    },
  };
  const p = palettes[theme];
  return (
    <div
      className="w-full aspect-video rounded-lg overflow-hidden border"
      style={{ background: p.bg, borderColor: p.border }}
    >
      <div className="flex h-full">
        {/* sidebar */}
        <div
          className="w-1/4 flex flex-col gap-1 p-2"
          style={{ background: p.sidebar, borderRight: `1px solid ${p.border}` }}
        >
          <div
            className="h-2 rounded-sm w-3/4"
            style={{ background: p.accent }}
          />
          <div className="h-1.5 rounded-sm w-2/3" style={{ background: p.border }} />
          <div className="h-1.5 rounded-sm w-1/2" style={{ background: p.border }} />
          <div className="mt-1 h-2 rounded-sm w-3/4" style={{ background: theme === "gray" ? "#94a3b8" : "#f97316" }} />
          <div className="h-1.5 rounded-sm w-2/3" style={{ background: p.border }} />
          <div className="mt-1 h-2 rounded-sm w-3/4" style={{ background: theme === "gray" ? "#94a3b8" : "#8b5cf6" }} />
          <div className="h-1.5 rounded-sm w-1/2" style={{ background: p.border }} />
        </div>
        {/* content */}
        <div className="flex-1 p-2 space-y-2">
          <div className="flex gap-2">
            <div
              className="flex-1 h-10 rounded-md"
              style={{
                background: p.card,
                border: `1px solid ${p.border}`,
                boxShadow:
                  theme === "neon" ? `0 0 12px ${p.accent}55` : undefined,
              }}
            />
            <div
              className="flex-1 h-10 rounded-md"
              style={{
                background: p.card,
                border: `1px solid ${p.border}`,
                boxShadow:
                  theme === "neon"
                    ? "0 0 12px rgba(59,130,246,0.45)"
                    : undefined,
              }}
            />
            <div
              className="flex-1 h-10 rounded-md"
              style={{
                background: p.card,
                border: `1px solid ${p.border}`,
                boxShadow:
                  theme === "neon"
                    ? "0 0 12px rgba(139,92,246,0.45)"
                    : undefined,
              }}
            />
          </div>
          <div
            className="h-20 rounded-md"
            style={{
              background: p.card,
              border: `1px solid ${p.border}`,
              boxShadow: theme === "neon" ? `0 0 16px ${p.accent}55` : undefined,
            }}
          >
            <div className="p-2 space-y-1">
              <div
                className="h-1.5 w-1/2 rounded-sm"
                style={{ background: p.text, opacity: 0.6 }}
              />
              <div
                className="h-1.5 w-3/4 rounded-sm"
                style={{ background: p.text, opacity: 0.3 }}
              />
              <div
                className="h-1.5 w-2/3 rounded-sm"
                style={{ background: p.text, opacity: 0.3 }}
              />
              <div
                className="mt-2 h-3 w-16 rounded-sm"
                style={{ background: p.accent }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function AparenciaClient({
  initialTheme: _initialTheme,
}: {
  initialTheme?: string | null;
}) {
  const { theme, setTheme } = useSpotlogTheme();

  async function persistRemote(t: SpotlogTheme) {
    try {
      await fetch("/api/me/theme", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
      });
    } catch {
      // sem rede / coluna inexistente — ok, localStorage persiste
    }
  }

  function pick(t: SpotlogTheme) {
    setTheme(t);
    persistRemote(t);
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-6">
      {SPOTLOG_THEMES.map((t) => {
        const meta = THEME_META[t];
        const Icon = ICONS[t];
        const active = t === theme;
        return (
          <button
            key={t}
            type="button"
            onClick={() => pick(t)}
            className={cn(
              "group relative text-left rounded-2xl border-2 p-5 transition-all",
              "bg-card hover:border-primary/60",
              active
                ? "border-primary ring-2 ring-primary/30 shadow-lg"
                : "border-border",
            )}
          >
            {active && (
              <div className="absolute top-3 right-3 h-7 w-7 rounded-full bg-primary text-primary-foreground grid place-items-center">
                <Check className="h-4 w-4" />
              </div>
            )}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="h-10 w-10 rounded-xl grid place-items-center text-white"
                style={{ background: meta.accent }}
              >
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="text-lg font-bold text-foreground">
                  {meta.label}
                </div>
                <div className="text-xs text-muted-foreground">
                  {meta.description}
                </div>
              </div>
            </div>
            <ThemePreview theme={t} />
            <div className="mt-3 flex items-center gap-1.5">
              {meta.swatch.map((c, i) => (
                <span
                  key={i}
                  className="h-5 w-5 rounded-full border border-black/10"
                  style={{ background: c }}
                  title={c}
                />
              ))}
            </div>
          </button>
        );
      })}

      <div className="md:col-span-2 rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
        Dica: a escolha é aplicada imediatamente e salva no seu navegador. Se a
        coluna <code>profiles.theme_preference</code> existir no banco, também
        é sincronizada para todos os seus dispositivos. Caso contrário, o tema
        permanece somente local — sem erro.
      </div>
    </div>
  );
}
