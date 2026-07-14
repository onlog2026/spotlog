import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { V3Shell } from "@/components/v3/V3Shell";
import { ProductPage, type ProductContent } from "@/components/v3/ProductPage";
import { getLandingPage, allLandingSlugs } from "@/lib/landing-pages";

export const revalidate = 300;
export const dynamicParams = false;

/** Imagem do produto no CMS (site_cards home/solucoes/slot=slug) — mesmo sistema
 *  das páginas /solucoes, pra editar TODAS as imagens num lugar só. Fail-open. */
async function cmsCardImage(slug: string): Promise<string | null> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    const res = await fetch(
      `${url}/rest/v1/site_cards?page=eq.home&section=eq.solucoes&slot=eq.${encodeURIComponent(slug)}&active=eq.true&select=image_url`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 300, tags: ["site-cards"] } },
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
  return allLandingSlugs().map((slug) => ({ slug }));
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
  const p = getLandingPage(slug);
  return {
    title: p ? `${p.nome} — Spotlog` : "Spotlog",
    description: p ? toMetaDescription(p.intro) : undefined,
    alternates: { canonical: `/${slug}` },
  };
}

export default async function LandingSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getLandingPage(slug);
  if (!p) notFound();

  const wa = `https://wa.me/5511978348288?text=${encodeURIComponent(
    `Olá! Tenho interesse em ${p.nome}. Podem me ajudar?`,
  )}`;

  const image = (await cmsCardImage(slug)) || p.image;
  const content: ProductContent = {
    eyebrow: p.eyebrow,
    name: p.nome,
    title: p.title,
    intro: p.intro,
    image,
    benefits: p.benefits,
    idealFor: p.idealFor,
    steps: p.steps.map((s) => ({ t: s.t, d: s.d })),
    ctaLabel: p.ctaLabel,
    waHref: wa,
  };

  return (
    <V3Shell>
      <ProductPage p={content} />
    </V3Shell>
  );
}
