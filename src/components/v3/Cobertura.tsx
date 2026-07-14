"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { Icon } from "@/components/v3/icons";
import { Photo } from "@/components/v3/photo";
import { unsplash } from "@/components/v3/icons";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

type SpPoint = { name: string; x: number; y: number; tier: "cap" | "int" | "lit"; big?: boolean };

const SP_POINTS: SpPoint[] = [
  { name: "São Paulo (Capital)", x: 73, y: 58, tier: "cap", big: true },
  { name: "Guarulhos", x: 76, y: 52, tier: "cap" },
  { name: "ABC Paulista", x: 74, y: 67, tier: "cap" },
  { name: "Osasco", x: 69, y: 57, tier: "cap" },
  { name: "Barueri", x: 65, y: 56, tier: "cap" },
  { name: "Campinas", x: 60, y: 43, tier: "int" },
  { name: "Jundiaí", x: 66, y: 49, tier: "int" },
  { name: "Sorocaba", x: 56, y: 64, tier: "int" },
  { name: "Piracicaba", x: 52, y: 44, tier: "int" },
  { name: "São José dos Campos", x: 84, y: 51, tier: "int" },
  { name: "Ribeirão Preto", x: 42, y: 26, tier: "int" },
  { name: "São Carlos", x: 44, y: 38, tier: "int" },
  { name: "Bauru", x: 32, y: 42, tier: "int" },
  { name: "Pres. Prudente", x: 13, y: 48, tier: "int" },
  { name: "Santos / Baixada", x: 78, y: 75, tier: "lit" },
];

const TIER_STYLE: Record<string, { color: string; glow: string }> = {
  cap: { color: "var(--red)", glow: "rgba(255,55,66,.9)" },
  int: { color: "var(--navy)", glow: "rgba(92,140,255,.9)" },
  lit: { color: "var(--neon-cyan)", glow: "rgba(47,230,224,.9)" },
};

const CTRL: { ic: ReactNode; t: string; d: string; icon: string }[] = [
  { ic: <Icon.Pin size={16} />, t: "Rastreabilidade", d: "Cada parada com geolocalização, hora e status.", icon: "Pin" },
  { ic: <Icon.Camera size={16} />, t: "Evidência de entrega", d: "Foto e assinatura digital por pedido.", icon: "Camera" },
  { ic: <Icon.Doc size={16} />, t: "Gestão de ocorrências", d: "Causa, evidência e tratativa registradas.", icon: "Doc" },
  { ic: <Icon.Shield size={16} />, t: "SLA dedicado", d: "Acordos por cliente e tipo de entrega.", icon: "Shield" },
  { ic: <Icon.Truck size={16} />, t: "Coletas & rotas", d: "Programadas, recorrentes e otimizadas.", icon: "Truck" },
  { ic: <Icon.Star size={16} />, t: "Relatórios", d: "Performance por rota, cliente e período.", icon: "Star" },
];

// Renders an icon by name (from metadata.icon) at the 16px size used by the
// control grid; falls back to Pin so the layout never breaks.
function ctrlIcon(name: string): ReactNode {
  const map: Record<string, (p: { size?: number }) => ReactNode> = {
    Pin: Icon.Pin,
    Camera: Icon.Camera,
    Doc: Icon.Doc,
    Shield: Icon.Shield,
    Truck: Icon.Truck,
    Star: Icon.Star,
  };
  const Cmp = map[name] ?? Icon.Pin;
  return <Cmp size={16} />;
}

const ATEND: [string, string][] = [
  ["WhatsApp Business", "Resposta em poucos minutos, com humano."],
  ["SAC e chamados", "Cada ocorrência vira ticket com SLA."],
  ["E-mail dedicado", "SAC, financeiro e regulatório separados."],
  ["Gerente de conta", "Para operações dedicadas e premium."],
];

type Resultado = { atende: true; prazo: string; cidade: string; uf: string } | { atende: false };

