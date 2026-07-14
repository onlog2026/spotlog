"use client";

import { useState } from "react";
import { Icon } from "@/components/v3/icons";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";
import { serviceHref } from "@/components/v3/services-data";

const SERVICOS = [
  {
    n: "01", t: "Ecommerce", buy: "Crescimento das vendas", svc: "same-day",
    d: "Integração com as maiores plataformas e marketplaces, expedição rápida e melhor experiência do consumidor. Atendimento Same Day e Next Day.",
  },
  {
    n: "02", t: "Fulfillment", buy: "Escalabilidade", svc: "fulfillment",
    d: "Recebimento, armazenagem, separação, embalagem e expedição. Cresça sem aumentar a estrutura. Black Friday e picos deixam de ser problema.",
  },
  {
    n: "03", t: "Coleta Programada", buy: "Previsibilidade", svc: "coleta",
    d: "Retiradas em horários e frequências acordadas, rotas otimizadas e integração com Same Day e Next Day. Uma rotina logística confiável.",
  },
  {
    n: "04", t: "Entregador Dedicado", buy: "Exclusividade", svc: "dedicado",
    d: "Entregadores atuando como extensão da sua equipe, com disponibilidade exclusiva para coletas, entregas e atendimentos urgentes. Ideal para laboratórios, farmácias, hospitais e clínicas.",
  },
  {
    n: "05", t: "Logística Reversa", buy: "Experiência do cliente", svc: "reversa",
    d: "Coleta de devoluções, trocas, garantias e retornos com rastreabilidade total. Transforme devoluções em oportunidades de fidelização.",
  },
  {
    n: "06", t: "Operação Sob Demanda", buy: "Flexibilidade", svc: "sob-demanda",
    d: "Recursos logísticos adicionais sob demanda — motos, utilitários e equipes de apoio — para absorver picos de volume sem comprometer prazos.",
  },
  {
    n: "07", t: "Fármaco", buy: "Segurança e conformidade", svc: "farmaco",
    d: "Transporte de medicamentos, cosméticos e produtos regulados, com processos e documentação adequados às exigências do setor.",
  },
];

type ServiceRow = (typeof SERVICOS)[number] & { card?: CardContent };

export function Portfolio({ content }: { content?: Record<string, CardContent> }) {
  const [open, setOpen] = useState<number | null>(null);

  const c = content;

  const itemCards = c
    ? Object.values(c)
        .filter((card) => card.slot.startsWith("item"))
        .sort((a, b) => a.sort - b.sort)
    : [];

  const servicos: ServiceRow[] =
    itemCards.length > 0
      ? itemCards.map((card, i) => {
          const fallback = SERVICOS[i] ?? SERVICOS[SERVICOS.length - 1];
          return {
            n: (card.metadata?.n as string) ?? fallback.n,
            t: card.title ?? fallback.t,
            buy: card.description ?? fallback.buy,
            svc: (card.metadata?.svc as string) ?? fallback.svc,
            d: (card.metadata?.d as string) ?? fallback.d,
            card,
          };
        })
      : SERVICOS;

  return (
    <section id="servicos" className="section section-paper section-rule">
      <div className="shell">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 48, alignItems:"end", marginBottom: 40 }} className="pf-head">
          <div>
            <div className="kicker" style={{ ...cardTitleStyle(c?.["eyebrow"]) }}>{c?.eyebrow?.title ?? "Portfólio de serviços"}</div>
            <h2 style={{ marginTop: 22, ...cardTitleStyle(c?.["heading"]) }}>
              Cada serviço entrega<br/>
              um <span className="serif-italic" style={{ color:"var(--red)" }}>benefício</span> de negócio.
            </h2>
          </div>
          <p className="lead" style={{ ...cardDescStyle(c?.["lead"]) }}>
            {c?.lead?.description ??
              'O cliente não compra "frete". Compra crescimento, escalabilidade, previsibilidade e tranquilidade. Clique em cada serviço para ver como funciona.'}
          </p>
        </div>

        <div>
          {servicos.map((s, i) => {
            const isOpen = open === i;
            return (
              <div key={i} className="port-row" onClick={()=>setOpen(isOpen ? null : i)} style={{ cursor:"pointer" }}>
                <div className="pn">{s.n}</div>
                <div>
                  <div className="pt" style={{ ...cardTitleStyle(s.card) }}>{s.t}</div>
                  {isOpen && (
                    <div style={{ marginTop: 10, maxWidth:"62ch" }}>
                      <p className="pb" style={{ ...cardDescStyle(s.card) }}>{s.d}</p>
                      {s.svc && (
                        <a className="link-arrow" href={serviceHref(s.svc)} style={{ marginTop: 12, display: "inline-flex" }}
                          onClick={(e)=>e.stopPropagation()}>
                          Ver página completa <Icon.ArrowUR size={14}/>
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="pb">
                  <span className="tag tag-red" style={{ ...cardDescStyle(s.card) }}>{s.buy}</span>
                </div>
                <div className="pa">
                  <span style={{
                    width: 38, height: 38, borderRadius:"50%", border:"1px solid var(--rule-strong)",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    transition:"transform .2s ease, background .2s ease, color .2s ease",
                    transform: isOpen ? "rotate(45deg)" : "none",
                    background: isOpen ? "var(--red)" : "transparent",
                    borderColor: isOpen ? "var(--red)" : "var(--rule-strong)",
                    color: isOpen ? "#FFF" : "var(--ink)",
                  } as React.CSSProperties}>
                    <Icon.Plus size={16}/>
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 40, textAlign:"center" }}>
          <p className="lead" style={{ marginInline:"auto", textAlign:"center" }}>
            Da última milha à armazenagem, da farma à distribuição recorrente —
            <b style={{ color:"var(--ink)" }}> um operador logístico completo</b>.
          </p>
          <a href="#contato" className="btn btn-navy btn-lg" style={{ marginTop: 22 }} onClick={(e)=>{e.preventDefault();document.getElementById('contato')?.scrollIntoView({behavior:'smooth'});}}>
            Montar minha operação <Icon.Arrow size={16}/>
          </a>
        </div>
      </div>

      <style>{`
        @media (max-width: 860px){ .pf-head{ grid-template-columns: 1fr !important; gap: 18px !important; } }
      `}</style>
    </section>
  );
}
