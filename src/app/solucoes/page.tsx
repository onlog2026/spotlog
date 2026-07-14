import { V3Shell } from "@/components/v3/V3Shell";
import { SolucoesGridV3 } from "@/components/v3/legacy/SolucoesGridV3";

export const revalidate = 60;
export const metadata = { title: "Soluções — Spotlog" };

export default async function SolucoesPage() {
  return (
    <V3Shell>
      <section className="hero">
        <div className="shell" style={{ textAlign: "center" }}>
          <div className="kicker">Soluções logísticas</div>
          <h1 className="serif" style={{ marginTop: 14, fontSize: "clamp(34px,5vw,58px)", lineHeight: 1.05 }}>
            Logística para <span style={{ color: "var(--red)" }}>cada etapa da sua operação.</span>
          </h1>
          <p className="lead" style={{ margin: "18px auto 0" }}>
            Da coleta ao comprovante, todas as modalidades têm rastreamento, atendimento e suporte.
            Escolha a que faz sentido pro seu negócio.
          </p>
        </div>
      </section>

      <SolucoesGridV3 />

      <section className="section section-navy">
        <div className="shell" style={{ textAlign: "center" }}>
          <div className="kicker">Vamos juntos</div>
          <h2 className="serif" style={{ marginTop: 12 }}>Não sabe qual solução escolher?</h2>
          <p className="lead" style={{ margin: "16px auto 0" }}>
            Fale com a gente — montamos a operação ideal pro seu negócio, sem compromisso.
          </p>
          <div style={{ marginTop: 24 }}>
            <a href="/contato" className="btn btn-red btn-lg">Falar com especialista</a>
          </div>
        </div>
      </section>
    </V3Shell>
  );
}
