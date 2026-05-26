import Link from "next/link";
import { Package, Mail, MapPin, Phone, Linkedin, Instagram, Facebook } from "lucide-react";

const linksGroups = {
  Soluções: [
    { href: "/ecommerce", label: "E-commerce" },
    { href: "/farma", label: "Farma & Manipulação" },
    { href: "/solucoes", label: "Coletas Programadas" },
    { href: "/solucoes", label: "Rotas Dedicadas" },
    { href: "/solucoes", label: "Logística Reversa" },
  ],
  Empresa: [
    { href: "/sobre", label: "Quem Somos" },
    { href: "/tecnologia", label: "Tecnologia" },
    { href: "/atendimento", label: "Atendimento" },
    { href: "/abrangencia", label: "Abrangência" },
    { href: "/blog", label: "Blog" },
  ],
  Atendimento: [
    { href: "/rastreamento", label: "Rastrear entrega" },
    { href: "/login", label: "Área do Cliente" },
    { href: "/contato", label: "Solicitar proposta" },
    { href: "/contato", label: "Fale conosco" },
  ],
  Legal: [
    { href: "/privacidade", label: "Privacidade" },
    { href: "/termos", label: "Termos de uso" },
    { href: "/lgpd", label: "LGPD" },
  ],
};

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="container relative py-20">
        <div className="grid lg:grid-cols-12 gap-10 mb-16">
          <div className="lg:col-span-4">
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-white">
                <Package className="h-6 w-6 text-spotorange-500" strokeWidth={2.5} />
              </div>
              <div className="flex flex-col leading-none">
                <span className="font-bold text-xl tracking-tight">Spotlog</span>
                <span className="text-[10px] text-ink-400 font-medium tracking-wide uppercase">
                  Logística inteligente
                </span>
              </div>
            </Link>
            <p className="text-sm text-ink-300 leading-relaxed max-w-sm mb-6">
              Logística inteligente para empresas que precisam entregar com
              controle, agilidade e confiança. E-commerce, farma, manipulação,
              correlatos e operações B2B com rastreabilidade ponta a ponta.
            </p>
            <div className="space-y-2.5 text-sm text-ink-300">
              <a href="mailto:contato@spotlog.com.br" className="flex items-center gap-2.5 hover:text-white transition-colors">
                <Mail className="h-4 w-4 text-spotorange-400" />
                contato@spotlog.com.br
              </a>
              <a href="tel:+551100000000" className="flex items-center gap-2.5 hover:text-white transition-colors">
                <Phone className="h-4 w-4 text-spotorange-400" />
                (11) 0000-0000
              </a>
              <div className="flex items-start gap-2.5">
                <MapPin className="h-4 w-4 text-spotorange-400 mt-0.5" />
                <span>São Paulo, SP — Brasil</span>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              {[Linkedin, Instagram, Facebook].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="grid h-10 w-10 place-items-center rounded-lg bg-white/5 hover:bg-spotorange-500 text-ink-300 hover:text-white transition-colors"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div className="lg:col-span-8 grid sm:grid-cols-2 md:grid-cols-4 gap-8">
            {Object.entries(linksGroups).map(([title, items]) => (
              <div key={title}>
                <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                  {title}
                </h4>
                <ul className="space-y-2.5">
                  {items.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-sm text-ink-300 hover:text-white transition-colors"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <p className="text-xs text-ink-400">
            © {new Date().getFullYear()} Spotlog — Logística inteligente. Todos os direitos reservados.
          </p>
          <p className="text-xs text-ink-400">
            Feito com 🧡 no Brasil.
          </p>
        </div>
      </div>
    </footer>
  );
}
