import Link from "next/link";
import Image from "next/image";
import { Users, Shirt, MapPin, Sparkles, ArrowRight, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Quem Somos" };

const valores = [
  {
    icon: Users,
    title: "Equipe treinada",
    desc: "Profissionais capacitados continuamente para entregar o melhor serviço à sua empresa.",
  },
  {
    icon: Shirt,
    title: "Time uniformizado",
    desc: "Identidade visual padronizada — sua marca é representada com seriedade no destino.",
  },
  {
    icon: MapPin,
    title: "Cobertura SP + Grande SP",
    desc: "Operamos em todo o estado de São Paulo e em toda a região metropolitana.",
  },
  {
    icon: Sparkles,
    title: "Qualidade, rapidez e satisfação",
    desc: "Os três pilares que orientam cada serviço prestado pela Spotlog.",
  },
];

const servicosBase = [
  "Motoboy",
  "Utilitários",
  "Mão de obra operacional",
];

export default function SobrePage() {
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-16 lg:pb-24 bg-gradient-soft hero-pattern overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-6">
              <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
                Quem somos
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
                A melhor ideia em{" "}
                <span className="text-gradient-spotlog">soluções logísticas.</span>
              </h1>
              <p className="mt-6 text-lg lg:text-xl text-ink-600 leading-relaxed">
                Nós entregamos realizações.
              </p>
              <p className="mt-4 text-base lg:text-lg text-ink-600 leading-relaxed">
                A Spotlog vem oferecendo diversos serviços com motoboy,
                utilitários e mão de obra operacional. Somos uma empresa de
                logística e transportes séria e responsável, que oferece soluções
                de logística para diversos segmentos de negócios em todo o estado
                de São Paulo e região metropolitana.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {servicosBase.map((s) => (
                  <span
                    key={s}
                    className="text-xs font-semibold uppercase tracking-wider px-3 py-1.5 rounded-full bg-navy-50 text-navy-900 border border-navy-100"
                  >
                    {s}
                  </span>
                ))}
              </div>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Button variant="orange" size="xl" asChild>
                  <Link href="/contato">
                    Falar com a Spotlog
                    <ArrowRight className="h-5 w-5" />
                  </Link>
                </Button>
                <Button variant="outline" size="xl" asChild>
                  <Link href="/farma">
                    Conheça a Anvisa AFE
                  </Link>
                </Button>
              </div>
            </div>

            <div className="lg:col-span-6 relative">
              <div className="aspect-[5/4] rounded-3xl overflow-hidden shadow-card bg-navy-100 relative">
                <Image
                  src="https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=85"
                  alt="Equipe Spotlog"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-navy-950/55 to-transparent" />
              </div>
              <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-card border border-ink-100 p-5 hidden md:block max-w-xs">
                <Quote className="h-5 w-5 text-spotorange-500 mb-2" />
                <div className="text-sm font-bold text-navy-900 leading-snug">
                  &ldquo;Nós entregamos realizações.&rdquo;
                </div>
                <div className="text-xs text-ink-500 mt-1">Slogan oficial Spotlog</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Frase em destaque */}
      <section className="py-16 lg:py-20 bg-navy-950 relative overflow-hidden">
        <div className="absolute inset-0 dot-grid opacity-10" />
        <div className="container relative text-center max-w-4xl mx-auto">
          <p className="text-2xl lg:text-3xl font-bold text-white leading-snug text-balance">
            Contamos com uma equipe treinada, uniformizada e pronta a prestar o
            melhor serviço para sua empresa, garantindo{" "}
            <span className="text-spotorange-400">qualidade, rapidez e satisfação.</span>
          </p>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-navy-50/40">
        <div className="container">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
              Nossos diferenciais
            </div>
            <h2 className="text-3xl lg:text-4xl font-bold text-navy-950 tracking-tight text-balance">
              Como cuidamos da{" "}
              <span className="text-gradient-spotlog">sua operação.</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {valores.map((v) => (
              <div key={v.title} className="card-glow p-6 group">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-spotorange-50 group-hover:bg-spotorange-500 transition-colors mb-4">
                  <v.icon className="h-6 w-6 text-spotorange-600 group-hover:text-white transition-colors" />
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
