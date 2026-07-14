import "@/components/v3/spotlog-v3.css";
import { getPageCards } from "@/components/v3/cms";
import { buildThemeCss, mergeTheme, type ThemeTokens } from "@/components/v3/theme";
import { Header } from "@/components/v3/Header";
import { Footer } from "@/components/v3/Footer";
import { SiteScroll } from "@/components/v3/site-scroll";
import { v3FontsClassName } from "@/lib/v3-fonts";

/**
 * Casca padrão das páginas públicas no visual v3 (mesma identidade da home):
 * fontes + tema + .v3-root + Header + Footer + host dos modais de serviço.
 * Use em qualquer página pública para herdar o header/rodapé/tema da home.
 */
export async function V3Shell({ children }: { children: React.ReactNode }) {
  const cards = await getPageCards("home");
  const theme: ThemeTokens = mergeTheme(
    cards.theme?.tokens?.metadata?.tokens as Partial<ThemeTokens> | undefined,
  );
  // Nomes do menu editáveis pelo CMS: título do card do produto (home/solucoes)
  // sobrepõe o nome do código. Fail-open: sem card → nome do código.
  const menuLabels: Record<string, string> = {};
  for (const [slot, card] of Object.entries(cards.solucoes ?? {})) {
    if (card?.title) menuLabels[slot] = card.title;
  }
  return (
    <>
      <span className={v3FontsClassName} style={{ display: "none" }} aria-hidden="true" />
      <style dangerouslySetInnerHTML={{ __html: buildThemeCss(theme) }} />
      <div className="v3-root">
        <Header
          logoUrl={theme.logoUrlSite || theme.logoUrl}
          logoSize={theme.logoSize}
          megaImages={{
            ecommerce: cards.header?.["mega-ecommerce"]?.image_url ?? "",
            farma: cards.header?.["mega-farma"]?.image_url ?? "",
          }}
          menuLabels={menuLabels}
        />
        <main>{children}</main>
        <Footer />
        <SiteScroll />
      </div>
    </>
  );
}
