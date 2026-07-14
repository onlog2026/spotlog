"use client";

import Image from "next/image";
import { Icon } from "@/components/v3/icons";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

type ShowcaseItem = {
  type: "image" | "video";
  src: string;
  poster?: string;
  title: string;
  tag: string;
};

const DEFAULT_ITEMS: ShowcaseItem[] = [
  { type: "image", src: "/creatives/spotlog-creative-1.webp", title: "Controle total da coleta à entrega", tag: "Story" },
  { type: "video", src: "/videos/spotlog-creative-2.mp4", poster: "/creatives/spotlog-creative-2.webp", title: "Tecnologia + suporte humano", tag: "Vídeo" },
  { type: "image", src: "/creatives/spotlog-creative-2.webp", title: "Sua marca em boas mãos", tag: "Story" },
  { type: "image", src: "/creatives/spotlog-creative-3.webp", title: "Logística inteligente", tag: "Foto" },
  { type: "image", src: "/creatives/spotlog-creative-4.webp", title: "Spotlog na operação", tag: "Foto" },
];

export function Showcase({ content }: { content?: Record<string, CardContent> }) {
  const c = content;
  const eyebrow = c?.eyebrow?.title ?? "Spotlog na rua";
  const headingDefault = "A marca que seu cliente vê na *porta de casa*.";
  const heading = c?.heading?.title ?? headingDefault;
  const lead =
    c?.lead?.description ??
    "Frota padronizada, uniforme oficial, embalagem com sua identidade e atendimento humano. Veja como a Spotlog chega na ponta.";

  // Itens: cards do CMS (slots item-*) ou os criativos reais padrão.
  const itemCards = c
    ? Object.values(c)
        .filter((card) => card.slot.startsWith("item-"))
        .sort((a, b) => a.sort - b.sort)
    : [];
  const items: ShowcaseItem[] = itemCards.length
    ? itemCards.map((card, i) => {
        const fb = DEFAULT_ITEMS[i] ?? DEFAULT_ITEMS[0];
        const meta = card.metadata ?? {};
        const type = (meta.type as "image" | "video") ?? (fb.type as "image" | "video");
        return {
          type,
          src: card.image_url ?? fb.src,
          poster: (meta.poster as string) ?? fb.poster,
          title: card.title ?? fb.title,
          tag: (meta.tag as string) ?? fb.tag,
        };
      })
    : DEFAULT_ITEMS;

  // renderiza heading com *destaque* azul
  const headParts = heading.split(/(\*[^*]+\*)/g).filter(Boolean);

  return (
    <section id="showcase" className="section section-paper" style={{ overflow: "hidden" }}>
      <div className="shell">
        <div style={{ maxWidth: 680, marginInline: "auto", textAlign: "center", marginBottom: 44 }}>
          <div className="kicker" style={{ display: "inline-flex", ...cardTitleStyle(c?.eyebrow) }}>
            {eyebrow}
          </div>
          <h2 style={{ marginTop: 20, ...cardTitleStyle(c?.heading) }}>
            {headParts.map((p, i) =>
              p.startsWith("*") && p.endsWith("*") ? (
                <span key={i} className="serif-italic" style={{ color: "var(--navy)" }}>
                  {p.slice(1, -1)}
                </span>
              ) : (
                <span key={i}>{p}</span>
              ),
            )}
          </h2>
          <p className="lead" style={{ marginTop: 16, marginInline: "auto", ...cardDescStyle(c?.lead) }}>
            {lead}
          </p>
        </div>
      </div>

      {/* Carrossel full-bleed 9:16 */}
      <div className="showcase-rail">
        <div className="showcase-track">
          {items.map((it, i) => (
            <div className="showcase-card" key={i}>
              {it.type === "video" ? (
                <video
                  src={it.src}
                  poster={it.poster}
                  className="showcase-media"
                  autoPlay
                  loop
                  muted
                  playsInline
                />
              ) : (
                <Image
                  src={it.src}
                  alt={it.title}
                  fill
                  sizes="(max-width: 760px) 230px, 280px"
                  className="showcase-media"
                  unoptimized={it.src.endsWith(".svg") || it.src.includes("image.pollinations.ai")}
                />
              )}
              <div className="showcase-overlay" />
              <div className="showcase-tag">
                {it.type === "video" && <Icon.Arrow size={11} style={{ transform: "rotate(0deg)" }} />}
                {it.tag}
              </div>
              <div className="showcase-title">{it.title}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ textAlign: "center", marginTop: 18, fontSize: 12, color: "var(--ink-mute)" }}>
        Arraste para o lado para ver mais criativos →
      </div>

      <style>{`
        .showcase-rail{ overflow-x: auto; padding: 4px 0 12px; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
        .showcase-track{ display: flex; gap: 18px; padding-inline: max(24px, calc((100vw - 1280px) / 2 + 24px)); width: max-content; }
        .showcase-card{ position: relative; flex: 0 0 auto; width: 280px; aspect-ratio: 9/16; border-radius: 26px; overflow: hidden;
          background: var(--navy-deep); box-shadow: var(--shadow-md); border: 2px solid transparent; transition: border-color .2s ease, transform .3s ease; }
        .showcase-card:hover{ border-color: var(--navy); transform: translateY(-4px); }
        .showcase-media{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
        .showcase-overlay{ position: absolute; inset: 0; background: linear-gradient(to top, rgba(12,22,64,.88), transparent 55%); }
        .showcase-tag{ position: absolute; top: 12px; right: 12px; display: inline-flex; align-items: center; gap: 5px;
          background: rgba(255,255,255,.95); color: var(--navy); font-size: 10px; font-weight: 700; text-transform: uppercase;
          letter-spacing: .08em; padding: 5px 10px; border-radius: 999px; }
        .showcase-title{ position: absolute; left: 16px; right: 16px; bottom: 16px; color: #fff; font-weight: 700;
          font-size: 15px; line-height: 1.2; text-shadow: 0 2px 8px rgba(0,0,0,.4); }
        @media (max-width: 760px){ .showcase-card{ width: 230px; } .showcase-track{ padding-inline: 18px; } }
      `}</style>
    </section>
  );
}
