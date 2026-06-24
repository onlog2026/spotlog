import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Target, Zap, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getPublicCaseBySlug } from "@/lib/queries/cms";
import { Markdown } from "@/components/public/blog/markdown";

const segmentLabels: Record<string, string> = {
  ecommerce: "E-commerce",
  farma: "Farma",
  manipulacao: "Manipulação",
  correlatos: "Correlatos",
  dermo: "Dermo",
  outro: "Outro",
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = await getPublicCaseBySlug(slug);
  if (!c) return { title: "Case não encontrado | Spotlog" };
  const title = c.seo_title ?? `${c.client_name} — Case Spotlog`;
  const description = c.seo_description ?? c.summary ?? "";
  return {
    title: `${title} | Spotlog`,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      images: c.hero_url ? [{ url: c.hero_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: c.hero_url ? [c.hero_url] : undefined,
    },
  };
}

export default async function CaseDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const c = await getPublicCaseBySlug(slug);
  if (!c) notFound();

  const kpis = Object.entries(c.kpi_json ?? {});

  return (
    <article>
      <section className="relative pt-28 lg:pt-36 pb-12 bg-navy-950 overflow-hidden">
        {c.hero_url ? (
          <div className="absolute inset-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={c.hero_url} alt={c.client_name} className="w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-navy-950 via-navy-950/70 to-navy-950/40" />
          </div>
        ) : null}
        <div className="container relative">
          <div className="max-w-4xl">
            <Link href="/cases" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-6">
              <ArrowLeft className="h-4 w-4" /> Voltar pros cases
            </Link>
            <div className="flex flex-wrap items-center gap-3 mb-5">
              {c.logo_url ? (
                <div className="bg-white rounded-lg p-2 h-12">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={c.logo_url} alt={c.client_name} className="h-full object-contain" />
                </div>
              ) : null}
              <span className="inline-flex items-center bg-spotorange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">
                {segmentLabels[c.segment] ?? c.segment}
              </span>
            </div>
            <h1 className="text-3xl md:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
              {c.client_name}
            </h1>
            {c.summary ? <p className="mt-5 text-lg text-white/85 leading-relaxed max-w-3xl">{c.summary}</p> : null}
          </div>
        </div>
      </section>

      {kpis.length > 0 ? (
        <section className="py-10 lg:py-14 bg-white border-b border-ink-200">
          <div className="container">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpis.map(([k, v]) => (
                <div key={k} className="bg-spotorange-500 text-white rounded-2xl p-6 text-center shadow-card">
                  <div className="text-3xl md:text-4xl font-bold">{v}</div>
                  <div className="text-xs uppercase tracking-wider mt-2 opacity-90">{k}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="py-12 lg:py-16">
        <div className="container">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="bg-white border border-ink-200 rounded-2xl p-6 shadow-soft">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-red-50 text-red-600 mb-3">
                <Target className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-navy-900 mb-2">Desafio</h2>
              <Markdown>{c.challenge_md || "_Sem descrição_"}</Markdown>
            </div>
            <div className="bg-white border border-ink-200 rounded-2xl p-6 shadow-soft">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-navy-50 text-navy-900 mb-3">
                <Zap className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-navy-900 mb-2">Solução</h2>
              <Markdown>{c.solution_md || "_Sem descrição_"}</Markdown>
            </div>
            <div className="bg-white border border-ink-200 rounded-2xl p-6 shadow-soft">
              <div className="inline-flex items-center justify-center h-10 w-10 rounded-lg bg-spotorange-100 text-spotorange-600 mb-3">
                <TrendingUp className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-bold text-navy-900 mb-2">Resultados</h2>
              <Markdown>{c.results_md || "_Sem descrição_"}</Markdown>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-navy-950 text-white">
        <div className="container max-w-4xl text-center">
          <h2 className="text-2xl md:text-4xl font-bold">Quer um case assim?</h2>
          <p className="mt-3 text-white/80 text-lg">Fale com a Spotlog. A gente desenha a operação ideal pra sua marca.</p>
          <div className="mt-6">
            <Button variant="orange" size="lg" asChild>
              <Link href="/contato">
                Fale conosco <ArrowRight className="h-4 w-4 ml-1.5" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </article>
  );
}
