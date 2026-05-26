import { Abrangencia } from "@/components/public/abrangencia";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Abrangência" };

export default function AbrangenciaPage() {
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-12 lg:pb-16 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
              Abrangência
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Onde a Spotlog{" "}
              <span className="text-gradient-spotlog">entrega.</span>
            </h1>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed">
              Operamos em São Paulo capital e Grande SP com diferentes
              modalidades. Consulte sua região abaixo.
            </p>
          </div>
        </div>
      </section>
      <Abrangencia />
      <CtaBanner />
    </div>
  );
}
