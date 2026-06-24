"use client";

import * as React from "react";
import { Palette, Check, Sun, Moon, Circle, Zap } from "lucide-react";
import { useSpotlogTheme } from "@/components/theme-provider";
import {
  SPOTLOG_THEMES,
  THEME_META,
  type SpotlogTheme,
} from "@/lib/theme-storage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const ICONS: Record<SpotlogTheme, React.ComponentType<{ className?: string }>> = {
  light: Sun,
  dark: Moon,
  gray: Circle,
  neon: Zap,
};

export function ThemeSwitcher({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  const { theme, setTheme } = useSpotlogTheme();
  const ActiveIcon = ICONS[theme];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 px-2.5 h-8 rounded-md text-xs font-medium",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors",
            "border border-border",
            className,
          )}
          aria-label="Trocar tema"
          title="Trocar tema"
        >
          <ActiveIcon className="h-3.5 w-3.5" />
          {!compact && <span>{THEME_META[theme].label}</span>}
          <Palette className="h-3 w-3 opacity-70" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
          Tema do painel
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {SPOTLOG_THEMES.map((t) => {
          const Icon = ICONS[t];
          const meta = THEME_META[t];
          const active = t === theme;
          return (
            <DropdownMenuItem
              key={t}
              onSelect={(e) => {
                e.preventDefault();
                setTheme(t);
              }}
              className="flex items-center gap-3 cursor-pointer"
            >
              <div className="flex gap-0.5">
                {meta.swatch.slice(0, 3).map((c, i) => (
                  <span
                    key={i}
                    className="h-4 w-2 rounded-sm border border-black/10"
                    style={{ background: c }}
                  />
                ))}
              </div>
              <Icon className="h-3.5 w-3.5 shrink-0" />
              <span className="flex-1 text-sm">{meta.label}</span>
              {active && <Check className="h-3.5 w-3.5 text-primary" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
