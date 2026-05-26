import { SolucoesGrid } from "@/components/public/solucoes-grid";
import { Processo } from "@/components/public/processo";
import { CtaBanner } from "@/components/public/cta-banner";

export const metadata = { title: "Soluções" };

export default function SolucoesPage() {
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-8 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
              Soluções
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Soluções logísticas pra{" "}
              <span className="text-gradient-spotlog">cada necessidade.</span>
            </h1>
          </div>
        </div>
      </section>
      <SolucoesGrid />
      <Processo />
      <CtaBanner />
    </div>
  );
}
