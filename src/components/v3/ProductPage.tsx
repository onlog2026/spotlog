import Image from "next/image";
import { Icon } from "@/components/v3/icons";

/**
 * Template ÚNICO de página de produto (o layout da "imagem 2": herói com texto
 * à esquerda + imagem emoldurada à direita, benefícios, processo, CTA).
 * É a versão de PÁGINA REAL do antigo ServicePage (modal) — sem a barra
 * "Voltar ao site"; o menu do site vem do V3Shell que envolve a página.
 * Server component (sem hooks) → usável direto nas rotas.
 */
export type ProductContent = {
  eyebrow: string;
  name: string; // usado na legenda "IMAGEM ILUSTRATIVA · NOME"
  title: string;
  trigger?: string;
  intro: string;
  image: string;
  benefits: string[];
  idealFor?: string[];
  steps: { t: string; d: string }[];
  ctaLabel: string;
  note?: string;
  waHref?: string;
};

export function ProductPage({ p }: { p: ProductContent }) {
  return (
    <>
      {/* HERO — texto à esquerda, imagem emoldurada à direita */}
      <section className="section" style={{ paddingTop: 104, paddingBottom: 56 }}>
        <div className="shell">
          <div className="svc-hero">
            <div>
              <div className="kicker">{p.eyebrow}</div>
              <h1 style={{ marginTop: 18, fontSize: "clamp(34px,5vw,60px)" }}>{p.title}</h1>
              {p.trigger && (
                <div style={{ marginTop: 22, paddingLeft: 18, borderLeft: "3px solid var(--red)" }}>
                  <div className="serif" style={{ fontSize: "clamp(19px,2vw,24px)", color: "var(--ink)" }}>
                    {p.trigger}
                  </div>
                </div>
              )}
              <p className="lead" style={{ marginTop: 22 }}>{p.intro}</p>
              <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap" }}>
                <a href="/contato" className="btn btn-red btn-lg">
                  {p.ctaLabel} <Icon.Arrow size={16} />
                </a>
                {p.waHref && (
                  <a href={p.waHref} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-lg">
                    Falar no WhatsApp
                  </a>
                )}
              </div>
            </div>
            <div>
              {/* Quadro da imagem no formato 1536×1024 (3:2) — padrão das artes. */}
              <div className="svc-photo" style={{ aspectRatio: "1536 / 1024", position: "relative" }}>
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  unoptimized={p.image.endsWith(".svg") || p.image.includes("image.pollinations.ai")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFÍCIOS + IDEAL PARA */}
      <section className="section section-paper section-rule" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="shell">
          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: 48 }} className="svc-cols">
            <div>
              <div className="kicker">Benefícios</div>
              <h2 style={{ marginTop: 16, fontSize: "clamp(28px,3.4vw,44px)" }}>O que você ganha</h2>
              <div className="cols-2" style={{ marginTop: 24 }}>
                {p.benefits.map((b, i) => (
                  <div key={i} className="foco-benefit">
                    <span className="ic"><Icon.Check size={11} stroke={3} /></span> {b}
                  </div>
                ))}
              </div>
              {p.note && (
                <p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 18, maxWidth: "60ch" }}>{p.note}</p>
              )}
            </div>
            {p.idealFor && p.idealFor.length > 0 && (
              <div>
                <div className="kicker">Ideal para</div>
                <div style={{ marginTop: 18 }}>
                  {p.idealFor.map((x, i) => (
                    <div key={i} className="tickrow">
                      <span className="ic"><Icon.Check size={11} stroke={3} /></span>{x}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="section section-navy" style={{ paddingTop: 64, paddingBottom: 64 }}>
        <div className="shell">
          <div className="kicker" style={{ display: "inline-flex" }}>Como funciona</div>
          <h2 style={{ marginTop: 16 }}>Um processo claro, do início ao fim.</h2>
          <div style={{ marginTop: 28 }}>
            {p.steps.map((st, i) => (
              <div key={i} className="svc-step" style={{ borderColor: "rgba(255,255,255,.16)" }}>
                <div className="sn">{String(i + 1).padStart(2, "0")}</div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 18, color: "#FFF" }}>{st.t}</div>
                  <p style={{ marginTop: 4, color: "#B7BFE0" }}>{st.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA FINAL */}
      <section className="section section-paper" style={{ paddingTop: 56, paddingBottom: 80 }}>
        <div className="shell">
          <div
            style={{
              padding: "40px clamp(24px,4vw,56px)",
              borderRadius: 26,
              textAlign: "center",
              background: "linear-gradient(135deg, var(--red), var(--red-dark))",
              boxShadow: "var(--shadow-red)",
            }}
          >
            <div className="serif" style={{ fontSize: "clamp(26px,3.4vw,44px)", color: "#FFF" }}>
              {p.trigger ?? p.title}
            </div>
            <p style={{ color: "rgba(255,255,255,.9)", marginTop: 12, maxWidth: "54ch", marginInline: "auto" }}>
              Receba um diagnóstico sem custo e descubra o modelo ideal pra sua empresa.
            </p>
            <a href="/contato" className="btn btn-white btn-lg" style={{ marginTop: 24 }}>
              {p.ctaLabel} <Icon.Arrow size={16} />
            </a>
          </div>
        </div>
      </section>

      <style>{`@media (max-width: 900px){ .svc-cols{ grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
    </>
  );
}
