"use client";

import { Icon, unsplash } from "@/components/v3/icons";
import { Photo } from "@/components/v3/photo";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

const POSTS = [
  {
    cat: "Logística farma",
    title: "Por que a logística farma exige mais controle?",
    excerpt: "Produtos sensíveis pedem processo, rastreabilidade e documentação. Veja o que muda na operação.",
    read: "5 min", scene: "pharmacy", src: "1researcher", img: "1581093588401-fbb62a02f120",
  },
  {
    cat: "Ecommerce",
    title: "Como o rastreamento reduz reclamações no pós-venda",
    excerpt: "Comunicação proativa derruba chamados em até 40%. Entenda a mecânica por trás disso.",
    read: "4 min", scene: "boxes", img: "1607082349566-187342175e2f",
  },
  {
    cat: "Fulfillment",
    title: "Quanto sua empresa economiza com fulfillment profissional",
    excerpt: "Crescer sem aumentar estrutura é possível. Fazemos a conta junto com você.",
    read: "6 min", scene: "warehouse", img: "1553413077-190dd305871c",
  },
];

type PostCard = {
  cat: string;
  title: string;
  excerpt: string;
  read: string;
  scene: string;
  img: string;
  titleStyle: React.CSSProperties;
  descStyle: React.CSSProperties;
};

export function Blog({ content }: { content?: Record<string, CardContent> }) {
  const c = content;

  const eyebrow = c?.eyebrow?.title ?? "Conteúdo";
  const heading = c?.heading?.title;
  const lead =
    c?.lead?.description ??
    "Conteúdo prático sobre logística para ecommerce e farma, rastreabilidade e operação — para quem quer entregar melhor e crescer com previsibilidade.";

  const itemSlots = Object.values(c ?? {})
    .filter((card) => card.slot.startsWith("item"))
    .sort((a, b) => a.sort - b.sort);

  const posts: PostCard[] =
    itemSlots.length > 0
      ? itemSlots.map((card, i) => {
          const meta = card.metadata;
          const fallback = POSTS[i] ?? POSTS[POSTS.length - 1];
          return {
            cat: (meta.tag as string | undefined) ?? fallback.cat,
            title: card.title ?? fallback.title,
            excerpt: card.description ?? fallback.excerpt,
            read: (meta.read as string | undefined) ?? fallback.read,
            scene: (meta.scene as string | undefined) ?? fallback.scene,
            img: card.image_url ?? unsplash(fallback.img, 800),
            titleStyle: cardTitleStyle(card),
            descStyle: cardDescStyle(card),
          };
        })
      : POSTS.map((p) => ({
          cat: p.cat,
          title: p.title,
          excerpt: p.excerpt,
          read: p.read,
          scene: p.scene,
          img: unsplash(p.img, 800),
          titleStyle: cardTitleStyle(undefined),
          descStyle: cardDescStyle(undefined),
        }));

  return (
    <section id="blog" className="section section-paper section-rule">
      <div className="shell">
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"end", flexWrap:"wrap", gap: 20, marginBottom: 40 }}>
          <div>
            <div className="kicker" style={cardTitleStyle(c?.["eyebrow"])}>{eyebrow}</div>
            <h2 style={{ marginTop: 22, ...cardTitleStyle(c?.["heading"]) }}>
              {heading ?? (
                <>
                  Logística que <span className="serif-italic" style={{ color:"var(--red)" }}>ensina</span>,
                  não só entrega.
                </>
              )}
            </h2>
          </div>
          <div style={{ maxWidth: 460 }}>
            <p className="lead" style={{ marginBottom: 16, ...cardDescStyle(c?.["lead"]) }}>
              {lead}
            </p>
            <a href="/blog" className="link-arrow">Ver todos os artigos <Icon.ArrowUR size={14}/></a>
          </div>
        </div>

        <div className="cols-3">
          {posts.map((p, i) => (
            <a key={i} href={(p as { href?: string }).href || "/blog"} className="blog-card">
              <div style={{ position:"relative" }}>
                <Photo scene={p.scene} src={p.img} alt={p.title}/>
                <span className="tag tag-red" style={{ position:"absolute", top: 14, right: 14 }}>{p.cat}</span>
              </div>
              <div className="blog-card-body">
                <h4 style={{ fontSize: 21, ...p.titleStyle }}>{p.title}</h4>
                <p style={{ fontSize: 14, ...p.descStyle }}>{p.excerpt}</p>
                <div className="kicker no-rule muted" style={{ marginTop:"auto", fontSize: 10 }}>
                  Leitura {p.read} <span className="divider-dot"/> Blog Spotlog
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
