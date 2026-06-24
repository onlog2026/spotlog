import { notFound } from "next/navigation";
import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/admin";
import type { LandingPage } from "@/lib/queries/marketing";

export const dynamic = "force-dynamic";

async function getLanding(slug: string): Promise<LandingPage | null> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("landing_pages")
    .select("*")
    .eq("slug", slug)
    .eq("status", "publicado")
    .maybeSingle();
  return (data ?? null) as LandingPage | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lp = await getLanding(slug);
  if (!lp) return { title: "Não encontrado" };
  return {
    title: lp.seo_title ?? lp.title,
    description: lp.seo_description ?? lp.description ?? undefined,
  };
}

type LegacySection = { md?: string };
type Block = { type: string; config: Record<string, unknown> };
type BodyJson = { blocks?: Block[]; sections?: LegacySection[] };

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const lp = await getLanding(slug);
  if (!lp) notFound();

  const body = (lp.body_json as BodyJson | null) ?? {};
  const blocks = body.blocks ?? [];
  const legacy = body.sections ?? [];
  const ctaHref = lp.form_slug ? `/forms/${lp.form_slug}` : (lp.cta_url ?? "#");

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link href="/" className="font-bold text-[#011960] text-lg">Spotlog</Link>
          <nav className="flex gap-4 text-sm text-slate-600">
            <Link href="/farma" className="hover:text-[#BA0102]">Farma</Link>
            <Link href="/ecommerce" className="hover:text-[#BA0102]">E-commerce</Link>
            <Link href="/contato" className="hover:text-[#BA0102]">Contato</Link>
          </nav>
        </div>
      </header>

      <section
        className="relative px-6 md:px-12 py-16 md:py-28 text-white"
        style={{
          background: lp.hero_image_url
            ? `linear-gradient(180deg, rgba(1,25,96,0.7), rgba(1,25,96,0.85)), url(${lp.hero_image_url}) center/cover`
            : "linear-gradient(135deg, #011960, #BA0102)",
        }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl md:text-5xl font-bold leading-tight">{lp.title}</h1>
          {lp.description && (
            <p className="mt-4 text-lg md:text-xl opacity-95">{lp.description}</p>
          )}
          {lp.cta_label && (
            <div className="mt-8">
              <Link
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-md bg-[#BA0102] hover:bg-[#a10002] px-6 py-3 font-semibold"
              >
                {lp.cta_label}
              </Link>
            </div>
          )}
        </div>
      </section>

      {blocks.map((block, idx) => (
        <BlockRenderer key={idx} block={block} ctaHref={ctaHref} />
      ))}

      {legacy.length > 0 && (
        <section className="max-w-3xl mx-auto px-6 py-12 md:py-16 space-y-5">
          {legacy.map((s, i) => (
            <p key={i} className="text-base md:text-lg leading-relaxed whitespace-pre-wrap">
              {s.md}
            </p>
          ))}
        </section>
      )}

      <footer className="border-t border-slate-200 py-8 mt-8">
        <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <span>© Spotlog Logística — todos os direitos reservados.</span>
          <div className="flex gap-4">
            <Link href="/contato" className="hover:text-[#BA0102]">Contato</Link>
            <Link href="/privacidade" className="hover:text-[#BA0102]">Privacidade</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}

function BlockRenderer({ block, ctaHref }: { block: Block; ctaHref: string }) {
  const c = block.config as Record<string, unknown>;
  if (block.type === "features") {
    const items = (c.items ?? []) as { title: string; desc: string }[];
    return (
      <section className="max-w-5xl mx-auto px-6 py-12 md:py-16">
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((it, i) => (
            <div key={i} className="p-5 border border-slate-200 rounded-xl">
              <h3 className="font-semibold text-[#011960] mb-2">{it.title}</h3>
              <p className="text-sm text-slate-600">{it.desc}</p>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (block.type === "stats") {
    const items = (c.items ?? []) as { value: string; label: string }[];
    return (
      <section className="bg-slate-50 px-6 py-12">
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-6 text-center">
          {items.map((it, i) => (
            <div key={i}>
              <div className="text-4xl font-bold text-[#BA0102]">{it.value}</div>
              <div className="text-sm text-slate-600 mt-1">{it.label}</div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (block.type === "testimonial") {
    return (
      <section className="max-w-3xl mx-auto px-6 py-12 text-center">
        <blockquote className="text-lg md:text-xl italic text-slate-700">
          &ldquo;{String(c.quote ?? "")}&rdquo;
        </blockquote>
        <div className="mt-4 text-sm text-slate-500">
          <strong className="text-[#011960]">{String(c.author ?? "")}</strong>
          {c.role ? ` · ${String(c.role)}` : ""}
        </div>
      </section>
    );
  }
  if (block.type === "faq") {
    const items = (c.items ?? []) as { q: string; a: string }[];
    return (
      <section className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-[#011960] mb-6 text-center">Perguntas frequentes</h2>
        <div className="space-y-3">
          {items.map((it, i) => (
            <details key={i} className="p-4 border border-slate-200 rounded-lg">
              <summary className="font-semibold cursor-pointer text-[#011960]">{it.q}</summary>
              <p className="mt-2 text-sm text-slate-600">{it.a}</p>
            </details>
          ))}
        </div>
      </section>
    );
  }
  if (block.type === "cta") {
    return (
      <section className="bg-gradient-to-br from-[#011960] to-[#BA0102] text-white px-6 py-16 text-center">
        <h2 className="text-2xl md:text-3xl font-bold">{String(c.headline ?? "")}</h2>
        <Link
          href={ctaHref}
          className="inline-block mt-6 rounded-md bg-white text-[#011960] hover:bg-slate-100 px-6 py-3 font-semibold"
        >
          {String(c.button_label ?? "Falar com a gente")}
        </Link>
      </section>
    );
  }
  if (block.type === "form") {
    return (
      <section className="max-w-2xl mx-auto px-6 py-12 text-center">
        <h2 className="text-2xl font-bold text-[#011960] mb-4">{String(c.headline ?? "Fale com a gente")}</h2>
        <Link
          href={ctaHref}
          className="inline-block rounded-md bg-[#BA0102] hover:bg-[#a10002] text-white px-6 py-3 font-semibold"
        >
          Abrir formulário
        </Link>
      </section>
    );
  }
  // hero block já renderizado no topo via lp.title/description; ignora aqui
  return null;
}
