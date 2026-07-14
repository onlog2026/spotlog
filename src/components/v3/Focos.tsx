"use client";

import type { ReactNode } from "react";
import { Icon } from "@/components/v3/icons";
import { unsplash } from "@/components/v3/icons";
import { Photo } from "@/components/v3/photo";
import { AnvisaBadge } from "@/components/v3/Anvisa";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";
import { serviceHref } from "@/components/v3/services-data";

type Foco = {
  id: string;
  svc: string;
  eyebrow: string;
  /** Texto do título com marcação leve: "\n" vira <br/>; *trecho* vira destaque serif-italic vermelho. */
  title: string;
  desc: string;
  trigger: string;
  cta: string;
  scene: string;
  src: string;
  badge: string;
  benefits: string[];
  rev: boolean;
  note?: string;
};

const FOCOS: Foco[] = [
  {
    id: "ecommerce", svc: "same-day",
    eyebrow: "Foco em Ecommerce",
    title: "Seu cliente compra hoje.\n*Nós entregamos hoje.*",
    desc: "Operação especializada em Same Day, Next Day e Fulfillment para ecommerces que precisam aumentar conversão, reduzir reclamações e acelerar o crescimento.",
    trigger: "Quanto sua empresa perde por atrasos na entrega? Transforme logística em vantagem competitiva.",
    cta: "Solicitar simulação gratuita",
    scene: "boxes",
    src: "1607082348824-0a96f2a4b9da",
    badge: "Same Day · Next Day",
    benefits: ["Entregas Same Day","Entregas Next Day","Fulfillment completo","Integração com marketplaces","Rastreamento em tempo real","Escalabilidade para picos"],
    rev: false,
  },
  {
    id: "farma", svc: "farmaco",
    eyebrow: "Foco Farmacêutico",
    title: "Logística farmacêutica com a *segurança* que sua operação exige.",
    desc: "Especializada em medicamentos, cosméticos e produtos regulados, com licenças e processos adequados às exigências do setor.",
    trigger: "Quando o produto é sensível, a logística não pode falhar.",
    cta: "Solicitar diagnóstico logístico",
    scene: "pharmacy",
    src: "1576091160550-2173dba999ef",
    badge: "Operação orientada à conformidade",
    benefits: ["Licenças regulatórias*","Transporte de medicamentos","Controle operacional","Rastreabilidade","SLA dedicado","Operação B2B e B2C"],
    rev: true,
    note: "*Licenças e documentos cadastrados e validados no painel administrativo. Não afirmamos certificações sem comprovação documental.",
  },
  {
    id: "crescimento", svc: "fulfillment",
    eyebrow: "Foco em Crescimento",
    title: "Sua logística está pronta para *escalar* com você?",
    desc: "Entregas com logística especializada para empresas que querem crescer sem perder eficiência — novas localidades, cobertura nacional e demandas sazonais.",
    trigger: "Crescemos na velocidade exigida pelos nossos clientes.",
    cta: "Receber proposta personalizada",
    scene: "city",
    src: "1494412574643-ff11b0a5c1c3",
    badge: "B2B · B2C · Latam",
    benefits: ["Operação B2B e B2C","Novas localidades","Cobertura nacional","Mercado Latam","Datas específicas","Necessidades esporádicas"],
    rev: false,
  },
  {
    id: "premium", svc: "dedicado",
    eyebrow: "Logística Premium",
    title: "Mais do que entregar pedidos.\n*Entregamos experiência.*",
    desc: "Atuamos como parceiro estratégico de empresas que buscam crescimento, eficiência operacional e uma experiência logística capaz de gerar valor para seus clientes.",
    trigger: "Atendimento dedicado, desenhado para a necessidade do seu negócio.",
    cta: "Receber proposta personalizada",
    scene: "team",
    src: "1521791136064-7986c2920216",
    badge: "Parceiro estratégico",
    benefits: ["Atendimento especializado","Rastreabilidade em tempo real","Equipe dedicada","Flexibilidade operacional","Soluções personalizadas","Operações escaláveis"],
    rev: true,
  },
];

