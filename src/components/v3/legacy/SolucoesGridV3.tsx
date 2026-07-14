import Link from "next/link";
import Image from "next/image";
import {
  Warehouse,
  ShoppingCart,
  Pill,
  Timer,
  CalendarCheck,
  Bike,
  RotateCcw,
  Truck,
  TrendingUp,
  ArrowRight,
} from "lucide-react";
import { getSiteCards, mergeBySlot } from "@/lib/site-cards";
import { HeadingHL } from "@/components/v3/highlight";

type DefaultCard = {
  slot: string;
  icon: typeof Warehouse;
  title: string;
  description: string;
  cta_url: string;
  image_url: string;
  cta_label?: string;
};

// Ícones escolhidos pra representar FIELMENTE cada serviço.
// Exportado (GRID_DEFAULTS) pro Mapa do Site do CMS saber quais cards existem na grade.
export const GRID_DEFAULTS: DefaultCard[] = [
  {
    slot: "armazenagem",
    icon: Warehouse,
    title: "Armazenagem & Fulfillment",
    description:
      "Recebemos, armazenamos, separamos, embalamos e expedimos cada pedido — com estoque em tempo real e rastreabilidade total. Você vende, nós cuidamos da operação.",
    cta_url: "/solucoes/armazenagem",
    image_url: "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "ecommerce-express",
    icon: ShoppingCart,
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
    icon: Timer,
    title: "Entregas Expressas",
    description:
      "Same-day e janelas curtas em São Paulo capital e Grande SP, com SLA monitorado em tempo real.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1494412651409-8963ce7935a7?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "coletas",
    icon: CalendarCheck,
    title: "Coletas Programadas",
    description:
      "Equipe passa no seu CD, loja ou laboratório nos horários definidos, com checklist e confirmação.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=600&q=80",
  },
  {
    slot: "moto-fixa",
    icon: Bike,
    title: "Rotas Dedicadas",
    description:
      "Veículos e entregadores exclusivos para o seu volume, com gestão de escala e suporte direto.",
    cta_url: "/solucoes",
    image_url:
      "https://lfvuwrpfdnyqfxjaicba.supabase.co/storage/v1/object/public/cms/branding/home-moto-fixa-ai.jpg",
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
    icon: TrendingUp,
    title: "Operação Sob Demanda",
    description:
      "Picos sazonais, lançamentos, eventos — escalamos a operação conforme sua necessidade.",
    cta_url: "/solucoes",
    image_url: "https://images.unsplash.com/photo-1581094288338-2314dddb7ece?auto=format&fit=crop&w=600&q=80",
  },
];

/**
 * Grade de soluções. Pode renderizar uma FATIA dos cards (`slice`) e esconder
 * o cabeçalho (`header=false`) — isso permite intercalar linhas de 3 cards com
 * outras seções da home (Beneficios, Processo).
 * - 3 por linha em desktop/tablet (md+), 2 em telas pequenas (sm), 1 no mobile.
 * - Descrição SEM corte (sem line-clamp).
 */
export async function SolucoesGridV3({
  slice,
  header = true,
}: {
  slice?: [number, number];
  header?: boolean;
} = {}) {
  const overrides = await getSiteCards("home", "solucoes");
  const items = mergeBySlot(GRID_DEFAULTS, overrides);
  const shown = slice ? items.slice(slice[0], slice[1]) : items;

  const banner = overrides.find((o) => o.slot === "banner");
  const eyebrow = overrides.find((o) => o.slot === "eyebrow")?.title ?? "Soluções";
  const heading =
    overrides.find((o) => o.slot === "heading")?.title ?? "Soluções logísticas para *cada etapa da operação.*";
  const lead =
    overrides.find((o) => o.slot === "lead")?.description ??
    "Da coleta ao comprovante, todas as nossas modalidades têm rastreamento, atendimento e suporte. Escolha a que faz sentido pro seu negócio.";

  return (
    <section
      {...(header ? { id: "solucoes" } : {})}
      className={header ? "pt-20 lg:pt-28 pb-12" : "py-12"}
      style={{ background: "var(--bg-2)", borderTop: "1px solid var(--rule)" }}
    >
      <div className="container">
        {header && (
          <>
            <div className="text-center max-w-3xl mx-auto mb-14">
              <div className="text-sm font-semibold text-[color:var(--red)] uppercase tracking-wider mb-3">
                {eyebrow}
              </div>
              <h2 className="text-3xl lg:text-5xl font-bold text-[color:var(--ink)] tracking-tight text-balance">
                <HeadingHL text={heading} />
              </h2>
              <p className="mt-5 text-lg text-[color:var(--ink-soft)]">{lead}</p>
            </div>

            {/* Banner das soluções — imagem LIMPA e INTEIRA (aspecto natural, sem
                degradê/texto por cima, sem corte). */}
            {banner?.image_url && (
              <div className="relative mb-10 rounded-2xl overflow-hidden shadow-soft">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={banner.image_url}
                  alt={banner.title ?? "Soluções logísticas Spotlog"}
                  style={{ display: "block", width: "100%", height: "auto" }}
                />
              </div>
            )}
          </>
        )}

        {shown.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {shown.map((s) => {
            const Icon = s.icon;
            const img = s.image_url || `/cards/sol-${s.slot}.svg`;
            const href =
              s.cta_url && s.cta_url !== "/solucoes"
                ? s.cta_url
                : `/solucoes/${s.slot}`;
            const customLabel = (s as { cta_label?: string | null }).cta_label;
            // Sem label customizado no CMS: usa "Ver {título}" (único por card,
            // em vez de "Saiba mais" repetido — ruim pra SEO e leitor de tela).
            const label = customLabel || `Ver ${s.title}`;
            return (
              <Link
                key={s.slot}
                href={href}
                aria-label={customLabel ? `${customLabel} sobre ${s.title}` : label}
                className="card-glow group overflow-hidden flex flex-col"
              >
                <div
                  className="relative aspect-[1536/1024] overflow-hidden"
                  style={{ background: "var(--bg-2)" }}
                >
                  {img ? (
                    <Image
                      src={img}
                      alt={s.title ?? s.slot}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover img-zoom"
                      unoptimized={img.endsWith(".svg") || img.includes("image.pollinations.ai")}
                    />
                  ) : null}
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(to top, color-mix(in srgb, var(--navy-deep) 70%, transparent), color-mix(in srgb, var(--navy-deep) 15%, transparent) 45%, transparent)",
                    }}
                  />
                  {/* Etiqueta/ícone — sempre no canto DIREITO */}
                  <div className="absolute top-3 right-3 grid h-11 w-11 place-items-center rounded-xl bg-white/95 backdrop-blur shadow-soft">
                    <Icon className="h-5 w-5 text-[color:var(--red)]" />
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-base font-bold text-[color:var(--ink)] mb-2 leading-tight">
                    {s.title}
                  </h3>
                  <p className="text-sm text-[color:var(--ink-soft)] leading-relaxed flex-1 mb-4">
                    {s.description}
                  </p>
                  <div className="flex items-center gap-1 text-sm font-semibold text-[color:var(--red)] group-hover:gap-2 transition-all">
                    {label}
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
        )}
      </div>
    </section>
  );
}
