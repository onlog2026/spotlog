"use client";

import { Icon, unsplash } from "@/components/v3/icons";
import { Photo } from "@/components/v3/photo";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

type HeroContent = Record<string, CardContent> | undefined;

/** Renderiza a headline: cada "\n" vira quebra de linha; *palavra* vira destaque vermelho. */
function renderHeadline(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
    return (
      <span key={li}>
        {parts.map((p, pi) =>
          p.startsWith("*") && p.endsWith("*") ? (
            <span key={pi} className="mark">
              <span className="red">{p.slice(1, -1)}</span>
            </span>
          ) : (
            <span key={pi}>{p}</span>
          ),
        )}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

export function Hero({ content }: { content?: HeroContent }) {
  const c = content;
  const eyebrow = c?.eyebrow?.title ?? "Operador logístico completo · São Paulo & RMSP";
  const headline = c?.headline?.title ?? "Logística que entrega\n*controle*,\nnão só pacote.";
  const lead =
    c?.lead?.description ??
    "Reduza prazos, diminua reclamações e aumente conversão com uma operação especializada em ecommerce, farma e produtos sensíveis — do recebimento à última milha, com rastreabilidade e atendimento de verdade.";
  const ctaPrimaryLabel = c?.cta_primary?.cta_label ?? "Solicitar diagnóstico gratuito";
  const ctaSecondaryLabel = c?.cta_secondary?.cta_label ?? "Ver soluções";

  const imgDesktop = c?.image?.image_url ?? "/images/entregador-hero.webp";
  const imgMobile = c?.image?.image_url_mobile ?? "/images/entregador-hero.webp";

  const chips = (c?.chips?.metadata?.items as string[] | undefined) ?? [
    "Redução de prazo",
    "Mais conversão",
    "Menos reclamações",
    "Segurança regulatória",
    "Escalabilidade",
  ];
  const metrics =
    (c?.metrics?.metadata?.items as [string, string, string][] | undefined) ?? [
      ["+98", "%", "Entregas com sucesso"],
      ["+500", "mil", "Entregas realizadas"],
      ["24/7", "", "Suporte & rastreio"],
    ];

  return (
    <section id="top" className="hero">
      <div className="shell">
        <div className="kicker no-rule" style={{ marginBottom: 26 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "var(--red)" }} />
          {eyebrow}
        </div>

        <div className="hero-grid">
          {/* Headline */}
          <div>
            <h1 style={cardTitleStyle(c?.headline)}>{renderHeadline(headline)}</h1>

            <p className="lead" style={{ marginTop: 30, maxWidth: "52ch", ...cardDescStyle(c?.lead) }}>
              {lead}
            </p>

            <div style={{ display: "flex", gap: 12, marginTop: 34, flexWrap: "wrap" }}>
              <a
                href="#contato"
                className="btn btn-red btn-lg"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {ctaPrimaryLabel} <Icon.Arrow size={16} />
              </a>
              <a
                href="#servicos"
                className="btn btn-ghost btn-lg"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("servicos")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                {ctaSecondaryLabel}
              </a>
            </div>

            {/* benefit chips */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 28 }}>
              {chips.map((b) => (
                <span key={b} className="tag tag-navy">
                  {b}
                </span>
              ))}
            </div>

            <div className="hero-metrics">
              {metrics.map(([v, u, l]: [string, string, string], i: number) => (
                <div className="hero-metric" key={i}>
                  <div className="v">
                    {v}
                    <span className="u">{u}</span>
                  </div>
                  <div className="kicker no-rule muted" style={{ marginTop: 8, fontSize: 10 }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo banner */}
          <div className="hero-col-media">
            <div className="hero-banner">
              <Photo
                scene="courier"
                src={imgDesktop}
                alt="Entregador Spotlog com pacote"
                className={imgMobile ? "v3-desktop-only" : ""}
                priority
              />
              {imgMobile && (
                <Photo
                  scene="courier"
                  src={imgMobile}
                  alt="Entregador Spotlog com pacote"
                  className="v3-mobile-only"
                  priority
                />
              )}
              <div className="hero-banner-overlay" />
              <div className="sticker" style={{ top: 22, right: 22 }}>
                entregue hoje ✦
              </div>
              <div className="hero-chip" style={{ top: 70, right: 22 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--green)" }} />
                <div>
                  <div className="mono" style={{ fontSize: 10, color: "#6B739A" }}>
                    EM ROTA
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#0C1640" }}>SPL-2841 · ETA 11h42</div>
                </div>
              </div>
              <div className="hero-banner-tag">
                <div className="mono" style={{ fontSize: 11, letterSpacing: ".2em", opacity: 0.85 }}>
                  SPOTLOG · OPERAÇÃO
                </div>
                <div className="big">
                  Tecnologia
                  <br />e suporte humano
                </div>
              </div>
            </div>
            <div className="photo-cap" style={{ marginTop: 12 }}>
              IMAGEM ILUSTRATIVA · SUBSTITUÍVEL PELA FOTO REAL DA OPERAÇÃO
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
