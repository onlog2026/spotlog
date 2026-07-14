import { V3Shell } from "@/components/v3/V3Shell";
import { FormularioComercialV3 } from "@/components/v3/legacy/FormularioComercialV3";

export const revalidate = 60;
export const metadata = { title: "Contato — Spotlog" };

export default async function ContatoPage() {
  return (
    <V3Shell>
      <section className="hero">
        <div className="shell">
          <div className="ct-grid">
            <aside>
              <div className="kicker">Fale com a Spotlog</div>
              <h1 className="serif" style={{ marginTop: 14, fontSize: "clamp(32px,4.5vw,52px)", lineHeight: 1.06 }}>
                Vamos montar a sua <span style={{ color: "var(--red)" }}>operação logística.</span>
              </h1>
              <p className="lead" style={{ marginTop: 16 }}>
                Conte o desafio da sua operação e receba um diagnóstico gratuito do nosso time — sem compromisso.
              </p>
              <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 10 }}>
                <a href="https://wa.me/5511978348288" target="_blank" rel="noopener" className="link-arrow">
                  WhatsApp: (11) 97834-8288
                </a>
              </div>
            </aside>
            <div className="card" style={{ padding: 24 }}>
              <FormularioComercialV3 />
            </div>
          </div>
        </div>
      </section>
      <style>{`
        .ct-grid{ display:grid; grid-template-columns:1fr; gap:32px; align-items:start; }
        @media(min-width:1024px){ .ct-grid{ grid-template-columns:0.85fr 1fr; gap:48px; } }
      `}</style>
    </V3Shell>
  );
}
