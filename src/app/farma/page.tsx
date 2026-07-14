import Image from "next/image";
import { V3Shell } from "@/components/v3/V3Shell";
import { getSiteImage } from "@/lib/site-image";

export const revalidate = 60;
export const metadata = {
  title: "Transporte Farmacêutico com AFE Anvisa — Spotlog",
  description:
    "AFE — Autorização de Funcionamento para Transporte da Anvisa, com farmacêutico responsável e controle contínuo para medicamentos, termolábeis e correlatos.",
};

const garantias = [
  { title: "Farmacêutico responsável", desc: "Acompanha desde o início do processo, garantindo conformidade técnica e treinamento da equipe." },
  { title: "Controle de temperatura", desc: "Temperatura adequada para o transporte de termolábeis, com monitoramento contínuo." },
  { title: "Treinamento contínuo", desc: "Equipe capacitada permanentemente nos critérios sanitários, de limpeza e manuseio." },
];

const cuidados = [
  "Veículos e armazenagem rigidamente controlados em temperatura e pressão",
  "Licenças Sanitárias sempre atualizadas, sem risco de multas ou suspensões",
  "Critérios de limpeza exigidos pela legislação farmacêutica",
  "Temperatura adequada para o transporte de termolábeis",
  "Controle efetivo e contínuo da operação ponta a ponta",
  "Equipe treinada continuamente sob supervisão farmacêutica",
];

const transportamos = [
  { title: "Medicamentos", desc: "Transporte com cuidados específicos de manuseio, temperatura e rastreabilidade." },
  { title: "Termolábeis", desc: "Produtos sensíveis à temperatura — operação com controle térmico contínuo." },
  { title: "Correlatos", desc: "Materiais hospitalares, descartáveis e insumos da cadeia da saúde." },
];

