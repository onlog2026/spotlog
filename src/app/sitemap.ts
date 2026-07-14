import type { MetadataRoute } from "next";
import { allLandingSlugs } from "@/lib/landing-pages";
import { allSolucaoSlugs } from "@/lib/solucoes-content";

// Gera /sitemap.xml (antes dava 404) a partir das rotas REAIS do site:
// páginas fixas + páginas de segmento/serviço (/[slug]) + soluções (/solucoes/[slug]).
export default function sitemap(): MetadataRoute.Sitemap {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL || "https://www.spotlog.com.br"
  ).replace(/\/$/, "");
  const now = new Date();

  const staticPaths = [
    "",
    "/ecommerce",
    "/farma",
    "/sobre",
    "/tecnologia",
    "/contato",
    "/abrangencia",
    "/rastreamento",
    "/solucoes",
    "/blog",
    "/cases",
  ];

  const landing = allLandingSlugs().map((s) => `/${s}`);
  const solucoes = allSolucaoSlugs().map((s) => `/solucoes/${s}`);

  const seen = new Set<string>();
  const paths = [...staticPaths, ...landing, ...solucoes].filter((p) => {
    if (seen.has(p)) return false;
    seen.add(p);
    return true;
  });

  return paths.map((p) => ({
    url: `${base}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : p.startsWith("/solucoes/") || p.split("/").length === 2 ? 0.7 : 0.6,
  }));
}
