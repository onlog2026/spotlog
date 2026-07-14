import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { V3Shell } from "@/components/v3/V3Shell";
import { ProductPage, type ProductContent } from "@/components/v3/ProductPage";
import { getSolucao, allSolucaoSlugs } from "@/lib/solucoes-content";

export const revalidate = 300;

/**
 * Imagem do card no CMS (site_cards home/solucoes/slot=slug), via fetch anônimo
 * cacheado — SEM cookies, pra manter a página estática (SSG). Fallback = conteúdo.
 */
async function cmsCardImage(slug: string): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const res = await fetch(
      `${url}/rest/v1/site_cards?page=eq.home&section=eq.solucoes&slot=eq.${encodeURIComponent(slug)}&active=eq.true&select=image_url`,
      {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
        next: { revalidate: 300, tags: ["site-cards"] },
      },
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as Array<{ image_url?: string | null }>;
    const img = rows?.[0]?.image_url;
    return img && img.trim() ? img.trim() : null;
  } catch {
    return null;
  }
}

export function generateStaticParams() {
  return allSolucaoSlugs().map((slug) => ({ slug }));
}

/** Corta no fim de frase/palavra antes de ~155 chars — pro meta description
 * ideal do Google (120-160), sem tocar no texto completo exibido na página. */
function toMetaDescription(text: string, max = 155): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const lastDot = cut.lastIndexOf(". ");
  if (lastDot > max * 0.6) return cut.slice(0, lastDot + 1);
  const lastSpace = cut.lastIndexOf(" ");
  return cut.slice(0, lastSpace > 0 ? lastSpace : max) + "…";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const s = getSolucao(slug);
  return {
    title: s ? `${s.title} — Spotlog` : "Solução — Spotlog",
    description: s ? toMetaDescription(s.intro) : undefined,
    alternates: { canonical: `/solucoes/${slug}` },
  };
}

export default async function SolucaoPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const s = getSolucao(slug);
  if (!s) notFound();

  const image = (await cmsCardImage(slug)) || s.image;

  const content: ProductContent = {
    eyebrow: s.eyebrow,
    name: s.eyebrow,
    title: s.title,
    intro: s.intro,
    image,
    // junta os "ganhos" extras (quando existem) aos benefícios pra não perder nada.
    benefits: [...s.benefits, ...(s.gains ?? [])],
    idealFor: s.idealFor,
    steps: s.steps.map((st) => ({ t: st.t, d: st.d })),
    ctaLabel: s.ctaLabel,
  };

  return (
    <V3Shell>
      <ProductPage p={content} />
    </V3Shell>
  );
}