export default async function FarmaPage() {
  const heroImg = await getSiteImage(
    "farma",
    "hero",
    "image",
    "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1000&q=85",
  );

  return (
    <V3Shell>
      <section className="hero">
        <div className="shell">
          <div className="fr-hero">
            <div>
              <div className="kicker">AFE Anvisa · Autorização de Funcionamento para Transporte</div>
              <h1 className="serif" style={{ marginTop: 14, fontSize: "clamp(34px,5vw,60px)", lineHeight: 1.05 }}>
                Transporte Farmacêutico com <span style={{ color: "var(--red)" }}>AFE Anvisa</span>.
              </h1>
              <p className="lead" style={{ marginTop: 18, fontWeight: 600 }}>
                Acreditamos que, transportando medicamentos, estamos também transportando a vida.
              </p>
              <p className="lead" style={{ marginTop: 12 }}>
                Garantimos a excelência das operações no setor farmacêutico, cumprindo e mantendo serviços
                sempre adequados às legislações vigentes.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
                <a href="/contato?segment=farma" className="btn btn-red btn-lg">Falar com especialista farma</a>
                <a href="#anvisa" className="btn btn-ghost btn-lg">Ver autorização Anvisa</a>
              </div>
            </div>
            <div>
              <div className="photo" style={{ aspectRatio: "5 / 4", borderRadius: "var(--radius-lg)" }}>
                <Image
                  src={heroImg}
                  alt="Transporte farmacêutico Spotlog"
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

      <section id="anvisa" className="section section-navy">
        <div className="shell">
          <div className="fr-anvisa">
            <div className="card" style={{ background: "#fff", padding: 28, textAlign: "center" }}>
              <div style={{ position: "relative", height: 140, marginBottom: 16 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/anvisa-logo.png"
                  alt="Logo oficial Anvisa"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <div className="serif" style={{ color: "var(--navy)", fontSize: 18 }}>
                Autorização de Funcionamento para Transporte
              </div>
              <p style={{ color: "#475569", fontSize: 14, marginTop: 8, lineHeight: 1.6 }}>
                A Spotlog cumpre todos os requisitos da Anvisa para o transporte de medicamentos,
                termolábeis e correlatos.
              </p>
            </div>
            <div>
              <h2 className="serif" style={{ fontSize: "clamp(28px,3.6vw,44px)", lineHeight: 1.1 }}>
                Autorização Anvisa para o transporte de medicamentos.
              </h2>
              <p className="lead" style={{ marginTop: 18 }}>
                A Anvisa é o órgão que regulamenta e fiscaliza as áreas de interesse da saúde — incluindo as
                transportadoras que fazem a ligação entre os demais setores.
              </p>
              <p className="lead" style={{ marginTop: 14 }}>
                A Spotlog possui <b style={{ color: "#fff" }}>AFE (Autorização de Funcionamento para Transporte)
                da Anvisa</b> — documento que valida e autoriza o transporte de{" "}
                <span style={{ color: "var(--red)", fontWeight: 600 }}>medicamentos, termolábeis e correlatos</span>,
                com farmacêutico responsável acompanhando todo o processo.
              </p>
              <div className="fr-3" style={{ marginTop: 26 }}>
                {garantias.map((g) => (
                  <div key={g.title} className="card" style={{ padding: 20, background: "rgba(255,255,255,.06)" }}>
                    <h3 className="serif" style={{ fontSize: 15, color: "#fff" }}>{g.title}</h3>
                    <p style={{ fontSize: 13, color: "#B7BFE0", marginTop: 6, lineHeight: 1.55 }}>{g.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section section-paper section-rule">
        <div className="shell">
          <div className="kicker">Cuidados no transporte</div>
          <h2 className="serif" style={{ marginTop: 12 }}>
            Rigidez técnica que protege <span style={{ color: "var(--red)" }}>cada item transportado.</span>
          </h2>
          <div className="fr-2" style={{ marginTop: 28 }}>
            {cuidados.map((c) => (
              <div key={c} className="card" style={{ padding: 16, display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: "var(--red)", fontWeight: 700 }}>✓</span>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", lineHeight: 1.55 }}>{c}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-rule">
        <div className="shell">
          <div className="kicker">O que transportamos</div>
          <h2 className="serif" style={{ marginTop: 12 }}>
            Operação preparada para <span style={{ color: "var(--red)" }}>a cadeia da saúde.</span>
          </h2>
          <div className="fr-3" style={{ marginTop: 28 }}>
            {transportamos.map((t) => (
              <div key={t.title} className="card" style={{ padding: 24 }}>
                <h3 className="serif" style={{ fontSize: 18 }}>{t.title}</h3>
                <p style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.6 }}>{t.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-navy">
        <div className="shell" style={{ textAlign: "center" }}>
          <div className="kicker">Logística farma de confiança</div>
          <h2 className="serif" style={{ marginTop: 12 }}>
            Sua operação farmacêutica em <span style={{ color: "var(--red)" }}>boas mãos.</span>
          </h2>
          <p className="lead" style={{ margin: "16px auto 0" }}>
            Fale com nosso time e conheça como a Spotlog estrutura o transporte de medicamentos, termolábeis e correlatos.
          </p>
          <div style={{ marginTop: 26, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/contato?segment=farma" className="btn btn-red btn-lg">Solicitar proposta farma</a>
            <a href="https://wa.me/5511978348288" target="_blank" rel="noopener" className="btn btn-ghost btn-lg">Falar no WhatsApp</a>
          </div>
        </div>
      </section>

      <style>{`
        .fr-hero{ display:grid; grid-template-columns:1fr; gap:40px; align-items:center; }
        .fr-anvisa{ display:grid; grid-template-columns:1fr; gap:32px; align-items:start; }
        .fr-2{ display:grid; grid-template-columns:1fr; gap:12px; }
        .fr-3{ display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:680px){ .fr-2{ grid-template-columns:repeat(2,1fr); } .fr-3{ grid-template-columns:repeat(3,1fr); } }
        @media(min-width:1024px){
          .fr-hero{ grid-template-columns:1.05fr 1fr; gap:56px; }
          .fr-anvisa{ grid-template-columns:0.8fr 1fr; gap:48px; }
        }
      `}</style>
    </V3Shell>
  );
}
