import {
  Package,
  ClipboardCheck,
  Route,
  Truck,
  FileSignature,
  Headphones,
  Clock,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MapPin,
  MessageCircle,
} from "lucide-react";
import { getSiteCards, mergeBySlot } from "@/lib/site-cards";
import { HeadingHL } from "@/components/v3/highlight";

const etapas = [
  { slot: "etapa-1", n: "01", icon: Package, title: "Coleta", description: "Equipe agendada ou expressa no seu endereço." },
  { slot: "etapa-2", n: "02", icon: ClipboardCheck, title: "Conferência", description: "Checklist com volumes, tipo e particularidades." },
  { slot: "etapa-3", n: "03", icon: Route, title: "Roteirização", description: "Otimização inteligente da rota e janelas." },
  { slot: "etapa-4", n: "04", icon: Truck, title: "Entrega", description: "Rastreamento em tempo real do entregador." },
  { slot: "etapa-5", n: "05", icon: FileSignature, title: "Comprovante", description: "Foto, assinatura digital e protocolo." },
  { slot: "etapa-6", n: "06", icon: Headphones, title: "Atendimento", description: "SAC integrado pra qualquer ocorrência." },
];

const dashboardMetrics = [
  { icon: Truck, label: "Entregas hoje", value: "294" },
  { icon: Clock, label: "Coletas agendadas", value: "127" },
  { icon: MapPin, label: "Rotas ativas", value: "12" },
  { icon: AlertCircle, label: "Ocorrências", value: "3" },
  { icon: TrendingUp, label: "SLA cumprido", value: "98.4%" },
  { icon: MessageCircle, label: "Chamados", value: "8" },
];

export async function ProcessoLegacyV3() {
  const overrides = await getSiteCards("home", "processo");
  const items = mergeBySlot(etapas, overrides);
  const eyebrow = overrides.find((o) => o.slot === "eyebrow")?.title ?? "Processo operacional";
  const heading =
    overrides.find((o) => o.slot === "heading")?.title ?? "Um processo simples, *monitorado e eficiente.*";

  return (
    <section
      className="py-20 lg:py-32"
      style={{ background: "var(--paper)", borderTop: "1px solid var(--rule)" }}
    >
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-sm font-semibold text-[color:var(--red)] uppercase tracking-wider mb-3">
            {eyebrow}
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-[color:var(--ink)] tracking-tight text-balance">
            <HeadingHL text={heading} />
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="grid sm:grid-cols-2 gap-4">
              {items.map((e) => {
                const Icon = e.icon;
                return (
                  <div key={e.slot} className="card-glow p-6 group relative">
                    <div className="absolute -top-3 -right-3 grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-white font-bold text-sm shadow-soft group-hover:bg-navy-500 transition-colors">
                      {e.n}
                    </div>
                    <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-50 mb-4 group-hover:bg-navy-50 transition-colors">
                      <Icon className="h-6 w-6 text-navy-900 group-hover:text-navy-600 transition-colors" />
                    </div>
                    <h3 className="text-lg font-bold text-[color:var(--ink)] mb-2">{e.title}</h3>
                    <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed">{e.description}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Dashboard lateral (demonstração visual ao vivo) */}
          <div className="lg:col-span-1">
            <div className="bg-navy-900 rounded-3xl p-6 shadow-card relative overflow-hidden">
              <div className="absolute inset-0 dot-grid opacity-10" />
              <div className="absolute top-0 right-0 w-40 h-40 bg-navy-500/15 rounded-full -translate-y-20 translate-x-20 blur-2xl" />

              <div className="relative">
                <div className="flex items-center gap-2 mb-1">
                  <div className="h-2 w-2 rounded-full bg-success-500 animate-pulse-soft" />
                  <span className="text-[10px] uppercase tracking-wider text-ink-300 font-bold">
                    Ao vivo
                  </span>
                </div>
                <h3 className="text-white text-lg font-bold mb-1">
                  Visão geral da operação
                </h3>
                <p className="text-xs text-ink-300 mb-5">
                  Dashboard real disponível na área do cliente
                </p>

                <div className="grid grid-cols-2 gap-2.5">
                  {dashboardMetrics.map((m) => (
                    <div
                      key={m.label}
                      className="bg-white rounded-xl p-3 shadow-soft hover:shadow-card transition-shadow"
                    >
                      <m.icon className="h-4 w-4 text-navy-600 mb-2" />
                      <div className="text-[10px] text-ink-500 mb-0.5 font-medium">{m.label}</div>
                      <div className="text-xl font-bold text-navy-900">{m.value}</div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 bg-white rounded-xl p-3.5 shadow-soft">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-600 font-medium">Status geral</span>
                    <span className="flex items-center gap-1.5 font-bold text-success-700">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Saudável
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
