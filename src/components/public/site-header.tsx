"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Início" },
  { href: "/recursos", label: "Recursos" },
  { href: "/como-funciona", label: "Como funciona" },
  { href: "/precos", label: "Preços" },
  { href: "/contato", label: "Contato" },
];

export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-white/10 bg-background/70 backdrop-blur-xl"
          : "bg-transparent",
      )}
    >
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-bold text-lg">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand shadow-lg shadow-brand-500/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-gradient">Spotlog</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button variant="gradient" size="sm" asChild>
            <Link href="/cadastro">Testar grátis</Link>
          </Button>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-background/95 backdrop-blur-xl">
          <div className="container py-4 flex flex-col gap-2">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded-md text-sm hover:bg-white/5"
              >
                {l.label}
              </Link>
            ))}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <Button variant="ghost" className="flex-1" asChild>
                <Link href="/login">Entrar</Link>
              </Button>
              <Button variant="gradient" className="flex-1" asChild>
                <Link href="/cadastro">Testar grátis</Link>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
