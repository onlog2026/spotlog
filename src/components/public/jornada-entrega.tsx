import { Package, Truck, ClipboardCheck, Route, MapPin, CheckCircle2 } from "lucide-react";

type Status = {
  n: number;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
  /** classes para o círculo (bg + border quando aplicável) */
  ring: string;
  iconBg: string;
  iconColor: string;
  badge: string;
};

const STATUSES: Status[] = [
  {
    n: 1,
    title: "Pedido criado",
    desc: "Sua remessa foi cadastrada e está pronta pra coleta.",
    icon: Package,
    ring: "border-navy-700",
    iconBg: "bg-navy-700",
    iconColor: "text-white",
    badge: "bg-navy-50 text-navy-700",
  },
  {
    n: 2,
    title: "Coletado",
    desc: "Nosso motorista pegou o pacote no seu CD ou loja.",
    icon: Truck,
    ring: "border-navy-500",
    iconBg: "bg-navy-500",
    iconColor: "text-white",
    badge: "bg-navy-50 text-navy-700",
  },
  {
    n: 3,
    title: "Triagem",
    desc: "Pacote passou pelo conferimento e foi alocado em rota.",
    icon: ClipboardCheck,
    ring: "border-amber-500",
    iconBg: "bg-amber-500",
    iconColor: "text-white",
    badge: "bg-amber-50 text-amber-700",
  },
  {
    n: 4,
    title: "Em rota",
    desc: "Saiu pra entrega — motorista a caminho do destinatário.",
    icon: Route,
    ring: "border-spotorange-500",
    iconBg: "bg-spotorange-500",
    iconColor: "text-white",
    badge: "bg-spotorange-50 text-spotorange-700",
  },
  {
    n: 5,
    title: "Saiu para entrega",
    desc: "Última milha — chegada prevista em minutos.",
    icon: MapPin,
    ring: "border-spotorange-600",
    iconBg: "bg-spotorange-600",
    iconColor: "text-white",
    badge: "bg-spotorange-50 text-spotorange-700",
  },
  {
    n: 6,
    title: "Entregue",
    desc: "Entrega concluída com assinatura e/ou foto do destinatário.",
    icon: CheckCircle2,
    ring: "border-success-500",
    iconBg: "bg-success-500",
    iconColor: "text-white",
    badge: "bg-success-50 text-success-700",
  },
];

export function JornadaEntrega() {
  return (
    <section
      id="status-jornada"
      className="py-16 sm:py-20 lg:py-28 bg-gradient-soft relative overflow-hidden"
    >
      <div className="absolute inset-0 grid-pattern opacity-40 pointer-events-none" />
      <div className="container relative">
        <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
          <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
            Status da entrega
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-navy-950 tracking-tight text-balance">
            O que cada status significa?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-ink-600">
            A jornada típica de uma entrega Spotlog — do CD ao destinatário, com
            atualização em tempo real.
          </p>
        </div>

        {/* MOBILE: vertical timeline | DESKTOP (lg+): horizontal */}
        <div className="lg:hidden space-y-6">
          {STATUSES.map((s, i) => {
            const Icon = s.icon;
            const isLast = i === STATUSES.length - 1;
            return (
              <div key={s.n} className="relative pl-16">
                {/* círculo numerado */}
                <div
                  className={`absolute left-0 top-0 grid h-12 w-12 place-items-center rounded-full ${s.iconBg} text-white shadow-card ring-4 ring-white`}
                >
                  <span className="text-base font-black leading-none">{s.n}</span>
                </div>
                {/* linha vertical conectando */}
                {!isLast && (
                  <span className="absolute left-6 top-12 h-[calc(100%+1.5rem)] w-0.5 -translate-x-1/2 bg-ink-200" />
                )}
                <div className="bg-white border border-ink-100 rounded-2xl p-4 shadow-soft">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon className="h-4 w-4 text-navy-700" />
                    <h3 className="text-base font-bold text-navy-950">{s.title}</h3>
                  </div>
                  <p className="text-sm text-ink-600 leading-relaxed">{s.desc}</p>
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
        <div className="hidden lg:block relative">
          {/* linha horizontal de fundo conectando os círculos */}
          <div className="absolute top-7 left-[8%] right-[8%] h-0.5 bg-gradient-to-r from-navy-700 via-amber-500 via-spotorange-500 to-success-500 opacity-30" />
          <div className="grid grid-cols-6 gap-4 relative">
            {STATUSES.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="flex flex-col items-center text-center">
                  <div
                    className={`grid h-14 w-14 place-items-center rounded-full ${s.iconBg} text-white shadow-card ring-4 ring-white relative z-10`}
                  >
                    <span className="text-lg font-black leading-none">{s.n}</span>
                  </div>
                  <div className="mt-5 bg-white border border-ink-100 rounded-2xl p-5 shadow-soft w-full">
                    <div className="flex items-center justify-center gap-1.5 mb-1.5">
                      <Icon className="h-4 w-4 text-navy-700" />
                      <h3 className="text-sm font-bold text-navy-950">{s.title}</h3>
                    </div>
                    <p className="text-xs text-ink-600 leading-relaxed">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
