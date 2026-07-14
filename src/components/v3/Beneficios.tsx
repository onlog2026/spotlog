"use client";

import type { CSSProperties } from "react";
import { useCountUp } from "@/components/v3/hooks";
import type { CardContent } from "@/components/v3/cms";
import { cardTitleStyle, cardDescStyle } from "@/components/v3/cardStyle";

type Client = { n: string; tag?: string; titleStyle?: CSSProperties };
type Metric = {
  target: number;
  u: string;
  label: string;
  decimals: number;
  suffix: string;
  labelStyle?: CSSProperties;
  unitStyle?: CSSProperties;
};

const CLIENTS: Client[] = [
  { n: "Ultrafarma" },
  { n: "Drogaria São Paulo" },
  { n: "Miess", tag: "novo" },
  { n: "Bouclé", tag: "novo" },
  { n: "Dandas Cosméticos", tag: "novo" },
];

const METRICS: Metric[] = [
  { target: 98, u: "%", label: "Entregas com sucesso", decimals: 0, suffix: "" },
  { target: 500, u: "mil", label: "Entregas realizadas", decimals: 0, suffix: "+" },
  { target: 220, u: "", label: "Marcas atendidas", decimals: 0, suffix: "+" },
  { target: 1200, u: "", label: "Clientes atendidos/mês", decimals: 0, suffix: "+" },
];

/** Renderiza o heading: cada "\n" vira quebra de linha; *palavra* vira o destaque serif-italic vermelho. */
function renderHeading(text: string) {
  const lines = text.split("\n");
  return lines.map((line, li) => {
    const parts = line.split(/(\*[^*]+\*)/g).filter(Boolean);
    return (
      <span key={li}>
        {parts.map((p, pi) =>
          p.startsWith("*") && p.endsWith("*") ? (
            <span key={pi} className="serif-italic red" style={{ color: "var(--red)" }}>
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

/** Coleta slots cujo key começa com `prefix`, ordenados por `.sort`. */
function collect(content: Record<string, CardContent> | undefined, prefix: string): CardContent[] {
  if (!content) return [];
  return Object.values(content)
    .filter((c) => c.slot.startsWith(prefix))
    .sort((a, b) => a.sort - b.sort);
}

function MetricCell({ m }: { m: Metric }) {
  const [ref, display] = useCountUp(m.target, { decimals: m.decimals });
  return (
    <div className="why-cell" ref={ref}>
      <div className="num">
        {m.suffix}{display}<span className="u" style={m.unitStyle}>{m.u}</span>
      </div>
      <div className="kicker no-rule muted" style={{ marginTop: 12, fontSize: 10, ...m.labelStyle }}>{m.label}</div>
    </div>
  );
}

export function Beneficios({ content }: { content?: Record<string, CardContent> }) {
  const c = content;

  const clientsEyebrow = c?.clients_eyebrow?.title ?? "Marcas que confiam na Spotlog";
  const eyebrow = c?.eyebrow?.title ?? "Por que escolher a Spotlog?";
  const heading =
    c?.heading?.title ?? "Não somos uma\ntransportadora.\nSomos seu *operador logístico*.";
  const lead =
    c?.lead?.description ??
    "Última milha, armazenagem, logística farmacêutica, operações dedicadas, distribuição recorrente e crescimento regional. Tudo em um único parceiro — com indicadores que você acompanha em tempo real.";

  const clientRows = collect(c, "client-");
  const clients: Client[] =
    clientRows.length > 0
      ? clientRows.map((r) => ({
          n: r.title ?? "",
          tag: typeof r.metadata?.tag === "string" ? (r.metadata.tag as string) : undefined,
          titleStyle: cardTitleStyle(r),
        }))
      : CLIENTS;

  const metricRows = collect(c, "metric-");
  const metrics: Metric[] =
    metricRows.length > 0
      ? metricRows.map((r, i) => {
          const meta = r.metadata ?? {};
          return {
            target: typeof meta.target === "number" ? (meta.target as number) : METRICS[i]?.target ?? 0,
            u: r.description ?? METRICS[i]?.u ?? "",
            label: r.title ?? METRICS[i]?.label ?? "",
            decimals: typeof meta.decimals === "number" ? (meta.decimals as number) : METRICS[i]?.decimals ?? 0,
            suffix: typeof meta.suffix === "string" ? (meta.suffix as string) : METRICS[i]?.suffix ?? "",
            labelStyle: cardTitleStyle(r),
            unitStyle: cardDescStyle(r),
          };
        })
      : METRICS;

  return (
    <section id="beneficios" className="section section-paper section-rule">
      <div className="shell">
        {/* Why Spotlog (carrossel de marcas ocultado a pedido do dono) */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap: 48, alignItems:"end", marginBottom: 40 }} className="why-head">
          <div>
            <div className="kicker" style={cardTitleStyle(c?.eyebrow)}>{eyebrow}</div>
            <h2 style={{ marginTop: 22, ...cardTitleStyle(c?.heading) }}>
              {renderHeading(heading)}
            </h2>
          </div>
          <p className="lead" style={cardDescStyle(c?.lead)}>
            {lead}
          </p>
        </div>

        <div className="why-grid">
          {metrics.map((m, i) => <MetricCell key={i} m={m}/>)}
        </div>
      </div>

      <style>{`
        @media (max-width: 860px){ .why-head{ grid-template-columns: 1fr !important; gap: 20px !important; } }
      `}</style>
    </section>
  );
}
