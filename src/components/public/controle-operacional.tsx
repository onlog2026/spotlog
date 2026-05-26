import {
  MapPin,
  Calendar,
  FileCheck,
  Headphones,
  Camera,
  History,
  TrendingUp,
  Bell,
} from "lucide-react";

const items = [
  { icon: MapPin, title: "Rastreamento em tempo real", desc: "GPS do entregador, status do pedido e ETA pra cada destino." },
  { icon: Calendar, title: "Coleta sob demanda", desc: "Solicitação pelo painel ou API com janela de tempo definida." },
  { icon: FileCheck, title: "Protocolos de entrega", desc: "Checklist por tipo de produto e destinatário." },
  { icon: Headphones, title: "Suporte consultivo", desc: "Time atende com contexto do seu negócio, não roteiro." },
  { icon: Camera, title: "Evidência de entrega", desc: "Foto, assinatura digital e geolocalização do recebimento." },
  { icon: History, title: "Histórico completo", desc: "Cada interação, status e ocorrência guardada por anos." },
  { icon: TrendingUp, title: "SLA por cliente", desc: "Métricas individuais, comparativos e alertas de desvio." },
  { icon: Bell, title: "Notificações automáticas", desc: "Cliente final é avisado por e-mail, SMS e WhatsApp." },
];

export function ControleOperacional() {
  return (
    <section className="py-20 lg:py-32 bg-navy-950 text-white relative overflow-hidden">
      <div className="absolute inset-0 dot-grid opacity-10" />
      <div className="container relative">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-sm font-semibold text-spotorange-400 uppercase tracking-wider mb-3">
            Controle operacional
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold tracking-tight text-balance">
            Controle operacional que{" "}
            <span className="text-spotorange-400">gera confiança.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-300">
            Tudo o que sua operação precisa pra entregar sem surpresas — e
            comprovar quando der ruim.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="group bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:border-spotorange-400/40 transition-all"
            >
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-spotorange-500/10 group-hover:bg-spotorange-500 transition-colors mb-4">
                <item.icon className="h-6 w-6 text-spotorange-400 group-hover:text-white transition-colors" />
              </div>
              <h3 className="text-base font-bold mb-2">{item.title}</h3>
              <p className="text-sm text-ink-300 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
