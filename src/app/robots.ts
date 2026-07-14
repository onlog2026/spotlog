import type { MetadataRoute } from "next";

// Gera /robots.txt (antes dava 404). Libera o site, bloqueia painel/admin e API,
// e aponta o sitemap — o básico que todo buscador procura.
export default function robots(): MetadataRoute.Robots {
  const base = (
    process.env.NEXT_PUBLIC_APP_URL || "https://www.spotlog.com.br"
  ).replace(/\/$/, "");
  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: ["/app", "/api"] },
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
