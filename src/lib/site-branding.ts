import "server-only";
import { unstable_cache } from "next/cache";

/**
 * Lê os tokens de marca do CMS (Tema do site → site_cards home/theme/tokens),
 * sem cookies, cacheado (1h ou até salvar o tema). NUNCA quebra o render —
 * qualquer erro retorna null. Usado no <head> raiz e no layout do /app.
 */
const readBrandTokens = unstable_cache(
  async (): Promise<{
    faviconUrl?: string;
    faviconUrlSite?: string;
  } | null> => {
    try {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      if (!url || !key) return null;
      const res = await fetch(
        `${url}/rest/v1/site_cards?page=eq.home&section=eq.theme&slot=eq.tokens&select=metadata`,
        { headers: { apikey: key, Authorization: `Bearer ${key}` } },
      );
      if (!res.ok) return null;
      const rows = (await res.json()) as Array<{
        metadata?: { tokens?: { faviconUrl?: string; faviconUrlSite?: string } };
      }>;
      return rows?.[0]?.metadata?.tokens ?? null;
    } catch {
      return null;
    }
  },
  ["site-brand-tokens"],
  { tags: ["site-branding"], revalidate: 3600 },
);

/** Favicon do SITE público (home). Cai no do admin se o do site estiver vazio. */
export async function getSiteFavicon(): Promise<string | null> {
  const t = await readBrandTokens();
  const v = t?.faviconUrlSite?.trim() || t?.faviconUrl?.trim();
  return v && v.length ? v : null;
}

/** Favicon do PAINEL ADMIN (/app). */
export async function getAdminFavicon(): Promise<string | null> {
  const t = await readBrandTokens();
  const v = t?.faviconUrl?.trim();
  return v && v.length ? v : null;
}
