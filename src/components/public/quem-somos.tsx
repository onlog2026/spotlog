import {
  Truck,
  Activity,
  MapPin,
  Headphones,
  Cpu,
  ShieldCheck,
} from "lucide-react";

const features = [
  {
    icon: Truck,
    title: "Entregas rastreadas",
    desc: "Todas as entregas com status em tempo real, comprovante e histórico completo.",
  },
  {
    icon: Activity,
    title: "Operação sob demanda",
    desc: "Coletas programadas, expressas ou recorrentes — adaptadas ao seu volume.",
  },
  {
    icon: MapPin,
    title: "Rotas dedicadas",
    desc: "Equipes exclusivas para empresas com alto volume e janelas definidas.",
  },
  {
    icon: Headphones,
    title: "Atendimento consultivo",
    desc: "SAC humanizado com IA de apoio — você não fica perdido entre planilhas.",
  },
  {
    icon: Cpu,
    title: "Tecnologia embarcada",
    desc: "App do entregador, dashboard do cliente e integrações com sua loja.",
  },
  {
    icon: ShieldCheck,
    title: "Operações sensíveis",
    desc: "Suporte a farma, manipulação e produtos que exigem controle e cuidado.",
  },
];

export function QuemSomos() {
  return (
    <section id="quem-somos" className="py-20 lg:py-32">
      <div className="container">
        <div className="grid lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-5 lg:sticky lg:top-32">
            <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-4">
              Quem somos
            </div>
            <h2 className="text-3xl lg:text-5xl font-bold text-navy-950 tracking-tight text-balance">
              Especialistas em soluções logísticas{" "}
              <span className="text-gradient-spotlog">de ponta a ponta.</span>
            </h2>
            <p className="mt-6 text-lg text-ink-600 leading-relaxed">
              A Spotlog atua para simplificar operações de entrega, conectar
              empresas aos seus clientes e garantir mais previsibilidade em
              cada etapa da jornada logística.
            </p>
            <div className="mt-8 grid grid-cols-2 gap-4 max-w-md">
              <div className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft">
                <div className="text-3xl font-bold text-navy-900">+98%</div>
                <div className="text-xs text-ink-500 mt-1">Entregas com sucesso</div>
              </div>
              <div className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft">
                <div className="text-3xl font-bold text-navy-900">+500k</div>
                <div className="text-xs text-ink-500 mt-1">Entregas realizadas</div>
              </div>
              <div className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft">
                <div className="text-3xl font-bold text-spotorange-600">SLA</div>
                <div className="text-xs text-ink-500 mt-1">monitorado por cliente</div>
              </div>
              <div className="bg-white border border-ink-200 rounded-2xl p-5 shadow-soft">
                <div className="text-3xl font-bold text-success-700">24/7</div>
                <div className="text-xs text-ink-500 mt-1">Atendimento dedicado</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className="group bg-white border border-ink-200 rounded-2xl p-6 hover:border-navy-300 hover:shadow-card-hover transition-all"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-navy-50 group-hover:bg-spotorange-500 transition-colors mb-4">
                  <f.icon className="h-6 w-6 text-navy-900 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-lg font-bold text-navy-900 mb-2">{f.title}</h3>
                <p className="text-sm text-ink-600 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
