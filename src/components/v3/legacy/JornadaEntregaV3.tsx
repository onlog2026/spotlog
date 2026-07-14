import { Package, Truck, ClipboardCheck, Route, MapPin, CheckCircle2 } from "lucide-react";
import { getSiteCards, mergeBySlot } from "@/lib/site-cards";
import { HeadingHL } from "@/components/v3/highlight";

type Status = {
  slot: string;
  n: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  badge: string;
};

const STATUSES: Status[] = [
  { slot: "status-1", n: 1, title: "Pedido criado", description: "Sua remessa foi cadastrada e está pronta pra coleta.", icon: Package, iconBg: "bg-navy-700", badge: "bg-navy-50 text-navy-700" },
  { slot: "status-2", n: 2, title: "Coletado", description: "Nosso motorista pegou o pacote no seu CD ou loja.", icon: Truck, iconBg: "bg-navy-500", badge: "bg-navy-50 text-navy-700" },
  { slot: "status-3", n: 3, title: "Triagem", description: "Pacote passou pelo conferimento e foi alocado em rota.", icon: ClipboardCheck, iconBg: "bg-amber-500", badge: "bg-amber-50 text-amber-700" },
  { slot: "status-4", n: 4, title: "Em rota", description: "Saiu pra entrega — motorista a caminho do destinatário.", icon: Route, iconBg: "bg-navy-500", badge: "bg-navy-50 text-navy-700" },
  { slot: "status-5", n: 5, title: "Saiu para entrega", description: "Última milha — chegada prevista em minutos.", icon: MapPin, iconBg: "bg-navy-600", badge: "bg-navy-50 text-navy-700" },
  { slot: "status-6", n: 6, title: "Entregue", description: "Entrega concluída com assinatura e/ou foto do destinatário.", icon: CheckCircle2, iconBg: "bg-success-500", badge: "bg-success-50 text-success-700" },
];

export async function JornadaEntregaV3() {
  const overrides = await getSiteCards("home", "jornada");
  const items = mergeBySlot(STATUSES, overrides);
  const eyebrow = overrides.find((o) => o.slot === "eyebrow")?.title ?? "Status da entrega";
  const heading = overrides.find((o) => o.slot === "heading")?.title ?? "O que cada status significa?";
  const lead =
    overrides.find((o) => o.slot === "lead")?.description ??
    "A jornada típica de uma entrega Spotlog — do CD ao destinatário, com atualização em tempo real.";

  return (
    <section
      id="status-jornada"
      className="py-16 sm:py-20 lg:py-28 relative overflow-hidden"
      style={{ background: "var(--paper)", borderTop: "1px solid var(--rule)" }}
    >
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
          <div className="text-sm font-semibold text-[color:var(--red)] uppercase tracking-wider mb-3">
            {eyebrow}
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[color:var(--ink)] tracking-tight text-balance">
            <HeadingHL text={heading} />
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[color:var(--ink-soft)]">
            {lead}
          </p>
        </div>

        {/* MOBILE: vertical timeline | DESKTOP (lg+): horizontal */}
        <div className="lg:hidden space-y-6">
          {items.map((s, i) => {
            const Icon = s.icon;
            const isLast = i === items.length - 1;
            return (
              <div key={s.slot} className="relative pl-16">
                <div
                  className={`absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full ${s.iconBg} text-white shadow-card ring-4 ring-white`}
                >
                  <span className="text-base font-black leading-none">{s.n}</span>
                </div>
                {!isLast && (
                  <span className="absolute left-6 top-12 h-[calc(100%+1.5rem)] w-0.5 -translate-x-1/2 bg-ink-200" />
                )}
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-[color:var(--navy)]" />
                    <h3 className="text-base font-bold text-[color:var(--ink)]">{s.title}</h3>
                  </div>
                  <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed">{s.description}</p>
                  <div
                    className={`mt-2 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${s.badge}`}
                  >
                    Etapa {s.n} de 6
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* DESKTOP: horizontal */}
        <div className="hidden lg:block relative jn-timeline">
          <div className="absolute top-7 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-navy-700 via-amber-500 via-navy-500 to-success-500 opacity-30" />
          <span className="jn-spark" aria-hidden="true" />
          <div className="grid grid-cols-6 gap-4 relative">
            {items.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.slot} className="jn-node flex flex-col items-center text-center">
                  <div
                    className={`jn-dot grid h-14 w-14 place-items-center rounded-full ${s.iconBg} text-white shadow-card ring-4 ring-white relative z-10`}
                  >
                    <span className="text-lg font-black leading-none">{s.n}</span>
                  </div>
                  <div className="card mt-5 p-5 w-full">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <Icon className="h-4 w-4 text-[color:var(--navy)]" />
                      <h3 className="text-sm font-bold text-[color:var(--ink)]">{s.title}</h3>
                    </div>
                    <p className="text-xs text-[color:var(--ink-soft)] leading-relaxed">{s.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <style>{`
        .jn-timeline .jn-spark{ position:absolute; top:28px; left:8%; width:14px; height:14px; border-radius:50%;
          background:#EAFFFE; transform:translate(-50%,-50%); z-index:5; pointer-events:none;
          box-shadow:0 0 12px 3px #2FE6E0, 0 0 30px 8px rgba(47,230,224,.7), 0 0 60px 16px rgba(59,123,255,.35);
          animation:jn-run 5s linear infinite; }
        @keyframes jn-run{ 0%{ left:8%; opacity:0 } 5%{ opacity:1 } 95%{ opacity:1 } 100%{ left:92%; opacity:0 } }
        .jn-timeline .jn-dot{ animation:jn-pulse 5s ease-in-out infinite; will-change:transform, box-shadow; }
        .jn-timeline .jn-node:nth-child(1) .jn-dot{ animation-delay:0s }
        .jn-timeline .jn-node:nth-child(2) .jn-dot{ animation-delay:.95s }
        .jn-timeline .jn-node:nth-child(3) .jn-dot{ animation-delay:1.9s }
        .jn-timeline .jn-node:nth-child(4) .jn-dot{ animation-delay:2.85s }
        .jn-timeline .jn-node:nth-child(5) .jn-dot{ animation-delay:3.8s }
        .jn-timeline .jn-node:nth-child(6) .jn-dot{ animation-delay:4.75s }
        @keyframes jn-pulse{
          0%,100%{ transform:scale(1); box-shadow:0 0 0 4px #fff; filter:brightness(.96) }
          6%{ transform:scale(1.16); box-shadow:0 0 0 4px #fff, 0 0 26px 6px rgba(47,230,224,.85), 0 0 50px 14px rgba(59,123,255,.5); filter:brightness(1.5) }
          16%{ transform:scale(1); box-shadow:0 0 0 4px #fff; filter:brightness(.96) }
        }
        @media (prefers-reduced-motion: reduce){ .jn-timeline .jn-spark{ animation:none; opacity:0 } .jn-timeline .jn-dot{ animation:none } }
      `}</style>
    </section>
  );
}
