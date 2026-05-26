"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, X, Package, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Início" },
  { href: "/sobre", label: "Quem Somos" },
  {
    label: "Soluções",
    children: [
      { href: "/solucoes", label: "Todas as soluções" },
      { href: "/ecommerce", label: "E-commerce" },
      { href: "/farma", label: "Farma & Manipulação" },
    ],
  },
  { href: "/tecnologia", label: "Tecnologia" },
  { href: "/atendimento", label: "Atendimento" },
  { href: "/abrangencia", label: "Abrangência" },
  { href: "/contato", label: "Contato" },
];

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
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-ink-200 bg-white/90 backdrop-blur-xl shadow-soft"
          : "bg-transparent",
      )}
    >
      <div className="container flex h-20 items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="grid h-11 w-11 place-items-center rounded-xl bg-navy-900 group-hover:bg-navy-800 transition-colors">
            <Package className="h-6 w-6 text-spotorange-500" strokeWidth={2.5} />
          </div>
          <div className="flex flex-col leading-none">
            <span className="font-bold text-lg text-navy-900 tracking-tight">
              Spotlog
            </span>
            <span className="text-[10px] text-ink-500 font-medium tracking-wide uppercase">
              Logística inteligente
            </span>
          </div>
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
                          className="block px-3 py-2 text-sm text-ink-700 hover:bg-navy-50 hover:text-navy-900 rounded-lg transition-colors"
                        >
                          {c.label}
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
                className="px-3 py-2 text-sm font-medium text-ink-700 hover:text-navy-900 transition-colors"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="hidden lg:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/rastreamento">Rastrear</Link>
          </Button>
          <Button variant="soft" size="sm" asChild>
            <Link href="/login">Área do Cliente</Link>
          </Button>
          <Button variant="orange" size="sm" asChild>
            <Link href="/contato">Solicitar proposta</Link>
          </Button>
        </div>

        <button
          className="lg:hidden p-2 text-navy-900"
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
                      className="block px-5 py-2 text-sm text-ink-700 hover:bg-navy-50 rounded-lg"
                    >
                      {c.label}
                    </Link>
                  ))}
                </div>
              ) : (
                <Link
                  key={l.href}
                  href={l.href!}
                  onClick={() => setOpen(false)}
                  className="px-3 py-2 text-sm font-medium text-ink-700 hover:bg-navy-50 rounded-lg"
                >
                  {l.label}
                </Link>
              ),
            )}
            <div className="flex flex-col gap-2 pt-3 border-t border-ink-200 mt-2">
              <Button variant="soft" asChild>
                <Link href="/rastreamento">Rastrear entrega</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/login">Área do Cliente</Link>
              </Button>
              <Button variant="orange" asChild>
                <Link href="/contato">Solicitar proposta</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
