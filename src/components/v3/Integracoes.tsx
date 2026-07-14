"use client";

import { useState } from "react";
import { Icon } from "@/components/v3/icons";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

const PLATAFORMAS = [
  { n:"Shopify", c:"#5E8E3E", s:"on" },
  { n:"Nuvemshop", c:"#2D5BFF", s:"on" },
  { n:"WooCommerce", c:"#7F54B3", s:"on" },
  { n:"VTEX", c:"#F71963", s:"on" },
  { n:"Tray", c:"#FF6A00", s:"impl" },
  { n:"Loja Integrada", c:"#13B0A5", s:"on" },
  { n:"Magento", c:"#EE672F", s:"impl" },
  { n:"Wake", c:"#6C2BD9", s:"req" },
];
const MARKETPLACES = [
  { n:"Mercado Livre", c:"#FFE600", dark:true, s:"on" },
  { n:"Shopee", c:"#EE4D2D", s:"on" },
  { n:"Amazon", c:"#FF9900", s:"impl" },
  { n:"Magalu", c:"#0086FF", s:"impl" },
  { n:"Americanas", c:"#E60014", s:"req" },
];
const GESTAO = [
  { n:"Bling", c:"#1B72E8", s:"on" },
  { n:"Tiny", c:"#3B82F6", s:"on" },
  { n:"Omie", c:"#00B0F0", s:"impl" },
  { n:"API REST", c:"#1F9D6B", s:"on" },
  { n:"Webhooks", c:"#E11B22", s:"on" },
];

const STATUS_LABEL: Record<string, string> = { on:"Ativo", impl:"Em implantação", req:"Sob demanda" };

type Item = { n: string; c: string; dark?: boolean; s: string; card?: CardContent };

/**
 * Resolve a lista de tiles de um grupo a partir do CMS, com fallback ao default
 * hardcoded. Cada item pode vir de um slot "item-*" (ordenado por .sort) cujo
 * metadata carrega { n, c, s, dark }; logo/cor também aceita image_url. Se
 * nenhum slot existir, devolve o array original — visual idêntico até editar.
 */
function resolveGroup(
  content: Record<string, CardContent> | undefined,
  prefix: string,
  fallback: Item[],
): Item[] {
  if (!content) return fallback;
  const slots = Object.keys(content)
    .filter((k) => k.startsWith(prefix))
    .sort((a, b) => (content[a]?.sort ?? 0) - (content[b]?.sort ?? 0));
  if (slots.length === 0) return fallback;
  return slots.map((k, i) => {
    const card = content[k];
    const meta = (card?.metadata ?? {}) as Record<string, unknown>;
    const base = fallback[i] ?? fallback[fallback.length - 1] ?? { n: "", c: "#000", s: "on" };
    return {
      n: card?.title ?? (typeof meta.n === "string" ? meta.n : base.n),
      c: card?.image_url ?? (typeof meta.c === "string" ? meta.c : base.c),
      s: typeof meta.s === "string" ? meta.s : base.s,
      dark: typeof meta.dark === "boolean" ? meta.dark : base.dark,
      card,
    };
  });
}

function Tile({ x }: { x: Item }) {
  return (
    <div className="intg-tile">
      <div className="intg-logo" style={{ background: x.c, color: x.dark ? "#14225A" : "#FFF" }}>
        {x.n.replace(/[^A-Za-z]/g,"").slice(0,2).toUpperCase()}
      </div>
      <div className="intg-name" style={{ ...cardTitleStyle(x.card) }}>{x.n}</div>
      <div className={`intg-status ${x.s}`}>{STATUS_LABEL[x.s]}</div>
    </div>
  );
}

export function Integracoes({ content }: { content?: Record<string, CardContent> }) {
  const [tab, setTab] = useState("plataformas");

  const plataformas = resolveGroup(content, "plataforma", PLATAFORMAS);
  const marketplaces = resolveGroup(content, "marketplace", MARKETPLACES);
  const gestao = resolveGroup(content, "gestao", GESTAO);
  const ALL = [...plataformas, ...marketplaces, ...gestao];

  const eyebrow = content?.eyebrow?.title ?? "Integrações";
  const lead =
    content?.lead?.description ??
    "Seus pedidos entram automaticamente na operação — sem digitação manual, sem retrabalho. Integramos com plataformas de ecommerce, marketplaces e sistemas de gestão.";

  const data = tab === "plataformas" ? plataformas : tab === "marketplaces" ? marketplaces : gestao;

  return (
    <section id="integracoes" className="section section-paper section-rule">
      <div className="shell">
        <div className="sec-head" style={{ marginBottom: 36 }}>
          <div>
            <div className="kicker">{eyebrow}</div>
            <h2 style={{ marginTop: 18 }}>
              {content?.heading?.title ?? (
                <>
                  Conectada às melhores plataformas <span className="serif-italic" style={{ color:"var(--red)" }}>do mercado</span>.
                </>
              )}
            </h2>
          </div>
          <p className="lead">
            {lead}
          </p>
        </div>

        {/* marquee */}
        <div className="clients" style={{ borderTop:"1px solid var(--rule)", borderBottom:"1px solid var(--rule)", marginBottom: 32 }}>
          <div className="clients-track" style={{ animationDuration:"28s" }}>
            {[...ALL, ...ALL].map((x, i) => (
              <span key={i} className="client-pill" style={{ fontSize: 20, opacity: .7 }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: x.c, display:"inline-block" }}/>
                {x.n}
              </span>
            ))}
          </div>
        </div>

        {/* tabs */}
        <div style={{ display:"flex", gap: 8, justifyContent:"center", marginBottom: 24, flexWrap:"wrap" }}>
          {([
            ["plataformas","Plataformas de ecommerce"],
            ["marketplaces","Marketplaces"],
            ["gestao","ERP & Conectores"],
          ] as const).map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} className="btn btn-sm"
              style={{
                background: tab===k ? "var(--navy)" : "transparent",
                color: tab===k ? "#FFF" : "var(--ink-soft)",
                border: tab===k ? "1px solid var(--navy)" : "1px solid var(--rule-strong)",
              }}>
              {l}
            </button>
          ))}
        </div>

        <div className="intg-grid">
          {data.map((x, i) => <Tile key={i} x={x}/>)}
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap: 16, marginTop: 32, padding: 22, borderRadius: 20, background:"var(--bg)", border:"1px solid var(--rule)" }}>
          <div style={{ display:"flex", gap: 20, flexWrap:"wrap" }}>
            {([["Ativo","var(--green)"],["Em implantação","var(--amber)"],["Sob demanda","var(--ink-mute)"]] as const).map(([l,c])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap: 8, fontSize: 13, color:"var(--ink-soft)" }}>
                <span style={{ width: 9, height: 9, borderRadius:"50%", background: c }}/> {l}
              </div>
            ))}
          </div>
          <a href="#contato" className="link-arrow" onClick={(e)=>{e.preventDefault();document.getElementById('contato')?.scrollIntoView({behavior:'smooth'});}}>
            Precisa de outra integração? Solicite <Icon.ArrowUR size={14}/>
          </a>
        </div>
      </div>
    </section>
  );
}
