import Image from "next/image";
import "@/components/v3/spotlog-v3.css";
import { getPageCards } from "@/components/v3/cms";
import { buildThemeCss, mergeTheme, type ThemeTokens } from "@/components/v3/theme";
import { Header } from "@/components/v3/Header";
import { Hero } from "@/components/v3/Hero";
import { Beneficios } from "@/components/v3/Beneficios";
import { Focos } from "@/components/v3/Focos";
import { Integracoes } from "@/components/v3/Integracoes";
import { Dores } from "@/components/v3/Dores";
import { Portfolio } from "@/components/v3/Portfolio";
import { Cobertura } from "@/components/v3/Cobertura";
import { Blog } from "@/components/v3/Blog";
import { Footer } from "@/components/v3/Footer";
import { SiteScroll } from "@/components/v3/site-scroll";
import { SolucoesGridV3 } from "@/components/v3/legacy/SolucoesGridV3";
import { ProcessoLegacyV3 } from "@/components/v3/legacy/ProcessoLegacyV3";
import { CreativesShowcaseV3 } from "@/components/v3/legacy/CreativesShowcaseV3";
import { JornadaEntregaV3 } from "@/components/v3/legacy/JornadaEntregaV3";
import { FormularioComercialV3 } from "@/components/v3/legacy/FormularioComercialV3";
import { v3FontsClassName } from "@/lib/v3-fonts";

export const revalidate = 60;

// Canonical da home (evita conteúdo duplicado spotlog.com.br vs /).
export const metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const cards = await getPageCards("home");
  const theme: ThemeTokens = mergeTheme(
    cards.theme?.tokens?.metadata?.tokens as Partial<ThemeTokens> | undefined,
  );
  // Nomes do menu editáveis pelo CMS (título do card do produto sobrepõe o código).
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
        <main>
          <Hero content={cards.hero} />
          {/* Soluções intercaladas: 3 cards → Beneficios → 3 cards → Processo → 3 cards */}
          <div id="servicos">
            {/* Título + banner de Soluções */}
            <SolucoesGridV3 slice={[0, 0]} />
            {/* Integrações logo abaixo do banner */}
            <Integracoes content={cards.integracoes} />
            {/* 1ª linha de 3 cards abaixo do Integrações */}
            <SolucoesGridV3 slice={[0, 3]} header={false} />
            <Beneficios content={cards.beneficios} />
            <SolucoesGridV3 slice={[3, 6]} header={false} />
            <ProcessoLegacyV3 />
            <SolucoesGridV3 slice={[6, 9]} header={false} />
          </div>
          <Focos content={cards.focos} />
          <CreativesShowcaseV3 content={cards.creatives} />
          <Dores content={cards.dores} />
          <Portfolio content={cards.portfolio} />
          <Cobertura content={cards.cobertura} />
          <div id="rastreio">
            <JornadaEntregaV3 />
          </div>
          <Blog content={cards.blog} />
          <section id="contato" className="section section-paper section-rule">
            <div className="shell">
              <div className="contato-grid">
                <aside className="contato-aside">
                  <div className="kicker">Fale com a Spotlog</div>
                  <h2 style={{ marginTop: 14 }}>Vamos montar a sua operação logística.</h2>
                  <p className="lead" style={{ marginTop: 16 }}>
                    Conte o desafio da sua operação e receba um diagnóstico gratuito do nosso
                    time — sem compromisso.
                  </p>
                  <div
                    className="photo"
                    style={{ marginTop: 28, aspectRatio: "4 / 3", borderRadius: "var(--radius-lg)", position: "relative" }}
                  >
                    <Image
                      src={
                        cards.contato?.["imagem"]?.image_url ??
                        "/images/entregador-hero.webp"
                      }
                      alt="Operação logística da Spotlog"
                      fill
                      sizes="(max-width: 900px) 100vw, 400px"
                      style={{ objectFit: "cover" }}
                      unoptimized={(cards.contato?.["imagem"]?.image_url ?? "").includes("image.pollinations.ai")}
                    />
                  </div>
                </aside>
                <div className="contato-form">
                  <FormularioComercialV3 />
                </div>
              </div>
            </div>
            <style>{`
              .contato-grid{ display:grid; grid-template-columns: 1fr; gap: 32px; }
              @media (min-width: 1024px){
                .contato-grid{ grid-template-columns: 0.82fr 1fr; gap: 56px; align-items: center; }
              }
            `}</style>
          </section>
        </main>
        <Footer />
        <SiteScroll />
      </div>
    </>
  );
}
