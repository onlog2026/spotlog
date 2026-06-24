"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

type Tab = {
  href: string;
  label: string;
  match: string;
  children?: { href: string; label: string }[];
};

const TABS: Tab[] = [
  { href: "/app/marketing", label: "Dashboard", match: "/app/marketing" },
  {
    href: "/app/marketing/atrair/social",
    label: "Atrair",
    match: "/app/marketing/atrair",
    children: [
      { href: "/app/marketing/atrair/social", label: "Postagens em mídias sociais" },
      { href: "/app/marketing/atrair/ads", label: "Lead Ads" },
      { href: "/app/marketing/atrair/publicos", label: "Públicos para anúncios" },
      { href: "/app/marketing/atrair/seo", label: "Otimização de páginas (SEO)" },
      { href: "/app/marketing/atrair/link-bio", label: "Link da bio" },
    ],
  },
  {
    href: "/app/marketing/converter/landing",
    label: "Converter",
    match: "/app/marketing/converter",
    children: [
      { href: "/app/marketing/converter/landing", label: "Landing Pages" },
      { href: "/app/marketing/converter/formularios", label: "Formulários" },
      { href: "/app/marketing/converter/popups", label: "Pop-ups" },
      { href: "/app/marketing/converter/campos", label: "Campos personalizados" },
      { href: "/app/marketing/converter/whatsapp", label: "Botões de WhatsApp" },
      { href: "/app/marketing/converter/push", label: "Web Push" },
    ],
  },
  { href: "/app/marketing/relacionar", label: "Relacionar", match: "/app/marketing/relacionar" },
  { href: "/app/marketing/analisar", label: "Analisar", match: "/app/marketing/analisar" },
  { href: "/app/pipeline", label: "Vender", match: "/app/pipeline" },
];

export function MarketingTabs() {
  const pathname = usePathname() ?? "";
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="relative border-b border-white/10">
      <div className="flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {TABS.map((t) => {
          const isExact = t.match === "/app/marketing";
          const active = isExact ? pathname === t.match : pathname.startsWith(t.match);
          const isOpen = open === t.href;
          if (!t.children) {
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "px-4 h-11 inline-flex items-center text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-[#BA0102] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-white/20",
                )}
              >
                {t.label}
              </Link>
            );
          }
          return (
            <div
              key={t.href}
              className="relative"
              onMouseLeave={() => setOpen(null)}
            >
              <button
                onMouseEnter={() => setOpen(t.href)}
                onClick={() => setOpen(isOpen ? null : t.href)}
                className={cn(
                  "px-4 h-11 inline-flex items-center gap-1 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
                  active
                    ? "border-[#BA0102] text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-white/20",
                )}
              >
                {t.label}
                <ChevronDown className="h-3 w-3" />
              </button>
              {isOpen && (
                <div className="absolute left-0 top-full z-30 mt-0 w-64 rounded-md border border-white/10 bg-card/95 backdrop-blur-xl shadow-xl py-1">
                  {t.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={() => setOpen(null)}
                      className="block px-3 py-2 text-xs hover:bg-white/5"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
