"use client";

import { useState, useRef, useEffect } from "react";
import { Icon, unsplash } from "@/components/v3/icons";
import { Photo } from "@/components/v3/photo";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

// Process "video" — 4 frames simulating the operation:
// recebimento → triagem/separação → carregamento → entrega.
// Hover (or click) plays through the frames like a short clip.
const FRAMES = [
  { t: "Recebimento",  n: "01", scene: "boxes",    src: "1586528116311-ad8dd3c8310d", cap: "Conferência item a item na entrada" },
  { t: "Triagem & separação", n: "02", scene: "warehouse", src: "1553413077-190dd305871c", cap: "Time interno separando por rota e janela" },
  { t: "Carregamento", n: "03", scene: "van",      src: "1568010567469-8622db8079bf", cap: "Carga em moto e utilitário" },
  { t: "Entrega",      n: "04", scene: "courier",  src: "1601584115197-04ecc0da31d7", cap: "Última milha com evidência" },
];

type Frame = { t: string; n: string; scene: string; src: string; cap: string; titleStyle: React.CSSProperties; capStyle: React.CSSProperties };

export function Processo({ content }: { content?: Record<string, CardContent> }) {
  const c = content;

  const kicker = c?.eyebrow?.title ?? "Como operamos";
  const headingLine1 = c?.heading?.title ?? "Um processo simples,";
  const headingLine2 = c?.heading?.description ?? "monitorado e eficiente";
  const lead =
    c?.lead?.description ??
    "Do recebimento da mercadoria à entrega na porta do seu cliente. Passe o cursor sobre a imagem para ver a operação acontecer — recebimento, triagem pelo time interno, carregamento e entrega.";

  // Repeating steps: build from content slots starting with "item" (sorted by .sort);
  // fallback to the hardcoded FRAMES if none are provided.
  const itemCards = c
    ? Object.values(c)
        .filter((card) => card.slot.startsWith("item"))
        .sort((a, b) => a.sort - b.sort)
    : [];

  const frames: Frame[] = itemCards.length
    ? itemCards.map((card, i) => {
        const meta = card.metadata ?? {};
        const fb = FRAMES[i] ?? FRAMES[FRAMES.length - 1];
        return {
          t: card.title ?? fb.t,
          n: (meta.n as string) ?? fb.n,
          scene: (meta.scene as string) ?? fb.scene,
          src: (meta.icon as string) ?? (meta.src as string) ?? fb.src,
          cap: card.description ?? fb.cap,
          titleStyle: cardTitleStyle(card),
          capStyle: cardDescStyle(card),
        };
      })
    : FRAMES.map((f) => ({
        ...f,
        titleStyle: cardTitleStyle(undefined),
        capStyle: cardDescStyle(undefined),
      }));

  const [frame, setFrame] = useState(1); // start on triagem (mantida)
  const [playing, setPlaying] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const play = () => {
    if (playing) return;
    setPlaying(true);
    setFrame(0);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1;
      if (i >= frames.length) {
        if (timer.current) clearInterval(timer.current);
        setPlaying(false);
        setFrame(frames.length - 1);
        return;
      }
      setFrame(i);
    }, 1400);
  };

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

  return (
    <section className="section section-bg2">
      <div className="shell">
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 48, alignItems:"end", marginBottom: 40 }} className="proc-head">
          <div>
            <div className="kicker" style={cardTitleStyle(c?.["eyebrow"])}>{kicker}</div>
            <h2 style={{ marginTop: 22, ...cardTitleStyle(c?.["heading"]) }}>
              {headingLine1}<br/>
              <span className="serif-italic" style={{ color:"var(--red)", ...cardDescStyle(c?.["heading"]) }}>{headingLine2}</span>.
            </h2>
          </div>
          <p className="lead" style={cardDescStyle(c?.["lead"])}>
            {lead}
          </p>
        </div>

        <div
          className={`proc-stage ${playing ? "playing" : ""}`}
          onMouseEnter={play}
          onClick={play}
        >
          {frames.map((f, i) => (
            <div key={i} className={`frame ${i === frame ? "on" : ""}`}>
              <Photo scene={f.scene} src={unsplash(f.src, 1400)} alt={f.t}/>
            </div>
          ))}
          <div className="proc-veil"/>
          <div className="proc-play"><Icon.Send size={26}/></div>

          {/* caption */}
          <div style={{ position:"absolute", left: 22, top: 20, zIndex: 2, color:"#FFF" }}>
            <div className="mono" style={{ fontSize: 11, letterSpacing:".18em", opacity:.85 }}>
              {playing ? "REPRODUZINDO" : "PASSE O CURSOR"} · OPERAÇÃO SPOTLOG
            </div>
            <div style={{ fontFamily:"'Bricolage Grotesque','Geist',sans-serif", fontSize: 26, marginTop: 4, ...frames[frame].capStyle }}>
              {frames[frame].cap}
            </div>
          </div>

          <div className="proc-steps-bar">
            {frames.map((f, i) => (
              <div key={i} className={`proc-step-pill ${i === frame ? "on" : ""}`}
                   onClick={(e)=>{ e.stopPropagation(); if (timer.current) clearInterval(timer.current); setPlaying(false); setFrame(i); }}
                   style={{ cursor:"pointer" }}>
                <div className="n">{f.n}</div>
                <div className="t" style={f.titleStyle}>{f.t}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="photo-cap" style={{ marginTop: 14 }}>
          SUBSTITUÍVEL POR VÍDEO REAL DO RECEBIMENTO → TRIAGEM → CARREGAMENTO → ENTREGA
        </div>
      </div>

      <style>{`
        @media (max-width: 860px){ .proc-head{ grid-template-columns: 1fr !important; gap: 18px !important; } }
      `}</style>
    </section>
  );
}
