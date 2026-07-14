import Image from "next/image";
import { V3Shell } from "@/components/v3/V3Shell";
import { getSiteImage } from "@/lib/site-image";

export const revalidate = 60;
export const metadata = { title: "E-commerce — Spotlog" };

const beneficios = [
  { title: "Same Day Delivery", desc: "Entrega de produtos aos clientes no mesmo dia da compra — ideal para e-commerces que precisam encantar." },
  { title: "Coletas programadas", desc: "Equipe passa no seu CD ou loja nos horários definidos, com checklist e confirmação." },
  { title: "Atendimento personalizado", desc: "Orçamentos flexíveis e planos diferenciados para adequar às suas entregas." },
  { title: "Logística reversa", desc: "Devoluções e trocas com a mesma qualidade da ida." },
  { title: "Acompanhamento", desc: "Visibilidade da operação — da coleta no seu CD ao comprovante no destino." },
  { title: "Transporte ágil", desc: "A melhor solução com orçamentos flexíveis de acordo com sua operação." },
];

const integracoes = [
  { name: "Shopify", status: "Disponível" },
  { name: "Nuvemshop", status: "Disponível" },
  { name: "WooCommerce", status: "Disponível" },
  { name: "Tray", status: "Em implantação" },
  { name: "Bling", status: "Em implantação" },
  { name: "Tiny", status: "Sob consulta" },
  { name: "Mercado Livre", status: "Sob consulta" },
  { name: "Shopee", status: "Sob consulta" },
  { name: "API própria", status: "Disponível" },
  { name: "Webhooks", status: "Disponível" },
];

function tagClass(status: string) {
  if (status === "Disponível") return "tag tag-green";
  if (status === "Em implantação") return "tag tag-amber";
  return "tag tag-navy";
}

export default async function EcommercePage() {
  const heroImg = await getSiteImage(
    "ecommerce",
    "hero",
    "image",
    "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1000&q=85",
  );

  return (
    <V3Shell>
      <section className="hero">
        <div className="shell">
          <div className="ec-hero-grid">
            <div>
              <div className="kicker">Solução para lojas online</div>
              <h1 className="serif" style={{ marginTop: 14, fontSize: "clamp(34px,5vw,60px)", lineHeight: 1.05 }}>
                E-commerce Express com <span style={{ color: "var(--red)" }}>Same Day Delivery</span>.
              </h1>
              <p className="lead" style={{ marginTop: 18 }}>
                O Same Day Delivery permite a entrega de produtos aos clientes no mesmo dia da compra
                — formato que vem ganhando cada vez mais espaço entre os e-commerces. Transporte ágil,
                com orçamentos flexíveis de acordo com a sua operação.
              </p>
              <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
                <a href="/contato?segment=ecommerce" className="btn btn-red btn-lg">Quero conhecer</a>
                <a href="#integracoes" className="btn btn-ghost btn-lg">Ver integrações</a>
              </div>
            </div>
            <div>
              <div className="photo" style={{ aspectRatio: "5 / 4", borderRadius: "var(--radius-lg)" }}>
                <Image
                  src={heroImg}
                  alt="Entrega de pedido de e-commerce Spotlog"
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
          <div className="kicker">Benefícios pro seu e-commerce</div>
          <h2 className="serif" style={{ marginTop: 12 }}>
            Mais do que entregar. <span style={{ color: "var(--red)" }}>Melhorar a experiência.</span>
          </h2>
          <div className="ec-grid" style={{ marginTop: 34 }}>
            {beneficios.map((b) => (
              <div key={b.title} className="card" style={{ padding: 24 }}>
                <h3 className="serif" style={{ fontSize: 18 }}>{b.title}</h3>
                <p style={{ marginTop: 8, color: "var(--ink-soft)", fontSize: 14, lineHeight: 1.6 }}>{b.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="integracoes" className="section section-rule">
        <div className="shell">
          <div className="kicker">Integrações</div>
          <h2 className="serif" style={{ marginTop: 12 }}>
            Conecta com <span style={{ color: "var(--red)" }}>a sua loja.</span>
          </h2>
          <p className="lead" style={{ marginTop: 14 }}>
            Trabalhamos com as principais plataformas e ERPs. Não vê o seu? Fala com a gente — provavelmente conseguimos integrar.
          </p>
          <div className="ec-grid-sm" style={{ marginTop: 28 }}>
            {integracoes.map((i) => (
              <div key={i.name} className="card" style={{ padding: 16, textAlign: "center" }}>
                <div className="serif" style={{ fontSize: 15 }}>{i.name}</div>
                <span className={tagClass(i.status)} style={{ marginTop: 8, display: "inline-block" }}>{i.status}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-navy">
        <div className="shell" style={{ textAlign: "center" }}>
          <div className="kicker">Vamos juntos</div>
          <h2 className="serif" style={{ marginTop: 12 }}>Pronto pra acelerar suas entregas?</h2>
          <p className="lead" style={{ margin: "16px auto 0" }}>
            Fale com a Spotlog e monte a logística do seu e-commerce — diagnóstico gratuito, sem compromisso.
          </p>
          <div style={{ marginTop: 26 }}>
            <a href="/contato?segment=ecommerce" className="btn btn-red btn-lg">Falar com especialista</a>
          </div>
        </div>
      </section>

      <style>{`
        .ec-hero-grid{ display:grid; grid-template-columns:1fr; gap:40px; align-items:center; }
        .ec-grid{ display:grid; grid-template-columns:1fr; gap:16px; }
        .ec-grid-sm{ display:grid; grid-template-columns:repeat(2,1fr); gap:12px; }
        @media(min-width:680px){ .ec-grid{ grid-template-columns:repeat(2,1fr); } }
        @media(min-width:1024px){
          .ec-hero-grid{ grid-template-columns:1.05fr 1fr; gap:56px; }
          .ec-grid{ grid-template-columns:repeat(3,1fr); }
          .ec-grid-sm{ grid-template-columns:repeat(5,1fr); }
        }
      `}</style>
    </V3Shell>
  );
}
