import Link from "next/link";
import Image from "next/image";
import {
  Mail, MapPin, Phone, Linkedin, Instagram, Facebook,
  ArrowRight, ShieldCheck, ChevronUp, Clock, Truck, Sparkles,
  Headphones,
} from "lucide-react";
import { SpotlogLogo } from "@/components/brand/spotlog-logo";
import { Button } from "@/components/ui/button";

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
    { href: "/cases", label: "Cases" },
  ],
  Atendimento: [
    { href: "https://octatracking.com.br/prerastreio?logo=aHR0cHM6Ly9zaXN0ZW1hLnNwb3Rsb2cuY29tLmJyL2ltYWdlcy9zcG90bG9nL2xvZ29zL2xvZ282MDEtNDA2LnBuZw==", label: "Rastrear entrega", external: true },
    { href: "/login", label: "Área do Cliente" },
    { href: "/contato", label: "Solicitar proposta" },
    { href: "/contato", label: "Fale conosco" },
    { href: "/api-docs", label: "API para parceiros" },
  ],
  Legal: [
    { href: "/privacidade", label: "Privacidade" },
    { href: "/termos", label: "Termos de uso" },
    { href: "/lgpd", label: "LGPD" },
  ],
};

const emails = [
  { label: "Contato Geral", value: "contato@spotlogoficial.com.br" },
  { label: "Comercial", value: "comercial@spotlogoficial.com.br" },
  { label: "SAC", value: "sac@spotlogoficial.com.br" },
];

const segmentos = [
  "E-commerce", "Farma & Manipulação", "Dermocosméticos",
  "Suplementos", "Correlatos", "B2B Operacional",
];

const cidadesAtendidas = [
  "São Paulo Capital", "Grande SP — ABC", "Grande SP — Zona Norte",
  "Grande SP — Zona Sul", "Grande SP — Zona Leste", "Grande SP — Zona Oeste",
  "Guarulhos", "Osasco", "Barueri", "Campinas",
];

