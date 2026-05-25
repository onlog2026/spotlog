import Link from "next/link";
import { Sparkles, Github, Linkedin, Twitter } from "lucide-react";

const footerLinks = {
  Produto: [
    { href: "/recursos", label: "Recursos" },
    { href: "/precos", label: "Preços" },
    { href: "/como-funciona", label: "Como funciona" },
    { href: "/cadastro", label: "Testar grátis" },
  ],
  Empresa: [
    { href: "/sobre", label: "Sobre" },
    { href: "/contato", label: "Contato" },
    { href: "/blog", label: "Blog" },
  ],
  Legal: [
    { href: "/privacidade", label: "Política de privacidade" },
    { href: "/termos", label: "Termos de uso" },
    { href: "/lgpd", label: "LGPD" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-background">
      <div className="container py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link
              href="/"
              className="flex items-center gap-2 font-bold text-lg mb-4"
            >
              <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-brand">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <span className="text-gradient">Spotlog</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs">
              A plataforma de prospecção, CRM e propostas com agente IA pra
              times comerciais que querem previsibilidade.
            </p>
            <div className="flex gap-2 mt-4">
              <Link
                href="#"
                className="p-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground"
              >
                <Linkedin className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="p-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground"
              >
                <Twitter className="h-4 w-4" />
              </Link>
              <Link
                href="#"
                className="p-2 rounded-md hover:bg-white/5 text-muted-foreground hover:text-foreground"
              >
                <Github className="h-4 w-4" />
              </Link>
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, items]) => (
            <div key={title}>
              <h4 className="font-semibold mb-3 text-sm">{title}</h4>
              <ul className="space-y-2">
                {items.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Spotlog — Todos os direitos reservados.
          </p>
          <p className="text-xs text-muted-foreground">
            Feito com 💙 no Brasil.
          </p>
        </div>
      </div>
    </footer>
  );
}
