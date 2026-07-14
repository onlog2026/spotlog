import Image from "next/image";
import { V3Shell } from "@/components/v3/V3Shell";
import { getSiteImage } from "@/lib/site-image";

export const revalidate = 60;
export const metadata = { title: "Tecnologia — Spotlog" };

const stack = [
  { title: "App do entregador", desc: "Rotas, check-in/out, foto, assinatura e ocorrências." },
  { title: "Painel do cliente", desc: "Dashboard com métricas, entregas, faturas e relatórios." },
  { title: "API e webhooks", desc: "Conecta com sua loja, ERP ou WMS — sem fricção." },
  { title: "IA de apoio", desc: "Auxilia o atendimento, triagem de chamados e SAC." },
  { title: "Geolocalização", desc: "GPS em tempo real do entregador e ETA por entrega." },
  { title: "Notificações", desc: "E-mail, SMS e WhatsApp pro cliente final, com seu branding." },
  { title: "Histórico completo", desc: "Cada interação guardada por anos para auditoria." },
  { title: "Segurança & LGPD", desc: "RLS no banco, criptografia e consentimento registrado." },
];

export default async function TecnologiaPage() {
  const heroImg = await getSiteImage(
    "tecnologia",
    "hero",
    "image",
    "https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=1000&q=85",
  );
  return (
    <V3Shell>
      <section className="hero">
        <div className="shell">
          <div className="tc-hero">
            <div>
              <div className="kicker">Tecnologia</div>
              <h1 className="serif" style={{ marginTop: 14, fontSize: "clamp(34px,5vw,58px)", lineHeight: 1.05 }}>
                Tecnologia que sustenta a operação — <span style={{ color: "var(--red)" }}>sem complicar pra você.</span>
              </h1>
              <p className="lead" style={{ marginTop: 18 }}>
                Plataforma própria, app do entregador, integrações com sua loja, painel do cliente e IA de apoio ao atendimento.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
                <a href="/contato" className="btn btn-red btn-lg">Quero conhecer</a>
                <a href="/solucoes" className="btn btn-ghost btn-lg">Ver soluções</a>
              </div>
            </div>
            <div>
              <div className="photo" style={{ aspectRatio: "5 / 4", borderRadius: "var(--radius-lg)" }}>
                <Image
                  src={heroImg}
                  alt="Tecnologia Spotlog"
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

      <section className="section section-paper section-rule">
        <div className="shell">
          <div className="kicker">Stack tecnológica</div>
          <h2 className="serif" style={{ marginTop: 12 }}>
            Tudo que roda por trás <span style={{ color: "var(--red)" }}>da sua entrega.</span>
          </h2>
          <div className="tc-grid" style={{ marginTop: 32 }}>
            {stack.map((s) => (
              <div key={s.title} className="card" style={{ padding: 22 }}>
                <h3 className="serif" style={{ fontSize: 16 }}>{s.title}</h3>
                <p style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8, lineHeight: 1.55 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-navy">
        <div className="shell" style={{ textAlign: "center" }}>
          <h2 className="serif">Quer ver a plataforma funcionando?</h2>
          <p className="lead" style={{ margin: "16px auto 0" }}>Agende uma demonstração com nosso time.</p>
          <div style={{ marginTop: 24 }}><a href="/contato" className="btn btn-red btn-lg">Agendar demonstração</a></div>
        </div>
      </section>

      <style>{`
        .tc-hero{ display:grid; grid-template-columns:1fr; gap:40px; align-items:center; }
        .tc-grid{ display:grid; grid-template-columns:1fr; gap:16px; }
        @media(min-width:680px){ .tc-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(min-width:1024px){ .tc-hero{ grid-template-columns:1.05fr 1fr; gap:56px; } .tc-grid{ grid-template-columns:repeat(4,1fr); } }
      `}</style>
    </V3Shell>
  );
}