/** Renderiza texto com marcação leve: cada "\n" vira quebra de linha; *trecho* vira destaque serif-italic vermelho. */
function renderRich(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
    return (
      <span key={li}>
        {parts.map((p, pi) =>
          p.startsWith("*") && p.endsWith("*") ? (
            <span key={pi} className="serif-italic" style={{ color: "var(--red)" }}>
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

function FocoBlock({ f, content }: { f: Foco; content?: Record<string, CardContent> }) {
  const card = content?.[`foco-${f.id}`];

  const eyebrow = card?.title ?? f.eyebrow;
  const titleText = (typeof card?.metadata?.title === "string" ? (card.metadata.title as string) : null) ?? f.title;
  const desc = card?.description ?? f.desc;
  const badge = (typeof card?.metadata?.badge === "string" ? (card.metadata.badge as string) : null) ?? f.badge;
  const cta = card?.cta_label ?? f.cta;
  const imgUrl = card?.image_url ?? `/cards/foco-${f.id}.svg`;

  return (
    <div id={f.id} className={`foco ${f.rev ? "rev" : ""}`}>
      <div className="foco-media">
        <Photo scene={f.scene} src={imgUrl} alt={eyebrow}/>
        <div style={{ position:"absolute", inset:0, background:"linear-gradient(180deg, rgba(12,22,64,.25), rgba(12,22,64,0) 40%)" }}/>
        <div style={{ position:"absolute", right: 22, top: 20 }}>
          <span className="tag" style={{ background:"rgba(225,27,34,.95)", color:"#FFF" }}>{badge}</span>
        </div>
      </div>

      <div className="foco-body">
        <div className="kicker" style={cardTitleStyle(card)}>{eyebrow}</div>
        <h3 style={{ marginTop: 16, fontSize: "clamp(28px,3.2vw,44px)", ...cardTitleStyle(card) }}>{renderRich(titleText)}</h3>
        <p className="lead" style={{ marginTop: 18, fontSize: 17, ...cardDescStyle(card) }}>{desc}</p>

        <div className="foco-benefits">
          {f.benefits.map((b, i) => (
            <div key={i} className="foco-benefit">
              <span className="ic"><Icon.Check size={11} stroke={3}/></span>
              {b}
            </div>
          ))}
        </div>

        <div style={{ marginTop: 26, paddingLeft: 18, borderLeft: "3px solid var(--red)" }}>
          <div className="foco-trigger">{f.trigger}</div>
        </div>

        {f.note && (
          <div style={{ display:"flex", flexDirection:"column", gap: 12, marginTop: 14 }}>
            {f.id === "farma" && <AnvisaBadge/>}
            <p style={{ fontSize: 12, color:"var(--ink-mute)", maxWidth:"54ch" }}>{f.note}</p>
          </div>
        )}

        <div style={{ marginTop: 26, display:"flex", gap: 12, flexWrap:"wrap", alignItems:"center" }}>
          <a href="#contato" className="btn btn-red" onClick={(e)=>{e.preventDefault();document.getElementById('contato')?.scrollIntoView({behavior:'smooth'});}}>
            {cta} <Icon.Arrow size={15}/>
          </a>
          {f.svc && (
            <a className="link-arrow" href={serviceHref(f.svc)} aria-label={`Ver página completa — ${eyebrow}`}>
              Ver página completa — {eyebrow} <Icon.ArrowUR size={14}/>
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function Focos({ content }: { content?: Record<string, CardContent> }) {
  const c = content;

  const eyebrow = c?.eyebrow?.title ?? "Soluções por objetivo";
  const heading =
    c?.heading?.title ??
    "Quatro formas de transformar logística em *vantagem competitiva*.";
  const lead =
    c?.lead?.description ??
    "Em vez de listar serviços, começamos pelo que importa pra você: o resultado. Escolha o foco da sua operação e veja a página completa de cada solução.";

  return (
    <section id="solucoes" className="section section-paper" style={{ paddingBottom: 0 }}>
      <div className="shell" style={{ marginBottom: 56 }}>
        <div className="sec-head">
          <div>
            <div className="kicker" style={cardTitleStyle(content?.["eyebrow"])}>{eyebrow}</div>
            <h2 style={{ marginTop: 18, ...cardTitleStyle(content?.["heading"]) }}>
              {renderRich(heading)}
            </h2>
          </div>
          <p className="lead" style={cardDescStyle(content?.["lead"])}>
            {lead}
          </p>
        </div>
      </div>

      <div className="shell" style={{ display:"flex", flexDirection:"column", gap: 40 }}>
        {FOCOS.map((f) => <FocoBlock key={f.id} f={f} content={content}/>)}
      </div>
    </section>
  );
}
