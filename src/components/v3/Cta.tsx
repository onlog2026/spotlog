"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { Icon } from "@/components/v3/icons";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

/** Renderiza o heading: "\n" vira <br/>; *palavra* vira itálico vermelho (serif-italic #FF6B6F). */
function renderHeading(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
    return (
      <span key={li}>
        {parts.map((p, pi) =>
          p.startsWith("*") && p.endsWith("*") ? (
            <span key={pi} className="serif-italic" style={{ color: "#FF6B6F" }}>
              {p.slice(1, -1)}
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

function ContactForm({ content }: { content?: Record<string, CardContent> }) {
  const c = content;
  const successTitle = c?.success?.title ?? "Recebemos sua solicitação.";
  const successCopy =
    c?.success?.description ??
    "Um especialista da Spotlog prepara seu diagnóstico e entra em contato em até 1 dia útil.";
  const successAgainLabel = c?.success?.cta_label ?? "Enviar outro";
  const submitLabel = c?.form_submit?.cta_label ?? "Receber diagnóstico gratuito";
  const consentLabel =
    c?.form_consent?.description ??
    "Concordo com o tratamento dos meus dados para contato comercial, conforme a Política de Privacidade e a LGPD.";

  const [sent, setSent] = useState(false);
  if (sent) {
    return (
      <div style={{ display:"flex", flexDirection:"column", justifyContent:"center", alignItems:"center", padding:"40px 0", textAlign:"center", minHeight: 360 }}>
        <div style={{ width:56,height:56,borderRadius:"50%",background:"var(--red)",color:"#FFF",display:"flex",alignItems:"center",justifyContent:"center" }}><Icon.Check size={26} stroke={2.5}/></div>
        <h3 style={{ marginTop: 18, fontSize: 28, color:"#FFF", ...cardTitleStyle(c?.["success"]) }}>{successTitle}</h3>
        <p style={{ marginTop: 8, color:"#B7BFE0", maxWidth: 380, ...cardDescStyle(c?.["success"]) }}>
          {successCopy}
        </p>
        <button className="btn btn-outline-light btn-sm" style={{ marginTop: 18, ...cardTitleStyle(c?.["success"]) }} onClick={()=>setSent(false)}>{successAgainLabel}</button>
      </div>
    );
  }
  return (
    <form onSubmit={(e)=>{ e.preventDefault(); setSent(true); }} style={{ display:"flex", flexDirection:"column", gap: 14 }}>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }} className="cf-row">
        <div className="field"><label className="field-label">Nome</label><input className="input" placeholder="Seu nome" required/></div>
        <div className="field"><label className="field-label">Empresa</label><input className="input" placeholder="Razão social / marca" required/></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }} className="cf-row">
        <div className="field"><label className="field-label">E-mail</label><input className="input" type="email" placeholder="voce@empresa.com" required/></div>
        <div className="field"><label className="field-label">WhatsApp</label><input className="input" placeholder="(11) 9 0000-0000" required/></div>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 12 }} className="cf-row">
        <div className="field"><label className="field-label">Segmento</label>
          <select className="input">
            <option>Ecommerce</option><option>Farmácia de manipulação</option><option>Drogaria / distribuidor</option>
            <option>Cosméticos / suplementos</option><option>Indústria / B2B saúde</option><option>Outro</option>
          </select>
        </div>
        <div className="field"><label className="field-label">Volume mensal</label>
          <select className="input"><option>Até 500 entregas</option><option>500 — 2 mil</option><option>2 mil — 10 mil</option><option>10 mil +</option></select>
        </div>
      </div>
      <div className="field"><label className="field-label">Conte sobre sua operação</label>
        <textarea className="input" placeholder="Como funciona hoje, onde dói e o que você quer melhorar."/></div>
      <label style={{ display:"flex", gap: 10, alignItems:"flex-start", fontSize: 12.5, color:"#B7BFE0", ...cardDescStyle(c?.["form_consent"]) }}>
        <input type="checkbox" required style={{ marginTop: 3 }}/>
        {consentLabel}
      </label>
      <button type="submit" className="btn btn-red btn-lg" style={{ marginTop: 4, ...cardTitleStyle(c?.["form_submit"]) }}>{submitLabel} <Icon.Arrow size={16}/></button>
      <style>{`@media (max-width: 720px){ .cf-row{ grid-template-columns: 1fr !important; } }`}</style>
    </form>
  );
}