export function SiteFooter() {
  return (
    <footer className="bg-navy-950 text-white relative overflow-hidden">
      {/* Voltar ao topo */}
      <a
        href="#top"
        className="relative block w-full bg-white/5 hover:bg-spotorange-500/20 border-b border-white/10 transition-colors text-center py-3 group"
        aria-label="Voltar ao topo"
      >
        <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-white/80 group-hover:text-white">
          <ChevronUp className="h-4 w-4 transition-transform group-hover:-translate-y-0.5" />
          Voltar ao topo
        </span>
      </a>

      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-spotorange-500/10 rounded-full -translate-y-32 translate-x-32 blur-3xl" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-navy-700/30 rounded-full translate-y-32 -translate-x-32 blur-3xl" />

      {/* CTA strip */}
      <div className="container relative pt-14">
        <div className="bg-white rounded-3xl p-6 sm:p-8 lg:p-10 shadow-card grid md:grid-cols-3 gap-6 items-center mb-14">
          <div className="md:col-span-2">
            <h3 className="text-2xl lg:text-3xl font-bold text-navy-950 mb-2">
              Vamos otimizar a sua logística?
            </h3>
            <p className="text-ink-600">
              Conta seu segmento, volume e região. Em até 1 dia útil
              um especialista responde com proposta sob medida.
            </p>
          </div>
          <div className="md:text-right">
            <Button variant="orange" size="xl" asChild>
              <Link href="/contato">
                Solicitar proposta
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container relative pb-12">
        {/* GRID PRINCIPAL — 12 colunas, sem espaço vazio */}
        <div className="grid lg:grid-cols-12 gap-8 mb-12">
          {/* COLUNA 1 — LOGO + CONTATO + ANVISA + SOCIAL (col-span-4) */}
          <div className="lg:col-span-4 space-y-5">
            <Link href="/" className="inline-block">
              <SpotlogLogo variant="full" light />
            </Link>
            <p className="text-sm text-ink-300 leading-relaxed">
              Logística inteligente para empresas que precisam entregar com
              controle, agilidade e confiança. E-commerce, farma, manipulação,
              correlatos e operações B2B com rastreabilidade ponta a ponta.
            </p>

            {/* Card de contato — vidro fosco sobre navy (sem fundo branco) */}
            <div className="rounded-2xl p-5 space-y-3 w-full bg-white/[0.04] border border-white/10 backdrop-blur-sm">
              {emails.map((e) => (
                <a
                  key={e.value}
                  href={`mailto:${e.value}`}
                  className="flex items-center gap-3 group hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 group-hover:bg-spotorange-500 transition-colors shrink-0">
                    <Mail className="h-4 w-4 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[10px] uppercase tracking-wider font-bold text-ink-300">{e.label}</div>
                    <div className="text-sm font-semibold text-white break-all group-hover:text-spotorange-300 transition-colors">{e.value}</div>
                  </div>
                </a>
              ))}

              <a
                href="tel:+5511978348288"
                className="flex items-center gap-3 group hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 group-hover:bg-spotorange-500 transition-colors shrink-0">
                  <Phone className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-ink-300">Telefone / WhatsApp</div>
                  <div className="text-sm font-semibold text-white group-hover:text-spotorange-300 transition-colors">(11) 97834-8288</div>
                </div>
              </a>

              <a
                href="https://instagram.com/spotlogoficial"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 group hover:bg-white/5 -mx-2 px-2 py-1 rounded-lg transition-colors"
              >
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 group-hover:bg-spotorange-500 transition-colors shrink-0">
                  <Instagram className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-ink-300">Instagram</div>
                  <div className="text-sm font-semibold text-white group-hover:text-spotorange-300 transition-colors">@spotlogoficial</div>
                </div>
              </a>

              <div className="flex items-start gap-3 -mx-2 px-2 py-1">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-white/10 shrink-0">
                  <MapPin className="h-4 w-4 text-white" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[10px] uppercase tracking-wider font-bold text-ink-300">Endereço</div>
                  <div className="text-sm font-semibold text-white">São Paulo, SP — Brasil</div>
                </div>
              </div>
            </div>

            {/* Social icons */}
            <div className="flex gap-2">
              <a
                href="https://instagram.com/spotlogoficial"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram da Spotlog"
                className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 hover:bg-spotorange-500 text-white transition-all hover:scale-110"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn da Spotlog"
                className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 hover:bg-spotorange-500 text-white transition-all hover:scale-110"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="Facebook da Spotlog"
                className="grid h-10 w-10 place-items-center rounded-lg bg-white/10 hover:bg-spotorange-500 text-white transition-all hover:scale-110"
              >
                <Facebook className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* COLUNA 2 — LINKS DE NAVEGAÇÃO + 3 CARDS DE INFO (col-span-8) */}
          <div className="lg:col-span-8 space-y-8">
            {/* 4 colunas de links */}
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 lg:gap-8">
              {Object.entries(linksGroups).map(([title, items]) => (
                <div key={title}>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-white mb-4">
                    {title}
                  </h4>
                  <ul className="space-y-2.5">
                    {items.map((item) => (
                      <li key={`${title}-${item.label}`}>
                        {"external" in item && item.external ? (
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-ink-300 hover:text-spotorange-400 transition-colors"
                          >
                            {item.label}
                          </a>
                        ) : (
                          <Link
                            href={item.href}
                            className="text-sm text-ink-300 hover:text-spotorange-400 transition-colors"
                          >
                            {item.label}
                          </Link>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* AFE Anvisa banner — preenche espaço vazio */}
            <div className="bg-white rounded-3xl p-6 lg:p-7 flex flex-col sm:flex-row items-center gap-5 shadow-card">
              <div className="relative h-24 w-24 sm:h-28 sm:w-28 shrink-0 bg-white rounded-2xl p-2 border border-navy-100">
                <Image
                  src="/images/anvisa-logo.png"
                  alt="Logo Anvisa"
                  fill
                  sizes="112px"
                  className="object-contain"
                />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-spotorange-50 border border-spotorange-200 px-3 py-1 mb-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-spotorange-600" />
                  <span className="text-[11px] font-bold text-spotorange-700 uppercase tracking-wider">
                    Credenciada AFE Anvisa
                  </span>
                </div>
                <h4 className="text-lg lg:text-xl font-bold text-navy-950 leading-tight">
                  Autorização de Funcionamento para Transporte de Medicamentos
                </h4>
                <p className="text-sm text-ink-600 mt-1.5 leading-relaxed">
                  Cumprimos todos os requisitos sanitários da Anvisa para
                  transporte de medicamentos, manipulados e correlatos com
                  rastreabilidade e cadeia de frio.
                </p>
                <Link
                  href="/farma"
                  className="inline-flex items-center gap-1 text-sm font-semibold text-spotorange-600 hover:text-spotorange-700 mt-2"
                >
                  Ver autorização completa
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>

            {/* 3 cards info — preenche o resto */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* Horário */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <div className="inline-grid h-10 w-10 place-items-center rounded-lg bg-spotorange-500/20 mb-3">
                  <Clock className="h-5 w-5 text-spotorange-400" />
                </div>
                <h5 className="text-sm font-bold text-white mb-1">Horário comercial</h5>
                <p className="text-xs text-ink-300 leading-relaxed">
                  Segunda a sexta · 08h às 19h<br />
                  Sábado · 09h às 13h<br />
                  Plantão SAC 24/7 para clientes contrato
                </p>
              </div>

              {/* Segmentos */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <div className="inline-grid h-10 w-10 place-items-center rounded-lg bg-spotorange-500/20 mb-3">
                  <Sparkles className="h-5 w-5 text-spotorange-400" />
                </div>
                <h5 className="text-sm font-bold text-white mb-2">Segmentos atendidos</h5>
                <div className="flex flex-wrap gap-1.5">
                  {segmentos.map((s) => (
                    <span
                      key={s}
                      className="text-[10px] font-semibold uppercase tracking-wider bg-white/10 text-ink-200 px-2 py-0.5 rounded-full"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>

              {/* Cobertura */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/10 transition-colors">
                <div className="inline-grid h-10 w-10 place-items-center rounded-lg bg-spotorange-500/20 mb-3">
                  <Truck className="h-5 w-5 text-spotorange-400" />
                </div>
                <h5 className="text-sm font-bold text-white mb-2">Cobertura</h5>
                <ul className="text-xs text-ink-300 space-y-0.5">
                  {cidadesAtendidas.slice(0, 6).map((c) => (
                    <li key={c} className="flex items-center gap-1.5">
                      <span className="h-1 w-1 rounded-full bg-spotorange-400 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/abrangencia"
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-spotorange-400 hover:text-spotorange-300 mt-2"
                >
                  Ver todas
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </div>

            {/* Faixa de selos compactos */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <CredItem icon={<ShieldCheck className="h-4 w-4" />} title="LGPD" subtitle="Compliance" />
              <CredItem icon={<ShieldCheck className="h-4 w-4" />} title="ISO 9001" subtitle="Qualidade" />
              <CredItem icon={<ShieldCheck className="h-4 w-4" />} title="Cadeia de frio" subtitle="2-8°C" />
              <CredItem icon={<Headphones className="h-4 w-4" />} title="SAC 24/7" subtitle="Plantão" />
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row gap-4 items-center justify-between">
          <p className="text-xs text-ink-400 text-center md:text-left">
            © {new Date().getFullYear()} Spotlog — Logística inteligente. CNPJ
            sob consulta · Todos os direitos reservados.
          </p>
          <div className="flex flex-wrap items-center gap-4 text-xs text-ink-400">
            <Link href="/privacidade" className="hover:text-spotorange-400 transition-colors">
              Privacidade
            </Link>
            <Link href="/termos" className="hover:text-spotorange-400 transition-colors">
              Termos
            </Link>
            <Link href="/lgpd" className="hover:text-spotorange-400 transition-colors">
              LGPD
            </Link>
            <span>Feito com 🧡 no Brasil.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

function CredItem({
  icon, title, subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-4 text-center hover:bg-white/10 transition-colors">
      <div className="inline-grid h-8 w-8 place-items-center rounded-full bg-spotorange-500/20 mx-auto mb-2 text-spotorange-400">
        {icon}
      </div>
      <div className="text-sm font-bold text-white leading-tight">{title}</div>
      <div className="text-[10px] uppercase tracking-wider text-ink-400 mt-0.5">
        {subtitle}
      </div>
    </div>
  );
}
