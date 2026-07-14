"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "@/components/v3/icons";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

const MOCK: Record<
  string,
  {
    title: string;
    status: string;
    eta: string;
    driver: string;
    route: string;
    progress: number;
    steps: { t: string; d: string; done?: boolean; active?: boolean }[];
  }
> = {
  "SPL-2841-9": {
    title: "Manipulado · Pinheiros, SP",
    status: "em rota",
    eta: "Hoje, ~11:42",
    driver: "André R.",
    route: "Rota 04 · Zona Oeste",
    progress: 68,
    steps: [
      { t: "Pedido criado", d: "hoje · 08:12", done: true },
      { t: "Coletado", d: "hoje · 09:48", done: true },
      { t: "Em separação", d: "hoje · 10:02", done: true },
      { t: "Em rota", d: "agora", active: true },
      { t: "Tentativa de entrega", d: "previsão 11:35" },
      { t: "Entregue", d: "—" },
    ],
  },
  "SPL-4218-3": {
    title: "Pedido ecommerce · Itaim Bibi, SP",
    status: "entregue",
    eta: "Ontem, 16:21",
    driver: "Lucas M.",
    route: "Rota 07 · Zona Sul",
    progress: 100,
    steps: [
      { t: "Pedido criado", d: "-1d · 14:02", done: true },
      { t: "Coletado", d: "-1d · 15:01", done: true },
      { t: "Em rota", d: "-1d · 15:42", done: true },
      { t: "Entregue", d: "-1d · 16:21", done: true },
    ],
  },
};

/** Ícones de status disponíveis, selecionáveis via metadata.icon do CMS. */
const STATUS_ICONS: Record<string, ReactNode> = {
  box: <Icon.Box size={16} />,
  truck: <Icon.Truck size={16} />,
  pin: <Icon.Pin size={16} />,
  check: <Icon.Check size={16} />,
  doc: <Icon.Doc size={16} />,
};

const STATUSES: { lab: string; dsc: string; c: string; icon: string }[] = [
  { lab: "Pedido criado", dsc: "Recebemos seu pedido no sistema.", c: "var(--navy)", icon: "box" },
  { lab: "Coletado", dsc: "Mercadoria retirada e conferida.", c: "var(--navy)", icon: "truck" },
  { lab: "Em rota", dsc: "A caminho do endereço de entrega.", c: "var(--red)", icon: "pin" },
  { lab: "Entregue", dsc: "Com foto e assinatura do recebedor.", c: "var(--green)", icon: "check" },
  { lab: "Ocorrência", dsc: "Algo precisou de atenção — tratado e registrado.", c: "var(--amber)", icon: "doc" },
];

function tagFor(s: string) {
  if (s === "entregue") return <span className="tag tag-green">entregue</span>;
  if (s === "ocorrência") return <span className="tag tag-amber">ocorrência</span>;
  return <span className="tag tag-red">em rota</span>;
}

type ResultState =
  | ({ code: string } & (typeof MOCK)[keyof typeof MOCK])
  | null;