export function Cta({ content }: { content?: Record<string, CardContent> }) {
  const c = content;
  const eyebrow = c?.eyebrow?.title ?? "Vamos otimizar sua logística";
  const heading = c?.heading?.title ?? "Descubra quanto\nsua operação pode *melhorar*.";
  const lead =
    c?.lead?.description ??
    "Receba um estudo operacional sem custo: onde estão os gargalos, quanto dá pra reduzir em prazo e custo, e como escalar com segurança. Sem compromisso.";

  // Cartões de contato (WhatsApp + demais): slots "item-*" ordenados por sort; fallback ao array atual.
  type ContactCard = { ic: ReactNode; l: string; v: string; lStyle: React.CSSProperties; vStyle: React.CSSProperties };
  const iconFor = (slot: string): ReactNode => {
    if (slot === "item-whatsapp" || slot === "whatsapp") return <Icon.Whatsapp size={16} />;
    if (slot === "item-mail" || slot === "mail") return <Icon.Mail size={16} />;
    return <Icon.Pin size={16} />;
  };
  const itemSlots = c
    ? Object.values(c)
        .filter((card) => card.slot.startsWith("item"))
        .sort((a, b) => a.sort - b.sort)
    : [];
  const contactCards: ContactCard[] = itemSlots.length
    ? itemSlots.map((card) => ({
        ic: iconFor(card.slot),
        l: card.title ?? "",
        v: card.cta_label ?? card.description ?? "",
        lStyle: cardTitleStyle(card),
        vStyle: cardDescStyle(card),
      }))
    : [
        { ic: <Icon.Whatsapp size={16} />, l: "WhatsApp", v: "(11) 9 0000-0000", lStyle: cardTitleStyle(undefined), vStyle: cardDescStyle(undefined) },
        { ic: <Icon.Mail size={16} />, l: "E-mail", v: "comercial@spotlog.com.br", lStyle: cardTitleStyle(undefined), vStyle: cardDescStyle(undefined) },
        { ic: <Icon.Pin size={16} />, l: "Base", v: "São Paulo · SP · RMSP", lStyle: cardTitleStyle(undefined), vStyle: cardDescStyle(undefined) },
      ];

  return (
    <section id="contato" className="section section-navy">
      <div className="shell">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1.05fr", gap: 56, alignItems:"start" }} className="ct-grid">
          <div>
            <div className="kicker" style={cardTitleStyle(c?.["eyebrow"])}>{eyebrow}</div>
            <h2 style={{ marginTop: 22, ...cardTitleStyle(c?.["heading"]) }}>
              {renderHeading(heading)}
            </h2>
            <p className="lead" style={{ marginTop: 20, color:"#B7BFE0", maxWidth:"50ch", ...cardDescStyle(c?.["lead"]) }}>
              {lead}
            </p>

            <div style={{ marginTop: 36, display:"flex", flexDirection:"column" }}>
              {contactCards.map((x,i)=>(
                <div key={i} style={{ display:"grid", gridTemplateColumns:"32px 90px 1fr", gap: 16, padding:"16px 0", borderTop:"1px solid rgba(255,255,255,.18)", alignItems:"center" }}>
                  <span style={{ width:28,height:28,borderRadius:"50%",background:"rgba(255,255,255,.08)",color:"#FFF",display:"flex",alignItems:"center",justifyContent:"center" }}>{x.ic}</span>
                  <span className="kicker no-rule muted" style={{ fontSize: 10, ...x.lStyle }}>{x.l}</span>
                  <span className="mono" style={{ fontSize: 15, color:"#FFF", ...x.vStyle }}>{x.v}</span>
                </div>
              ))}
              <div style={{ borderTop:"1px solid rgba(255,255,255,.18)" }}/>
            </div>
          </div>

          <div style={{ padding: 32, borderRadius: 26, background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.10)" }}>
            <ContactForm content={content}/>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 980px){ .ct-grid{ grid-template-columns: 1fr !important; gap: 32px !important; } }`}</style>
    </section>
  );
}
