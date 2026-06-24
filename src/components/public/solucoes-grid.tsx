import Link from "next/link";
import Image from "next/image";
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
import { getSiteCards, mergeBySlot } from "@/lib/site-cards";

type DefaultCard = {
  slot: string;
  icon: typeof ShoppingBag;
  title: string;
  description: string;
  cta_url: string;
  image_url: string;
  cta_label?: string;
};

const defaults: DefaultCard[] = [
  {
    slot: "ecommerce-express",
    icon: ShoppingBag,
    title: "Entregas para E-commerce",
    description:
      "Coletas programadas, entregas expressas e rastreamento integrado pra reduzir chamados e melhorar a experiência do cliente final.",
    cta_url: "/ecommerce",
    image_url: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "express-pharma",
    icon: Pill,
    title: "Farma, Manipulação e Correlatos",
    description:
      "Operações sensíveis com checklist, evidência fotográfica, assinatura digital e gestão de não conformidades.",
    cta_url: "/farma",
    image_url: "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "same-day",
    icon: Zap,
    title: "Entregas Expressas",
    description:
      "Same-day e janelas curtas em São Paulo capital e Grande SP, com SLA monitorado em tempo real.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "coletas",
    icon: Calendar,
    title: "Coletas Programadas",
    description:
      "Equipe passa no seu CD, loja ou laboratório nos horários definidos, com checklist e confirmação.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "moto-fixa",
    icon: Route,
    title: "Rotas Dedicadas",
    description:
      "Veículos e entregadores exclusivos para o seu volume, com gestão de escala e suporte direto.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1601584115197-04ecc0da31d7?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "reversa",
    icon: RotateCcw,
    title: "Logística Reversa",
    description:
      "Coleta de devoluções, troca de mercadorias e retornos — com mesma rastreabilidade da ida.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1586528116493-a029325540fa?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "vans",
    icon: Truck,
    title: "Utilitários e Vans",
    description:
      "Cargas maiores, mudanças comerciais e transferências entre filiais com motorista treinado.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1620677368158-32b948b4ba6c?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "sob-demanda",
    icon: Package2,
    title: "Operação Sob Demanda",
    description:
      "Picos sazonais, lançamentos, eventos — escalamos a operação conforme sua necessidade.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80",
  },
];

export async function SolucoesGrid() {
  const overrides = await getSiteCards("home", "solucoes");
  const items = mergeBySlot(defaults, overrides);

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

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map((s) => {
            const Icon = s.icon;
            const img = s.image_url || defaults.find((d) => d.slot === s.slot)?.image_url || "";
            const href = s.cta_url || "/solucoes";
            const label = (s as { cta_label?: string | null }).cta_label || "Saiba mais";
            return (
              <Link
                key={s.slot}
                href={href}
                className="card-glow group overflow-hidden flex flex-col"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-navy-100">
                  {img ? (
                    <Image
                      src={img}
                      alt={s.title ?? s.slot}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover img-zoom"
                      unoptimized={img.startsWith("https://image.pollinations.ai")}
                    />
                  ) : null}
                  <div className="absolute inset-0 bg-gradient-to-t from-navy-950/70 via-navy-950/20 to-transparent" />
                  <div className="absolute top-3 left-3 grid h-10 w-10 place-items-center rounded-xl bg-white/95 backdrop-blur shadow-soft">
                    <Icon className="h-5 w-5 text-spotorange-600" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-navy-900 mb-2 leading-tight">
                    {s.title}
                  </h3>
                  <p className="text-xs text-ink-600 leading-relaxed flex-1 mb-3 line-clamp-3">
                    {s.description}
                  </p>
                  <div className="flex items-center gap-1 text-sm font-semibold text-spotorange-600 group-hover:gap-2 transition-all">
                    {label}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
