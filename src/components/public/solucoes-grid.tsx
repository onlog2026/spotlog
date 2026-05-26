import Link from "next/link";
import {
  ShoppingBag,
  Pill,
  Zap,
  Calendar,
  Route,
  RotateCcw,
  Truck,
  Package2,
  ArrowRight,
} from "lucide-react";

const solucoes = [
  {
    icon: ShoppingBag,
    title: "Entregas para E-commerce",
    desc: "Coletas programadas, entregas expressas e rastreamento integrado pra reduzir chamados e melhorar a experiência do cliente final.",
    href: "/ecommerce",
    color: "from-navy-700 to-navy-900",
  },
  {
    icon: Pill,
    title: "Farma, Manipulação e Correlatos",
    desc: "Operações sensíveis com checklist, evidência fotográfica, assinatura digital e gestão de não conformidades.",
    href: "/farma",
    color: "from-spotorange-600 to-spotorange-800",
  },
  {
    icon: Zap,
    title: "Entregas Expressas",
    desc: "Same-day e janelas curtas em São Paulo capital e Grande SP, com SLA monitorado em tempo real.",
    href: "/solucoes",
    color: "from-navy-600 to-navy-800",
  },
  {
    icon: Calendar,
    title: "Coletas Programadas",
    desc: "Equipe passa no seu CD, loja ou laboratório nos horários definidos, com checklist e confirmação.",
    href: "/solucoes",
    color: "from-navy-700 to-navy-900",
  },
  {
    icon: Route,
    title: "Rotas Dedicadas",
    desc: "Veículos e entregadores exclusivos para o seu volume, com gestão de escala e suporte direto.",
    href: "/solucoes",
    color: "from-spotorange-500 to-spotorange-700",
  },
  {
    icon: RotateCcw,
    title: "Logística Reversa",
    desc: "Coleta de devoluções, troca de mercadorias e retornos — com mesma rastreabilidade da ida.",
    href: "/solucoes",
    color: "from-navy-700 to-navy-900",
  },
  {
    icon: Truck,
    title: "Utilitários e Vans",
    desc: "Cargas maiores, mudanças comerciais e transferências entre filiais com motorista treinado.",
    href: "/solucoes",
    color: "from-navy-600 to-navy-800",
  },
  {
    icon: Package2,
    title: "Operação Sob Demanda",
    desc: "Picos sazonais, lançamentos, eventos — escalamos a operação conforme sua necessidade.",
    href: "/solucoes",
    color: "from-spotorange-600 to-spotorange-800",
  },
];

export function SolucoesGrid() {
  return (
    <section id="solucoes" className="py-20 lg:py-32 bg-navy-50/40">
      <div className="container">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="text-sm font-semibold text-spotorange-600 uppercase tracking-wider mb-3">
            Soluções
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-navy-950 tracking-tight text-balance">
            Soluções logísticas para{" "}
            <span className="text-gradient-spotlog">cada etapa da operação.</span>
          </h2>
          <p className="mt-5 text-lg text-ink-600">
            Da coleta ao comprovante, todas as nossas modalidades têm rastreamento,
            atendimento e suporte. Escolha a que faz sentido pro seu negócio.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {solucoes.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="group bg-white rounded-2xl p-6 border border-ink-200 hover:border-spotorange-300 hover:shadow-card-hover transition-all relative overflow-hidden"
            >
              <div
                className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${s.color} opacity-0 group-hover:opacity-100 transition-opacity`}
              />
              <div
                className={`grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${s.color} mb-4 shadow-soft group-hover:scale-110 transition-transform`}
              >
                <s.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-navy-900 mb-2 leading-tight">
                {s.title}
              </h3>
              <p className="text-sm text-ink-600 leading-relaxed mb-4 line-clamp-3">
                {s.desc}
              </p>
              <div className="flex items-center gap-1 text-sm font-semibold text-spotorange-600 group-hover:gap-2 transition-all">
                Saiba mais
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
