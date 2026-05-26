import Link from "next/link";
import { Target, Users, Heart, Award, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuemSomos } from "@/components/public/quem-somos";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Quem Somos" };

const valores = [
  { icon: Target, title: "Foco operacional", desc: "Cada detalhe da operação é pensado pra reduzir falhas e aumentar previsibilidade." },
  { icon: Users, title: "Atendimento humano", desc: "Pessoas reais resolvendo problemas reais — sem você ficar preso em URA." },
  { icon: Heart, title: "Cuidado com produto", desc: "Embalagens, manuseio e processo orientados pelo tipo de carga." },
  { icon: Award, title: "Compromisso com prazo", desc: "SLA acompanhado por cliente, com transparência total nos relatórios." },
];

export default function SobrePage() {
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-16 lg:pb-24 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
              Quem somos
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              A Spotlog nasceu pra resolver o que{" "}
              <span className="text-gradient-spotlog">logística genérica não resolve.</span>
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-ink-600 leading-relaxed max-w-3xl mx-auto">
              Acreditamos que entregar não é só transportar. É comunicar, dar
              visibilidade, oferecer suporte de verdade e cuidar de cada pedido
              como se fosse o único. Por isso construímos uma operação com
              tecnologia, atendimento humano e processo desenhado pro tipo de
              carga que você movimenta.
            </p>
            <div className="mt-8 flex justify-center gap-3">
              <Button variant="orange" size="lg" asChild>
                <Link href="/contato">
                  Falar com a Spotlog
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <QuemSomos />

      <section className="py-20 lg:py-28 bg-navy-50/40">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
              Nossos valores
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-950 tracking-tight text-balance">
              O que nos move{" "}
              <span className="text-gradient-spotlog">todos os dias.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {valores.map((v) => (
              <div key={v.title} className="bg-white border border-ink-200 rounded-2xl p-6 hover:shadow-card transition-all">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-spotorange-50 mb-4">
                  <v.icon className="h-6 w-6 text-spotorange-600" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{v.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <CtaBanner />
    </div>
  );
}
