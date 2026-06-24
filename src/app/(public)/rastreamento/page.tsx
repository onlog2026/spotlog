import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  MapPin,
  Package,
  Truck,
} from "lucide-react";
import { TrackingSearchBar } from "@/components/public/tracking/tracking-search-bar";
import { getDemoShipmentCodes } from "@/lib/queries/tracking-public";
import { getStatusConfig } from "@/components/public/tracking/status-config";

export const metadata = {
  title: "Rastrear entrega | Spotlog",
  description:
    "Digite seu código de rastreio Spotlog e acompanhe o status, previsão e histórico completo da sua entrega em tempo real.",
};

// revalida com frequência média pra refletir novos shipments do demo
export const revalidate = 60;

export default async function RastreamentoPage() {
  // pega 3 codes pra demo / exemplo clicável
  const demo = await getDemoShipmentCodes();
  const sample = demo[0]?.code ?? "SP-0001";

  return (
    <div>
      <section className="relative pt-32 lg:pt-44 pb-20 lg:pb-28 bg-gradient-soft hero-pattern">
        <div className="absolute inset-0 grid-pattern opacity-40" />
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-spotorange-50 px-4 py-1.5 mb-6 border border-spotorange-200">
              <MapPin className="h-3.5 w-3.5 text-spotorange-600" />
              <span className="text-xs font-semibold text-spotorange-700">
                Acompanhe sua entrega em tempo real
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-navy-950 leading-[1.1] text-balance">
              Onde está{" "}
              <span className="text-gradient-spotlog">sua entrega?</span>
            </h1>
            <p className="mt-5 text-lg text-ink-600">
              Digite o código de rastreio que você recebeu pra ver status,
              previsão e histórico completo.
            </p>

            <div className="mt-10 max-w-xl mx-auto">
              <TrackingSearchBar size="lg" />
              <p className="text-xs text-ink-500 mt-3">
                Tente:{" "}
                <Link
                  href={`/rastrear/${sample}`}
                  className="font-mono font-semibold text-spotorange-600 hover:underline"
                >
                  {sample}
                </Link>
                {" · "}
                Não tem o código? Procure o e-mail/SMS/WhatsApp que recebeu da
                Spotlog ou pergunte no{" "}
                <Link
                  href="/atendimento"
                  className="text-spotorange-600 font-semibold"
                >
                  atendimento
                </Link>
                .
              </p>
            </div>

            {/* Acessos rápidos pra demo */}
            {demo.length > 0 && (
              <div className="mt-10">
                <p className="text-xs uppercase tracking-wide text-ink-500 mb-3">
                  Exemplos disponíveis
                </p>
                <ul className="flex flex-wrap justify-center gap-2">
                  {demo.map((d) => {
                    const cfg = getStatusConfig(d.status);
                    const Icon = cfg.icon;
                    return (
                      <li key={d.code}>
                        <Link
                          href={`/rastrear/${d.code}`}
                          className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-sm font-mono text-navy-900 transition hover:border-spotorange-300 hover:shadow-sm"
                        >
                          <Icon className={`h-3.5 w-3.5 ${cfg.text}`} />
                          {d.code}
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${cfg.badge} ${cfg.badgeText}`}
                          >
                            {cfg.short}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-24">
        <div className="container max-w-5xl">
          <h2 className="text-2xl lg:text-3xl font-bold text-navy-900 mb-2 text-center">
            O que cada status significa?
          </h2>
          <p className="text-ink-500 text-center mb-12">
            A jornada típica de uma entrega Spotlog
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                icon: Package,
                color: "bg-navy-700",
                title: "Pedido criado",
                desc: "Recebido pela operação e em processo de separação.",
              },
              {
                icon: Clock,
                color: "bg-navy-800",
                title: "Aguardando coleta",
                desc: "Coleta agendada com o cliente/loja.",
              },
              {
                icon: Truck,
                color: "bg-spotorange-500",
                title: "Em rota",
                desc: "Entregador a caminho do destinatário. Acompanhe ao vivo.",
              },
              {
                icon: CheckCircle2,
                color: "bg-success-500",
                title: "Entregue",
                desc: "Pedido confirmado, com foto e assinatura digital.",
              },
            ].map((s) => (
              <div
                key={s.title}
                className="bg-white border border-ink-200 rounded-2xl p-6 text-center"
              >
                <div
                  className={`mx-auto grid h-12 w-12 place-items-center rounded-xl ${s.color} mb-4`}
                >
                  <s.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-bold text-navy-900 mb-2">{s.title}</h3>
                <p className="text-sm text-ink-600">{s.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link href={`/rastrear/${sample}`}>
              <span className="inline-flex items-center gap-2 rounded-full border border-ink-200 bg-white px-5 py-2.5 text-sm font-semibold text-navy-900 shadow-sm hover:border-spotorange-300 hover:shadow-card">
                Ver exemplo: rastreio {sample}
                <ArrowRight className="h-4 w-4 text-spotorange-600" />
              </span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
