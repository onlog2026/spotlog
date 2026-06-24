import Link from "next/link";
import {
  Zap,
  Bike,
  ShoppingBag,
  Boxes,
  Pill,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Soluções" };

const servicos = [
  {
    icon: Zap,
    title: "Entregas Expressas / Same Day Delivery",
    desc:
      "O Same Day Delivery permite a entrega de produtos aos clientes feita no mesmo dia da compra. Esse formato vem ganhando cada vez mais espaço no mercado atual, principalmente quando nos referimos aos e-commerces.",
    href: "/contato?segment=express",
  },
  {
    icon: Bike,
    title: "Moto Fixa",
    desc:
      "Para empresas que possuem demanda de serviços rotineiros na qual um entregador fica disponível diariamente em período integral de segunda a sexta, em horários e demais dias a combinar conforme sua necessidade.",
    href: "/contato?segment=moto-fixa",
  },
  {
    icon: ShoppingBag,
    title: "E-commerce Express",
    desc:
      "Transporte ágil, com a melhor solução com orçamentos flexíveis de acordo com sua operação.",
    href: "/ecommerce",
  },
  {
    icon: Boxes,
    title: "Soluções Personalizadas",
    desc:
      "Temos equipes especializadas para realizar atividades manuais, como aplicação de etiquetas e rótulos, nacionalização de produtos, inserção de bulas ou folhetos explicativos, fracionamento de produtos dentre outras atividades.",
    href: "/contato?segment=personalizadas",
  },
  {
    icon: Pill,
    title: "Express Pharma",
    desc:
      "Atendimento personalizado para sua loja. Vários planos diferenciados para atender sua necessidade. Aqui você encontra flexibilidade para adequar suas entregas de acordo com sua demanda, economizando tempo e dinheiro.",
    href: "/farma",
    highlight: true,
  },
];

export default function SolucoesPage() {
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-12 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
              Soluções Spotlog
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Soluções logísticas pra{" "}
              <span className="text-gradient-spotlog">cada necessidade.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed">
              A Spotlog oferece um portfólio completo de serviços para o seu
              negócio — do same day delivery ao transporte farmacêutico com AFE
              Anvisa.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-6">
            {servicos.map((s) => (
              <div
                key={s.title}
                className={`card-glow p-7 group flex flex-col ${
                  s.highlight ? "border-spotorange-500 lg:col-span-2" : ""
                }`}
              >
                <div className="flex items-start gap-5">
                  <div className="grid h-14 w-14 place-items-center rounded-2xl bg-spotorange-50 group-hover:bg-spotorange-500 transition-colors shrink-0">
                    <s.icon className="h-7 w-7 text-spotorange-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-2">
                      <h3 className="text-xl lg:text-2xl font-bold text-navy-900 leading-tight">
                        {s.title}
                      </h3>
                      {s.highlight && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-spotorange-500 text-white">
                          <ShieldCheck className="h-3 w-3" />
                          AFE Anvisa
                        </span>
                      )}
                    </div>
                    <p className="text-sm lg:text-base text-ink-600 leading-relaxed mb-4">
                      {s.desc}
                    </p>
                    <Button variant="soft" size="sm" asChild>
                      <Link href={s.href}>
                        Saiba mais
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}