export function Rastreio({ content }: { content?: Record<string, CardContent> }) {
  // Textos editáveis (fallback ao valor hardcoded atual — idêntico até ser editado).
  const eyebrow = content?.["eyebrow"]?.title ?? "Acompanhe sua operação";
  const headingLine1 = content?.["heading"]?.title ?? "Do pedido à entrega,";
  const headingLine2 = content?.["heading"]?.description ?? "de qualquer lugar";
  const lead =
    content?.["lead"]?.description ??
    "Cole o código que você recebeu e veja status, motorista, previsão e evidência. Seu cliente final também acompanha — menos chamados, mais satisfação.";
  const statusEyebrow = content?.["status_eyebrow"]?.title ?? "Transparência";
  const statusHeading = content?.["status_heading"]?.title ?? "O que cada status significa";

  // Lista de status: slots "item-*" ordenados por .sort; senão, array hardcoded.
  const statusSlots = content
    ? Object.values(content)
        .filter((card) => card.slot.startsWith("item"))
        .sort((a, b) => a.sort - b.sort)
    : [];
  const statuses =
    statusSlots.length > 0
      ? statusSlots.map((card, i) => ({
          lab: card.title ?? STATUSES[i]?.lab ?? "",
          dsc: card.description ?? STATUSES[i]?.dsc ?? "",
          c: (card.metadata?.color as string) ?? STATUSES[i]?.c ?? "var(--navy)",
          icon: (card.metadata?.icon as string) ?? STATUSES[i]?.icon ?? "box",
          labStyle: cardTitleStyle(card),
          dscStyle: cardDescStyle(card),
        }))
      : STATUSES.map((s) => ({
          ...s,
          labStyle: cardTitleStyle(undefined),
          dscStyle: cardDescStyle(undefined),
        }));

  const [code, setCode] = useState("");
  const [result, setResult] = useState<ResultState>(null);
  const [notFound, setNotFound] = useState(false);

  const search = (e?: { preventDefault?: () => void }) => {
    e?.preventDefault?.();
    const c = code.trim().toUpperCase();
    if (!c) return;
    const r = MOCK[c];
    if (r) {
      setResult({ code: c, ...r });
      setNotFound(false);
    } else {
      setResult(null);
      setNotFound(true);
    }
  };

  return (
    <section id="rastreio" className="section section-bg2">
      <div className="shell">
        {/* App mock + tracking input */}
        <div style={{ display: "grid", gridTemplateColumns: "0.9fr 1.1fr", gap: 56, alignItems: "center", marginBottom: 80 }} className="app-grid">
          <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
            <div className="phone">
              <div className="phone-screen" style={{ background: "#FFF", display: "flex", flexDirection: "column" }}>
                <div style={{ background: "#0D1B45", padding: "20px 16px 16px", color: "#FFF" }}>
                  <div className="mono" style={{ fontSize: 10, opacity: .7 }}>SPOTLOG APP</div>
                  <div style={{ fontFamily: "'Bricolage Grotesque','Geist',sans-serif", fontSize: 22, marginTop: 4 }}>Suas entregas</div>
                  <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                    <span className="tag" style={{ background: "rgba(255,255,255,.14)", color: "#FFF", height: 24 }}>12 hoje</span>
                    <span className="tag tag-green" style={{ height: 24 }}>10 entregues</span>
                  </div>
                </div>
                <div style={{ padding: 12, display: "flex", flexDirection: "column", gap: 8, flex: 1, overflow: "hidden" }}>
                  {([
                    ["SPL-2841", "em rota", "var(--red)"],
                    ["SPL-2840", "coletado", "var(--navy)"],
                    ["SPL-2839", "entregue", "var(--green)"],
                    ["SPL-2838", "separação", "var(--navy)"],
                  ] as [string, string, string][]).map(([id, st, c], i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 12, background: "#F4F5FA", border: "1px solid rgba(18,26,51,.10)" }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
                      <div style={{ flex: 1 }}>
                        <div className="mono" style={{ fontSize: 11, color: "#121A33" }}>{id}</div>
                        <div style={{ fontSize: 11, color: "#6B739A" }}>{st}</div>
                      </div>
                      <span style={{ color: "#6B739A" }}><Icon.Arrow size={13} /></span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticker" style={{ top: 10, right: 0 }}>tempo real</div>
          </div>

          <div>
            <div className="kicker" style={cardTitleStyle(content?.["eyebrow"])}>{eyebrow}</div>
            <h2 style={{ marginTop: 22, ...cardTitleStyle(content?.["heading"]) }}>
              {headingLine1}<br />
              <span className="serif-italic" style={{ color: "var(--red)", ...cardDescStyle(content?.["heading"]) }}>{headingLine2}</span>.
            </h2>
            <p className="lead" style={{ marginTop: 20, maxWidth: "52ch", ...cardDescStyle(content?.["lead"]) }}>
              {lead}
            </p>

            <form onSubmit={search} style={{ marginTop: 26, display: "flex", gap: 8, padding: 6, background: "var(--paper)", border: "1px solid var(--rule-strong)", borderRadius: 999 }}>
              <input className="input" style={{ border: "none", background: "transparent", height: 48, fontSize: 16 }} placeholder="Ex: SPL-2841-9" value={code} onChange={e => setCode(e.target.value)} />
              <button className="btn btn-red" type="submit" style={{ height: 48 }}><Icon.Search size={15} /> Rastrear</button>
            </form>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 14, alignItems: "center" }}>
              <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>Demos:</span>
              {Object.keys(MOCK).map(c => (
                <button key={c} className="tag" style={{ cursor: "pointer" }} onClick={() => { setCode(c); setTimeout(search, 30); }}>{c}</button>
              ))}
            </div>

            {/* result */}
            {(result || notFound) && (
              <div className="card" style={{ padding: 22, marginTop: 22 }}>
                {notFound && (
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <span style={{ width: 44, height: 44, borderRadius: "50%", background: "var(--red-soft)", color: "var(--red-dark)", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon.Search size={20} /></span>
                    <div>
                      <div style={{ fontWeight: 600 }}>Não encontramos esse código.</div>
                      <div style={{ fontSize: 13.5, color: "var(--ink-mute)" }}>Confira a digitação ou fale com o suporte.</div>
                    </div>
                  </div>
                )}
                {result && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div className="mono" style={{ fontSize: 11, color: "var(--ink-mute)" }}>{result.code}</div>
                        <div style={{ fontWeight: 600, fontSize: 16, marginTop: 4 }}>{result.title}</div>
                        <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 2 }}>{result.driver} · {result.route} · {result.eta}</div>
                      </div>
                      {tagFor(result.status)}
                    </div>
                    <div style={{ height: 6, background: "var(--bg-2)", borderRadius: 99, marginTop: 16 }}>
                      <div style={{ height: "100%", width: `${result.progress}%`, background: "var(--red)", borderRadius: 99, transition: "width .8s ease" }} />
                    </div>
                    <div className="tl" style={{ marginTop: 12 }}>
                      {result.steps.map((s, i) => (
                        <div key={i} className="tl-step">
                          <div className={`tl-node ${s.done ? "done" : s.active ? "active" : ""}`}>{s.done ? <Icon.Check size={12} stroke={3} /> : s.active ? "•" : ""}</div>
                          <div><div style={{ fontWeight: 500, fontSize: 13.5 }}>{s.t}</div><div className="mono" style={{ fontSize: 10.5, color: "var(--ink-mute)", marginTop: 2 }}>{s.d}</div></div>
                          <div>{s.active && <span className="tag tag-red">agora</span>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Status meaning */}
        <div style={{ textAlign: "center", maxWidth: 680, marginInline: "auto" }}>
          <div className="kicker muted" style={{ display: "inline-flex", ...cardTitleStyle(content?.["status_eyebrow"]) }}>{statusEyebrow}</div>
          <h3 style={{ marginTop: 16, ...cardTitleStyle(content?.["status_heading"]) }}>{statusHeading}</h3>
        </div>
        <div className="status-track">
          {statuses.map((s, i) => (
            <div key={i} className="status-node">
              <div className="dot" style={{ background: s.c }}>{STATUS_ICONS[s.icon] ?? STATUS_ICONS.box}</div>
              <div className="lab" style={s.labStyle}>{s.lab}</div>
              <div className="dsc" style={s.dscStyle}>{s.dsc}</div>
            </div>
          ))}
        </div>
      </div>

      <style>{`@media (max-width: 980px){ .app-grid{ grid-template-columns: 1fr !important; gap: 36px !important; } }`}</style>
    </section>
  );
}
