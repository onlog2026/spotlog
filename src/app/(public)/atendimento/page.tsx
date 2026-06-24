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
              Atendimento Spotlog
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Equipe sempre em{" "}
              <span className="text-gradient-spotlog">prontidão.</span>
            </h1>
            <p className="mt-6 text-lg lg:text-xl text-ink-600 leading-relaxed">
              Possuímos uma equipe de atendimento que está sempre em prontidão
              para atender todas as suas solicitações sempre que necessário,
              além de te manter informado sobre qualquer situação referente à
              solicitação realizada.
            </p>
          </div>
        </div>
      </section>
      <Atendimento />
      <CtaBanner />
    </div>
  );
}