function maskCep(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function Cobertura({ content }: { content?: Record<string, CardContent> }) {
  const c = content;

  // A — área de atuação (copy)
  const areaEyebrow = c?.["area-eyebrow"]?.title ?? "Área de atuação";
  const areaHeading = c?.["area-heading"]?.title ?? "interior do estado";
  const areaLead =
    c?.["area-lead"]?.description ??
    "Operamos a capital e toda a Região Metropolitana — e levamos sua carga ao interior de SP: Campinas, Sorocaba, Jundiaí, São José dos Campos, Ribeirão Preto, Baixada Santista e além, com estrutura para crescimento regional.";

  // B — controle operacional (copy + grid)
  const ctrlEyebrow = c?.["controle-eyebrow"]?.title ?? "Controle operacional";
  const ctrlHeading = c?.["controle-heading"]?.title ?? "gera confiança";
  const ctrlLead =
    c?.["controle-lead"]?.description ??
    "Do pedido à entrega, tudo acompanhado em tempo real. Menos chamados perdidos. Mais previsibilidade.";

  // CTRL items: build from content slots starting with "ctrl-" (sorted by .sort);
  // fallback to the hardcoded CTRL array if none are provided.
  const ctrlCards = c
    ? Object.values(c)
        .filter((card) => card.slot.startsWith("ctrl-"))
        .sort((a, b) => a.sort - b.sort)
    : [];
  const ctrlItems: { ic: ReactNode; t: string; d: string }[] = ctrlCards.length
    ? ctrlCards.map((card, i) => {
        const fb = CTRL[i] ?? CTRL[CTRL.length - 1];
        const iconName = (card.metadata?.icon as string) ?? fb.icon;
        return { ic: ctrlIcon(iconName), t: card.title ?? fb.t, d: card.description ?? fb.d };
      })
    : CTRL;

  // C — atendimento (copy + photo + grid)
  const atendEyebrow = c?.["atend-eyebrow"]?.title ?? "Atendimento";
  const atendHeading = c?.["atend-heading"]?.title ?? "clareza e agilidade";
  const atendLead =
    c?.["atend-lead"]?.description ??
    "Quando você abre um chamado ou liga, quem responde é alguém do time que conhece o seu segmento e tem o histórico da operação na frente. Tecnologia onde precisa ser invisível, gente quando precisa ser humano.";
  const atendImage = c?.["atend-image"]?.image_url ?? unsplash("1573497019940-1c28c88b4f3e", 900);
  const atendImageMobile = c?.["atend-image"]?.image_url_mobile ?? null;

  // ATEND items: build from content slots starting with "atend-" + numeric (sorted by .sort);
  // fallback to the hardcoded ATEND array if none are provided.
  const atendCards = c
    ? Object.values(c)
        .filter((card) => /^atend-\d+$/.test(card.slot))
        .sort((a, b) => a.sort - b.sort)
    : [];
  const atendItems: [string, string][] = atendCards.length
    ? atendCards.map((card, i) => {
        const fb = ATEND[i] ?? ATEND[ATEND.length - 1];
        return [card.title ?? fb[0], card.description ?? fb[1]];
      })
    : ATEND;

  const [cep, setCep] = useState("");
  const [loading, setLoading] = useState(false);
  const [res, setRes] = useState<Resultado | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  async function verificar(e: FormEvent) {
    e.preventDefault();
    const digits = cep.replace(/\D/g, "");
    if (digits.length !== 8) {
      setErro("Digite um CEP com 8 números.");
      setRes(null);
      return;
    }
    setErro(null);
    setLoading(true);
    setRes(null);
    try {
      const r = await fetch(`/api/abrangencia?cep=${digits}`);
      setRes((await r.json()) as Resultado);
    } catch {
      setErro("Não foi possível consultar agora. Tente de novo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <section id="cobertura" className="section section-bg2">
        <div className="shell">
          <div className="sec-head" style={{ marginBottom: 36 }}>
            <div>
              <div className="kicker" style={cardTitleStyle(c?.["area-eyebrow"])}>{areaEyebrow}</div>
              <h2 style={{ marginTop: 18 }}>
                São Paulo e todo o<br />
                <span className="serif-italic" style={{ color: "var(--red)", ...cardTitleStyle(c?.["area-heading"]) }}>{areaHeading}</span>.
              </h2>
            </div>
            <div>
              <p className="lead" style={cardDescStyle(c?.["area-lead"])}>
                {areaLead}
              </p>
              <form
                onSubmit={verificar}
                style={{
                  marginTop: 22,
                  display: "flex",
                  gap: 8,
                  padding: 6,
                  background: "var(--paper)",
                  border: "1px solid var(--rule-strong)",
                  borderRadius: 999,
                  maxWidth: 460,
                }}
              >
                <input
                  className="input"
                  style={{ border: "none", background: "transparent", height: 48 }}
                  placeholder="Digite seu CEP — ex: 13010-111"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  value={cep}
                  onChange={(e) => {
                    setCep(maskCep(e.target.value));
                    setErro(null);
                  }}
                />
                <button className="btn btn-red" style={{ height: 48 }} type="submit" disabled={loading}>
                  <Icon.Search size={15} /> {loading ? "..." : "Verificar"}
                </button>
              </form>

              {erro && <p style={{ marginTop: 10, fontSize: 13, color: "var(--red)", fontWeight: 600 }}>{erro}</p>}

              {res?.atende === true && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "14px 18px",
                    borderRadius: 16,
                    background: "rgba(31,157,107,.10)",
                    border: "1px solid rgba(31,157,107,.35)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 700, color: "var(--green)" }}>
                    <Icon.Check size={18} /> Atendemos sua região!
                  </div>
                  <div style={{ marginTop: 6, fontSize: 15, color: "var(--ink)" }}>
                    Prazo de entrega:{" "}
                    <strong style={{ fontSize: 18 }}>{res.prazo}</strong>{" "}
                    <span style={{ color: "var(--ink-mute)", fontSize: 12.5 }}>(dias úteis após a coleta)</span>
                  </div>
                  <a
                    href="#contato"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="btn btn-red btn-sm"
                    style={{ marginTop: 12 }}
                  >
                    Solicitar simulação gratuita <Icon.Arrow size={13} />
                  </a>
                </div>
              )}

              {res?.atende === false && (
                <div
                  style={{
                    marginTop: 14,
                    padding: "14px 18px",
                    borderRadius: 16,
                    background: "var(--paper)",
                    border: "1px solid var(--rule-strong)",
                  }}
                >
                  <div style={{ fontWeight: 700, color: "var(--ink)" }}>Ainda não temos rota fixa nessa região</div>
                  <p style={{ fontSize: 13.5, color: "var(--ink-mute)", marginTop: 4 }}>
                    Mas atendemos demandas sob medida e operações sazonais. Fala com a gente que
                    montamos uma solução pro seu CEP.
                  </p>
                  <a
                    href="#contato"
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="btn btn-ghost btn-sm"
                    style={{ marginTop: 12 }}
                  >
                    Falar com um especialista
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* BIG state map */}
          <div className="cov-map">
            <svg viewBox="0 0 1000 560" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", inset: 0 }}>
              <defs>
                <pattern id="gridmapBig" width="32" height="32" patternUnits="userSpaceOnUse">
                  <path d="M32 0H0V32" stroke="rgba(255,255,255,0.05)" strokeWidth="1" fill="none" />
                </pattern>
                <linearGradient id="spFill" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="rgba(92,140,255,0.16)" />
                  <stop offset="100%" stopColor="rgba(255,55,66,0.10)" />
                </linearGradient>
              </defs>
              <rect width="1000" height="560" fill="url(#gridmapBig)" />
              <path
                d="M70 300 C 120 250, 210 250, 280 235 C 360 218, 430 170, 520 175
                   C 620 180, 700 150, 780 200 C 860 245, 905 280, 900 330
                   C 895 380, 840 410, 790 430 C 760 470, 700 470, 660 445
                   C 600 470, 520 460, 470 430 C 410 445, 340 430, 300 395
                   C 230 400, 150 380, 110 345 C 80 330, 60 320, 70 300 Z"
                fill="url(#spFill)"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1.6"
              />
              <path d="M150 330 C 320 300, 480 320, 730 360" fill="none" stroke="rgba(255,55,66,.45)" strokeWidth="2" strokeDasharray="2 9">
                <animate attributeName="stroke-dashoffset" from="0" to="-110" dur="6s" repeatCount="indefinite" />
              </path>
              <path d="M420 250 C 560 270, 660 300, 740 370" fill="none" stroke="rgba(47,230,224,.4)" strokeWidth="2" strokeDasharray="2 9">
                <animate attributeName="stroke-dashoffset" from="0" to="-110" dur="7.5s" repeatCount="indefinite" />
              </path>
            </svg>

            {SP_POINTS.map((p, i) => {
              const st = TIER_STYLE[p.tier];
              return (
                <div key={i} style={{ position: "absolute", left: `${p.x}%`, top: `${p.y}%` }}>
                  <div className="cov-dot" style={{ width: p.big ? 16 : 11, height: p.big ? 16 : 11, background: st.color }} />
                  <div
                    className="cov-label"
                    style={{
                      position: "absolute",
                      left: 16,
                      top: -9,
                      background: "rgba(10,17,42,.86)",
                      backdropFilter: "blur(6px)",
                      border: `1px solid ${st.color}`,
                      color: "#EAF0FF",
                      padding: "4px 10px",
                      borderRadius: 999,
                      fontSize: 11.5,
                      fontFamily: "'JetBrains Mono',monospace",
                      whiteSpace: "nowrap",
                      boxShadow: `0 0 14px -4px ${st.glow}`,
                    }}
                  >
                    {p.name}
                  </div>
                </div>
              );
            })}

            <div
              style={{
                position: "absolute",
                left: 20,
                bottom: 18,
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                background: "rgba(8,13,32,.6)",
                backdropFilter: "blur(6px)",
                border: "1px solid var(--rule)",
                borderRadius: 12,
                padding: "10px 14px",
              }}
            >
              {([["Capital & RMSP", "var(--red)"], ["Interior de SP", "var(--navy)"], ["Litoral / Baixada", "var(--neon-cyan)"]] as [string, string][]).map(([l, c]) => (
                <div key={l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "#C7CDE8" }}>
                  <span style={{ width: 10, height: 10, borderRadius: "50%", background: c, boxShadow: `0 0 10px ${c}` }} /> {l}
                </div>
              ))}
            </div>
            <div className="cov-title" style={{ position: "absolute", right: 22, top: 20, fontFamily: "'Bricolage Grotesque','Geist',sans-serif", fontSize: 28, color: "#FFF", opacity: 0.85 }}>
              Estado de São Paulo
            </div>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 22 }}>
            {["São Paulo (Capital)", "Grande SP / RMSP", "ABC Paulista", "Guarulhos", "Osasco", "Barueri", "Campinas", "Americana", "Indaiatuba", "Hortolândia", "Sorocaba", "Jundiaí", "Piracicaba", "São José dos Campos", "Ribeirão Preto", "São Carlos", "Bauru", "Baixada Santista"].map((c) => (
              <span key={c} className="tag tag-navy">
                {c}
              </span>
            ))}
          </div>
        </div>
        <style>{`
          .cov-map{ position: relative; width: 100%; aspect-ratio: 1000/560; min-height: 360px;
            background: linear-gradient(160deg, #0A1330 0%, #070C20 100%);
            border: 1px solid var(--rule); border-radius: var(--radius-xl); overflow: hidden;
            box-shadow: 0 0 0 1px rgba(255,255,255,.04), 0 30px 80px -34px rgba(59,123,255,.4); }
          @media (max-width: 760px){
            .cov-map{ aspect-ratio: 1000/620; min-height: 300px; }
            /* rótulos das cidades (pills nowrap) estouram em tela estreita → some;
               os nomes ficam nas tags abaixo. Mantém pontos + shape decorativos. */
            .cov-label{ display: none !important; }
            .cov-title{ font-size: 15px !important; right: 12px !important; top: 12px !important; }
          }
        `}</style>
      </section>

      {/* Controle operacional — navy */}
      <section className="section section-navy">
        <div className="shell">
          <div style={{ textAlign: "center", maxWidth: 720, marginInline: "auto" }}>
            <div className="kicker" style={{ display: "inline-flex" }}>{ctrlEyebrow}</div>
            <h2 style={{ marginTop: 22 }}>
              Visibilidade que<br />
              <span className="serif-italic" style={{ color: "#FF6B6F" }}>{ctrlHeading}</span>.
            </h2>
            <p className="lead" style={{ marginTop: 18, marginInline: "auto" }}>
              {ctrlLead}
            </p>
          </div>

          <div className="cols-3" style={{ marginTop: 44 }}>
            {ctrlItems.map((item, i) => (
              <div key={i} style={{ padding: 24, borderRadius: 18, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.12)" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: "rgba(255,107,111,.16)", color: "#FF8488", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {item.ic}
                </div>
                <div style={{ fontWeight: 600, fontSize: 17, marginTop: 16, color: "#FFF" }}>{item.t}</div>
                <p style={{ fontSize: 14, marginTop: 6, color: "#A9B2D8" }}>{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Atendimento — woman photo */}
      <section className="section section-paper">
        <div className="shell">
          <div style={{ display: "grid", gridTemplateColumns: "0.85fr 1.1fr", gap: 56, alignItems: "center" }} className="at-grid">
            <div style={{ position: "relative" }}>
              {atendImageMobile ? (
                <>
                  <Photo scene="team" src={atendImage} alt="Atendimento Spotlog" ratio="4/5" className="at-photo-desk" style={{ borderRadius: "var(--radius-xl)" }} />
                  <Photo scene="team" src={atendImageMobile} alt="Atendimento Spotlog" ratio="4/5" className="at-photo-mob" style={{ borderRadius: "var(--radius-xl)" }} />
                </>
              ) : (
                <Photo scene="team" src={atendImage} alt="Atendimento Spotlog" ratio="4/5" style={{ borderRadius: "var(--radius-xl)" }} />
              )}
              <div className="sticker" style={{ bottom: 22, left: -10 }}>gente de verdade ♥</div>
            </div>
            <div>
              <div className="kicker">{atendEyebrow}</div>
              <h2 style={{ marginTop: 22 }}>
                Orientado por qualidade,<br />
                <span className="serif-italic" style={{ color: "var(--red)" }}>{atendHeading}</span>.
              </h2>
              <p className="lead" style={{ marginTop: 20, maxWidth: "52ch" }}>
                {atendLead}
              </p>

              <div className="cols-2" style={{ marginTop: 28 }}>
                {atendItems.map(([t, d], i) => (
                  <div key={i} style={{ borderTop: "1px solid var(--rule)", paddingTop: 14 }}>
                    <div style={{ fontWeight: 600, fontSize: 15.5 }}>{t}</div>
                    <div style={{ fontSize: 13.5, color: "var(--ink-mute)", marginTop: 4 }}>{d}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <style>{`
          @media (max-width: 980px){ .at-grid{ grid-template-columns: 1fr !important; gap: 32px !important; } }
          .at-photo-mob{ display: none; }
          @media (max-width: 760px){
            .at-photo-desk{ display: none; }
            .at-photo-mob{ display: block; }
          }
        `}</style>
      </section>
    </>
  );
}
