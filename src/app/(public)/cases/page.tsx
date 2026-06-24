import type { Metadata } from "next";
import { getPublicCases } from "@/lib/queries/cms";
import { CaseCard } from "@/components/public/blog/case-card";

export const metadata: Metadata = {
  title: "Cases | Spotlog",
  description:
    "Resultados reais Spotlog em e-commerce, farma, manipulação e dermo. Veja como nossos clientes escalaram com a gente.",
  openGraph: {
    title: "Cases Spotlog",
    description: "Resultados reais de operação logística que funciona.",
    type: "website",
  },
};

export default async function CasesIndexPage() {
  const cases = await getPublicCases();
  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-12 bg-gradient-soft hero-pattern overflow-hidden">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">Cases</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Resultados <span className="text-gradient-spotlog">de verdade</span>, com nome e número.
            </h1>
            <p className="mt-5 text-lg text-ink-600 leading-relaxed">
              Cada case aqui é uma operação real que rodamos. SLA, NPS, redução de custo — tudo
              mensurado.
            </p>
          </div>
        </div>
      </section>

      <section className="py-12 lg:py-16">
        <div className="container">
          {cases.length === 0 ? (
            <div className="bg-white border border-ink-200 rounded-2xl p-12 text-center">
              <p className="text-ink-600">Em breve publicaremos cases por aqui.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {cases.map((c) => (
                <CaseCard key={c.id} item={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
