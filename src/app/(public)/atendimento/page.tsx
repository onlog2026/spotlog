import { Atendimento } from "@/components/public/atendimento";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Atendimento" };

export default function AtendimentoPage() {
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-12 lg:pb-16 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
              Atendimento
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Suporte que <span className="text-gradient-spotlog">resolve.</span>{" "}
              Não suporte que esquece.
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-ink-600 leading-relaxed">
              Cada chamado, cada conversa, cada solicitação — registrada,
              priorizada e tratada por gente que conhece sua operação.
            </p>
          </div>
        </div>
      </section>
      <Atendimento />
      <CtaBanner />
    </div>
  );
}
