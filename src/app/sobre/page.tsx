import Image from "next/image";
import { V3Shell } from "@/components/v3/V3Shell";
import { getSiteImage } from "@/lib/site-image";

export const revalidate = 60;
export const metadata = { title: "Quem Somos — Spotlog" };

const valores = [
  { title: "Equipe treinada", desc: "Profissionais capacitados continuamente para entregar o melhor serviço à sua empresa." },
  { title: "Time uniformizado", desc: "Identidade visual padronizada — sua marca representada com seriedade no destino." },
  { title: "Cobertura SP + Grande SP", desc: "Operamos em todo o estado de São Paulo e na região metropolitana." },
  { title: "Qualidade, rapidez e satisfação", desc: "Os três pilares que orientam cada serviço prestado pela Spotlog." },
];
const servicosBase = ["Motoboy", "Utilitários", "Mão de obra operacional"];

export default async function SobrePage() {
  const heroImg = await getSiteImage(
    "sobre",
    "hero",
    "image",
    "https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=1000&q=85",
  );
  return (
    <V3Shell>
      <section className="hero">
        <div className="shell">
          <div className="sb-hero">
            <div>
              <div className="kicker">Quem somos</div>
              <h1 className="serif" style={{ marginTop: 14, fontSize: "clamp(34px,5vw,58px)", lineHeight: 1.05 }}>
                A melhor ideia em <span style={{ color: "var(--red)" }}>soluções logísticas.</span>
              </h1>
              <p className="lead" style={{ marginTop: 16, fontWeight: 600 }}>Nós entregamos realizações.</p>
              <p className="lead" style={{ marginTop: 12 }}>
                A Spotlog oferece serviços com motoboy, utilitários e mão de obra operacional. Somos uma empresa
                de logística e transportes séria e responsável, atendendo diversos segmentos em todo o estado de
                São Paulo e região metropolitana.
              </p>
              <div style={{ display: "flex", gap: 8, marginTop: 18, flexWrap: "wrap" }}>
                {servicosBase.map((s) => (
                  <span key={s} className="tag tag-navy">{s}</span>
                ))}
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                <a href="/contato" className="btn btn-red btn-lg">Falar com a Spotlog</a>
                <a href="/farma" className="btn btn-ghost btn-lg">Conheça a AFE Anvisa</a>
              </div>
            </div>
            <div>
              <div className="photo" style={{ aspectRatio: "5 / 4", borderRadius: "var(--radius-lg)" }}>
                <Image
                  src={heroImg}
                  alt="Equipe Spotlog"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  style={{ objectFit: "cover" }}
                  priority
                  unoptimized={heroImg.endsWith(".svg") || heroImg.includes("image.pollinations.ai")}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-navy">
        <div className="shell" style={{ textAlign: "center", maxWidth: 880, marginInline: "auto" }}>
          <p className="serif" style={{ fontSize: "clamp(22px,2.8vw,32px)", lineHeight: 1.3, color: "#fff" }}>
            Contamos com uma equipe treinada, uniformizada e pronta a prestar o melhor serviço para sua empresa,
            garantindo <span style={{ color: "var(--red)" }}>qualidade, rapidez e satisfação.</span>
          </p>
        </div>
      </section>

      <section className="section section-paper section-rule">
        <div className="shell">
          <div className="kicker">Nossos diferenciais</div>
          <h2 className="serif" style={{ marginTop: 12 }}>
            Como cuidamos da <span style={{ color: "var(--red)" }}>sua operação.</span>
          </h2>
          <div className="sb-grid" style={{ marginTop: 32 }}>
            {valores.map((v) => (
              <div key={v.title} className="card" style={{ padding: 24 }}>
                <h3 className="serif" style={{ fontSize: 17 }}>{v.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.6 }}>{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-rule">
        <div className="shell" style={{ textAlign: "center" }}>
          <h2 className="serif">Vamos conversar?</h2>
          <p className="lead" style={{ margin: "16px auto 0" }}>Conte seu desafio logístico — a gente monta a solução.</p>
          <div style={{ marginTop: 24 }}><a href="/contato" className="btn btn-red btn-lg">Falar com especialista</a></div>
        </div>
      </section>

      <style>{`
        .sb-hero{ display:grid; grid-template-columns:1fr; gap:40px; align-items:center; }
        .sb-grid{ display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:680px){ .sb-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(min-width:1024px){ .sb-hero{ grid-template-columns:1.05fr 1fr; gap:56px; } .sb-grid{ grid-template-columns:repeat(4,1fr); } }
      `}</style>
    </V3Shell>
  );
}
