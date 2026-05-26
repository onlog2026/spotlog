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

const etapas = [
  { n: "01", icon: Package, title: "Coleta", desc: "Equipe agendada ou expressa no seu endereço." },
  { n: "02", icon: ClipboardCheck, title: "Conferência", desc: "Checklist com volumes, tipo e particularidades." },
  { n: "03", icon: Route, title: "Roteirização", desc: "Otimização inteligente da rota e janelas." },
  { n: "04", icon: Truck, title: "Entrega", desc: "Rastreamento em tempo real do entregador." },
  { n: "05", icon: FileSignature, title: "Comprovante", desc: "Foto, assinatura digital e protocolo." },
  { n: "06", icon: Headphones, title: "Atendimento", desc: "SAC integrado pra qualquer ocorrência." },
];

const dashboardMetrics = [
  { icon: Truck, label: "Entregas hoje", value: "294", color: "text-navy-900" },
  { icon: Clock, label: "Coletas agendadas", value: "127", color: "text-navy-900" },
  { icon: MapPin, label: "Rotas ativas", value: "12", color: "text-spotorange-600" },
  { icon: AlertCircle, label: "Ocorrências", value: "3", color: "text-spotorange-600" },
  { icon: TrendingUp, label: "SLA cumprido", value: "98.4%", color: "text-success-700" },
  { icon: MessageCircle, label: "Chamados", value: "8", color: "text-navy-900" },
];

export function Processo() {
  return (
    <section className="py-20 lg:py-32">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
            Processo operacional
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy-950 tracking-tight text-balance">
            Um processo simples,{" "}
            <span className="text-gradient-spotlog">monitorado e eficiente.</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Etapas */}
          <div className="lg:col-span-2">
            <div className="grid sm:grid-cols-2 gap-4">
              {etapas.map((e, i) => (
                <div
                  key={e.n}
                  className="relative bg-white border border-ink-200 rounded-2xl p-6 hover:shadow-card transition-all group"
                >
                  <div className="absolute -top-3 -right-3 grid h-12 w-12 place-items-center rounded-xl bg-navy-900 text-white font-bold text-sm shadow-soft group-hover:bg-spotorange-500 transition-colors">
                    {e.n}
                  </div>
                  <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-50 mb-4 group-hover:bg-spotorange-50 transition-colors">
                    <e.icon className="h-6 w-6 text-navy-900 group-hover:text-spotorange-600 transition-colors" />
                  </div>
                  <h3 className="text-lg font-bold text-navy-900 mb-2">{e.title}</h3>
                  <p className="text-sm text-ink-600 leading-relaxed">{e.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard lateral */}
          <div className="lg:col-span-1">
            <div className="bg-navy-900 rounded-2xl p-6 shadow-card relative overflow-hidden">
              <div className="absolute inset-0 dot-grid opacity-10" />
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

                <div className="grid grid-cols-2 gap-3">
                  {dashboardMetrics.map((m) => (
                    <div
                      key={m.label}
                      className="bg-white/5 backdrop-blur rounded-xl p-3 border border-white/10"
                    >
                      <m.icon className="h-4 w-4 text-spotorange-400 mb-2" />
                      <div className="text-xs text-ink-300 mb-0.5">{m.label}</div>
                      <div className={`text-xl font-bold text-white`}>
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-5 pt-5 border-t border-white/10">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ink-300">Status geral</span>
                    <span className="flex items-center gap-1.5 font-semibold text-success-400">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Operação saudável
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
