"use client";

import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";
import { Icon } from "@/components/v3/icons";

const DORES = [
  "Entregas atrasadas",
  "Reclamações de clientes",
  "Falta de visibilidade",
  "Dificuldade para escalar",
  "Custos logísticos elevados",
  "Problemas com transportadoras",
];

export function Dores({ content }: { content?: Record<string, CardContent> }) {
  const items = Object.values(content ?? {})
    .filter((c) => c.slot.startsWith("item"))
    .sort((a, b) => a.sort - b.sort);

  const dores: { label: string; card?: CardContent }[] =
    items.length > 0
      ? items.map((c, i) => ({ label: c.title ?? DORES[i] ?? "", card: c }))
      : DORES.map((label) => ({ label }));

  return (
    <section className="section section-navy">
      <div className="shell">
        <div style={{ textAlign:"center", maxWidth: 820, marginInline:"auto" }}>
          <div className="kicker" style={{ display:"inline-flex", ...cardTitleStyle(content?.["eyebrow"]) }}>{content?.["eyebrow"]?.title ?? "O bloco que mais converte"}</div>
          <h2 style={{ marginTop: 22, ...cardTitleStyle(content?.["heading"]) }}>
            {content?.["heading"]?.title ?? "Sua operação enfrenta"}<br/>
            <span style={cardDescStyle(content?.["heading"])}>{content?.["heading"]?.description ?? "algum "}</span><span className="serif-italic" style={{ color:"#FF6B6F", ...cardTitleStyle(content?.["heading-emphasis"]) }}>{content?.["heading-emphasis"]?.title ?? "desses desafios?"}</span>
          </h2>
          <p className="lead" style={{ marginTop: 18, marginInline:"auto", ...cardDescStyle(content?.["lead"]) }}>
            {content?.["lead"]?.description ?? "Se você se identificou com pelo menos um, a gente resolve isso."}
          </p>
        </div>

        <div className="dor-grid" style={{ marginTop: 44 }}>
          {dores.map((d, i) => (
            <div key={i} className="dor-card">
              <span className="x"><Icon.Close size={15} stroke={2.5}/></span>
              <span className="t" style={cardTitleStyle(d.card)}>{d.label}</span>
            </div>
          ))}
        </div>

        <div style={{
          marginTop: 44, padding: "40px clamp(24px,4vw,56px)",
          borderRadius: 26, textAlign:"center",
          background: "linear-gradient(135deg, var(--red) 0%, var(--red-dark) 100%)",
          boxShadow: "var(--shadow-red)",
        }}>
          <div style={{ fontFamily:"'Bricolage Grotesque','Geist',sans-serif", fontSize:"clamp(30px,4vw,52px)", color:"#FFF", lineHeight:1.05, ...cardTitleStyle(content?.["callout"]) }}>
            {content?.["callout"]?.title ?? "Nós resolvemos isso."}
          </div>
          <p style={{ color:"rgba(255,255,255,.9)", marginTop: 14, maxWidth: "60ch", marginInline:"auto", fontSize: 17, ...cardDescStyle(content?.["callout"]) }}>
            {content?.["callout"]?.description ?? "Descubra como reduzir prazos de entrega e aumentar a satisfação dos seus clientes — sem compromisso e sem custo."}
          </p>
          <div style={{ display:"flex", gap: 12, justifyContent:"center", marginTop: 26, flexWrap:"wrap" }}>
            <a href={content?.["cta"]?.cta_url ?? "#contato"} className="btn btn-white btn-lg" onClick={(e)=>{e.preventDefault();document.getElementById('contato')?.scrollIntoView({behavior:'smooth'});}}>
              {content?.["cta"]?.cta_label ?? "Solicitar diagnóstico gratuito"} <Icon.Arrow size={16}/>
            </a>
            <a href={content?.["cta-secondary"]?.cta_url ?? "#contato"} className="btn btn-outline-light btn-lg" onClick={(e)=>{e.preventDefault();document.getElementById('contato')?.scrollIntoView({behavior:'smooth'});}}>
              {content?.["cta-secondary"]?.cta_label ?? "Receber estudo operacional sem custo"}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
