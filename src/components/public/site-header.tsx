"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, ChevronDown, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SpotlogLogo } from "@/components/brand/spotlog-logo";
import { cn } from "@/lib/utils";

type NavLink = {
  href?: string;
  label: string;
  badge?: string;
  children?: { href: string; label: string; badge?: string }[];
};

const links: NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Quem Somos" },
  {
    label: "Soluções",
    children: [
      { href: "/solucoes", label: "Todas as soluções" },
      { href: "/ecommerce", label: "E-commerce Express" },
      { href: "/farma", label: "Farma — AFE Anvisa", badge: "AFE" },
    ],
  },
  { href: "/farma", label: "Farma", badge: "AFE" },
  { href: "/atendimento", label: "Atendimento" },
  { href: "/abrangencia", label: "Abrangência" },
  { href: "/cases", label: "Cases" },
  { href: "/blog", label: "Blog" },
  { href: "/contato", label: "Contato" },
];

const TRACK_URL =
  "https://octatracking.com.br/prerastreio?logo=aHR0cHM6Ly9zaXN0ZW1hLnNwb3Rsb2cuY29tLmJyL2ltYWdlcy9zcG90bG9nL2xvZ29zL2xvZ282MDEtNDA2LnBuZw==";

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [openSub, setOpenSub] = useState<string | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      id="top"
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-ink-200 bg-white/90 backdrop-blur-xl shadow-soft"
          : "bg-transparent",
      )}
    >
      <div className="container flex h-20 items-center justify-between gap-2">
        <Link href="/" className="group shrink-0 min-w-0">
          <SpotlogLogo variant="full" />
        </Link>

        <nav className="hidden lg:flex items-center gap-1">
          {links.map((l) =>
            l.children ? (
              <div
                key={l.label}
                className="relative"
                onMouseEnter={() => setOpenSub(l.label)}
                onMouseLeave={() => setOpenSub(null)}
              >
                <button className="px-3 py-2 text-sm font-medium text-ink-700 hover:text-navy-900 transition-colors flex items-center gap-1">
                  {l.label}
                  <ChevronDown className="h-3 w-3" />
                </button>
                {openSub === l.label && (
                  <div className="absolute top-full left-0 pt-2 min-w-[220px]">
                    <div className="bg-white rounded-xl shadow-card border border-ink-100 p-2">
                      {l.children.map((c) => (
                        <Link
                          key={c.href}
                          href={c.href}
                          className="px-3 py-2 text-sm text-ink-700 hover:bg-navy-50 hover:text-navy-900 rounded-lg transition-colors flex items-center justify-between gap-2"
                        >
                          <span>{c.label}</span>
                          {c.badge && (
                            <span className="text-[9px] font-bold uppercase tracking-wider bg-spotorange-500 text-white px-1.5 py-0.5 rounded">
                              {c.badge}
                            </span>
                          )}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                key={l.href}
                href={l.href!}
                className="px-3 py-2 text-sm font-medium text-ink-700 hover:text-navy-900 transition-colors inline-flex items-center gap-1.5"
              >
                {l.label}
                {l.badge && (
                  <span className="text-[9px] font-bold uppercase tracking-wider bg-spotorange-500 text-white px-1.5 py-0.5 rounded">
                    {l.badge}
                  </span>
                )}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          {/* CTA destacado: Acompanhe seu pedido (vermelho oficial) */}
          <a
            href={TRACK_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-spotorange-500 hover:bg-spotorange-600 text-white px-4 py-2 text-sm font-bold shadow-orange-glow transition-all hover:scale-[1.03]"
          >
            <Package className="h-4 w-4" />
            Acompanhe seu pedido
          </a>
          <Button variant="soft" size="sm" asChild>
            <Link href="/login">Área do Cliente</Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/contato">Solicitar proposta</Link>
          </Button>
        </div>

        {/* CTA Acompanhe seu pedido — compacto mobile (sempre visível) */}
        <a
          href={TRACK_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="lg:hidden inline-flex items-center gap-1.5 rounded-full bg-spotorange-500 hover:bg-spotorange-600 text-white px-3 py-2 text-xs font-bold shadow-orange-glow shrink-0"
          aria-label="Acompanhe seu pedido"
        >
          <Package className="h-3.5 w-3.5" />
          <span className="hidden xs:inline sm:inline">Acompanhar</span>
        </a>

        <button
          className="lg:hidden p-2 text-navy-900 shrink-0"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-ink-200 bg-white">
          <div className="container py-4 flex flex-col gap-1 max-h-[80vh] overflow-y-auto">
            {links.map((l) =>
              l.children ? (
                <div key={l.label}>
                  <div className="px-3 py-2 text-xs font-semibold text-ink-500 uppercase tracking-wider">
                    {l.label}
                  </div>
                  {l.children.map((c) => (
                    <Link
                      key={c.href}
                      href={c.href}
                      onClick={() => setOpen(false)}
                      className="px-5 py-2 text-sm text-ink-700 hover:bg-navy-50 rounded-lg flex items-center justify-between gap-2"
                    >
                      <span>{c.label}</span>
                      {c.badge && (
                        <span className="text-[9px] font-bold uppercase tracking-wider bg-spotorange-500 text-white px-1.5 py-0.5 rounded">
                          {c.badge}
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={l.href}
                  href={l.href!}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-ink-700 hover:bg-navy-50 rounded-lg flex items-center gap-2"
                >
                  <span>{l.label}</span>
                  {l.badge && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-spotorange-500 text-white px-1.5 py-0.5 rounded">
                      {l.badge}
                    </span>
                  )}
                </Link>
              ),
            )}
            <div className="flex flex-col gap-2 pt-3 border-t border-ink-200 mt-2">
              <a
                href={TRACK_URL}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-spotorange-500 hover:bg-spotorange-600 text-white px-4 py-3 text-sm font-bold shadow-orange-glow"
              >
                <Package className="h-4 w-4" />
                Acompanhe seu pedido
              </a>
              <Button variant="outline" asChild>
                <Link href="/login" onClick={() => setOpen(false)}>Área do Cliente</Link>
              </Button>
              <Button variant="orange" asChild>
                <Link href="/contato" onClick={() => setOpen(false)}>Solicitar proposta</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
