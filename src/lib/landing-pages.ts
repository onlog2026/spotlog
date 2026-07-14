// Páginas de destino por SEGMENTO e SERVIÇO (URLs próprias no topo: /supermercados,
// /transporte-aereo, etc.). Renderizadas por src/app/[slug]/page.tsx (SSG).
// Fonte única e editável. Copy de logística real, sem números inventados.
//
// As listas MENU_SEGMENTOS / MENU_SERVICOS alimentam o header e o footer — elas
// incluem tanto estas páginas novas quanto links pras páginas que JÁ existem
// (/ecommerce, /farma, /solucoes/*), pra não duplicar conteúdo.

export type LandingKind = "segmento" | "servico";
export type LandingStep = { t: string; d: string };

export type LandingPage = {
  slug: string;
  kind: LandingKind;
  /** nome curto pro menu/footer */
  nome: string;
  eyebrow: string;
  title: string;
  intro: string;
  image: string;
  benefits: string[];
  steps: LandingStep[];
  idealFor: string[];
  ctaLabel: string;
};

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

// Imagens conhecidas (já usadas no site — carregam sem 404).
const IMG = {
  warehouse: U("1553413077-190dd305871c"),
  boxes: U("1556909114-f6e7ad7d3136"),
  ecom: U("1607082348824-0a96f2a4b9da"),
  pharma: U("1587854692152-cbe660dbde88"),
  pharma2: U("1576091160550-2173dba999ef"),
  van: U("1568010567469-8622db8079bf"),
  truck: U("1620677368158-32b948b4ba6c"),
  city: U("1494412574643-ff11b0a5c1c3"),
  courier: U("1601584115197-04ecc0da31d7"),
};

// Fluxos operacionais reutilizáveis (reais, adaptados por tipo).
const S_FULFILL: LandingStep[] = [
  { t: "Recebimento", d: "Recebemos e conferimos suas mercadorias item a item na entrada." },
  { t: "Armazenagem", d: "Estoque organizado, seguro e controlado em tempo real." },
  { t: "Separação & embalagem", d: "Picking preciso e embalagem profissional a cada pedido." },
  { t: "Expedição", d: "Expedição rápida com rastreamento até o destino." },
];
const S_LASTMILE: LandingStep[] = [
  { t: "Integração", d: "Conectamos sua operação e definimos as janelas de coleta." },
  { t: "Coleta", d: "Retiramos no horário combinado, com conferência." },
  { t: "Rota", d: "Sequenciamento inteligente priorizando o menor prazo." },
  { t: "Entrega + evidência", d: "Foto, status e comprovação ao final." },
];
const S_TRANSPORT: LandingStep[] = [
  { t: "Cotação", d: "Dimensionamos o modal pelo volume, peso e destino." },
  { t: "Coleta", d: "Retirada com conferência e registro de saída." },
  { t: "Transporte monitorado", d: "Acompanhamento em tempo real durante o trajeto." },
  { t: "Entrega + evidência", d: "Comprovação com foto/assinatura e status." },
];
const S_DOC: LandingStep[] = [
  { t: "Coleta", d: "Retirada com registro e cadeia de custódia." },
  { t: "Custódia", d: "Sigilo e controle a cada movimentação." },
  { t: "Transporte monitorado", d: "Trajeto acompanhado em tempo real." },
  { t: "Entrega comprovada", d: "Assinatura, foto e status para auditoria." },
];

const CTA = "Solicitar diagnóstico gratuito";

export const LANDING_PAGES: LandingPage[] = [
  // ===================== SEGMENTOS (novos) =====================
  {
    slug: "marketplaces", kind: "segmento", nome: "Marketplaces",
    eyebrow: "Segmento · Marketplaces",
    title: "Logística pronta para os prazos dos marketplaces.",
    intro:
      "Mercado Livre, Shopee, Amazon e outros cobram SLA rígido de coleta e postagem. Cuidamos da operação para você bater o prazo, manter a reputação e escalar sem tomar penalidade.",
    image: IMG.boxes,
    benefits: [
      "Coleta e expedição dentro do SLA de cada marketplace",
      "Integração com Full, Flex e envios próprios",
      "Etiquetagem, conferência e bipagem antes da saída",
      "Rastreamento e comprovante de cada pedido",
      "Baixa de devoluções com a mesma rastreabilidade",
      "Estrutura para picos de campanha e datas quentes",
    ],
    steps: S_FULFILL,
    idealFor: ["Sellers de Mercado Livre, Shopee e Amazon", "Operações multicanal", "Quem toma penalidade por atraso", "Lojas migrando para o Full"],
    ctaLabel: CTA,
  },
  {
    slug: "moda-e-vestuario", kind: "segmento", nome: "Moda e Vestuário",
    eyebrow: "Segmento · Moda e Vestuário",
    title: "Moda que chega rápido e volta sem dor de cabeça.",
    intro:
      "Coleção nova, troca de numeração e alta taxa de devolução: moda exige entrega ágil e reversa impecável. Operamos com cuidado de manuseio e reversa integrada para proteger sua margem e a experiência.",
    image: IMG.boxes,
    benefits: [
      "Manuseio e embalagem que preservam as peças",
      "Entrega expressa em São Paulo e Grande SP",
      "Logística reversa de trocas e devoluções integrada",
      "Rastreamento em tempo real para o comprador",
      "Estrutura para picos de coleção e liquidação",
      "Comprovante de entrega com foto e status",
    ],
    steps: S_FULFILL,
    idealFor: ["Marcas de moda e DTC", "Calçados e acessórios", "Lojas com alta troca/devolução", "Operações omnichannel"],
    ctaLabel: CTA,
  },
  {
    slug: "cosmeticos", kind: "segmento", nome: "Cosméticos",
    eyebrow: "Segmento · Cosméticos",
    title: "Cuidado premium para cosméticos e dermo.",
    intro:
      "Produto de valor pede manuseio cuidadoso, embalagem adequada e reversa eficiente. Tratamos cada item com o padrão que a sua marca construiu, da armazenagem à entrega.",
    image: IMG.pharma2,
    benefits: [
      "Manuseio cuidadoso e embalagem protetiva",
      "Armazenagem organizada com controle de estoque",
      "Rastreabilidade ponta a ponta",
      "Logística reversa de trocas e garantias",
      "Operação B2B e B2C",
      "Relatórios por categoria de produto",
    ],
    steps: S_FULFILL,
    idealFor: ["Marcas de cosméticos", "Dermocosméticos", "Suplementos", "Correlatos e dispositivos"],
    ctaLabel: CTA,
  },
  {
    slug: "saude", kind: "segmento", nome: "Saúde",
    eyebrow: "Segmento · Saúde",
    title: "Logística para saúde com controle e evidência.",
    intro:
      "Clínicas, distribuidores e marcas de saúde precisam de rastreabilidade, cuidado e comprovação. Operação orientada a processo, com checklist e evidência em cada etapa.",
    image: IMG.pharma,
    benefits: [
      "Manuseio adequado para itens sensíveis",
      "Checklist e evidência fotográfica na entrega",
      "Assinatura digital e comprovação de recebimento",
      "Rastreamento em tempo real da coleta à entrega",
      "Gestão de ocorrências e não conformidades",
      "SLA dedicado por operação",
    ],
    steps: S_LASTMILE,
    idealFor: ["Clínicas e consultórios", "Distribuidores de saúde", "Marcas de bem-estar", "Operações B2B e B2C"],
    ctaLabel: CTA,
  },
  {
    slug: "eletronicos", kind: "segmento", nome: "Eletrônicos",
    eyebrow: "Segmento · Eletrônicos",
    title: "Eletrônicos: valor alto, manuseio seguro.",
    intro:
      "Itens frágeis e de alto valor não admitem avaria nem extravio. Embalagem protetiva, conferência rigorosa e rastreabilidade total do recebimento à entrega.",
    image: IMG.warehouse,
    benefits: [
      "Embalagem protetiva para itens frágeis",
      "Conferência rigorosa de série/IMEI quando aplicável",
      "Armazenagem segura com controle de estoque",
      "Rastreabilidade ponta a ponta",
      "Logística reversa de trocas e garantias",
      "Comprovação de entrega com foto e assinatura",
    ],
    steps: S_FULFILL,
    idealFor: ["Lojas de eletrônicos", "Acessórios e informática", "Assistências técnicas", "Marcas com garantia/RMA"],
    ctaLabel: CTA,
  },
  {
    slug: "autopecas", kind: "segmento", nome: "Autopeças",
    eyebrow: "Segmento · Autopeças",
    title: "Autopeças: volume, peso e prazo sob controle.",
    intro:
      "Do parafuso à peça pesada, cada item catalogado, separado com precisão e expedido no prazo. Operação preparada para muitos SKUs e cargas variadas.",
    image: IMG.warehouse,
    benefits: [
      "Armazenagem para catálogos com muitos SKUs",
      "Separação precisa por código e aplicação",
      "Suporte a itens pesados e volumosos",
      "Expedição integrada ao transporte rodoviário",
      "Rastreabilidade completa dos pedidos",
      "Estrutura para volume recorrente",
    ],
    steps: S_FULFILL,
    idealFor: ["Distribuidores de autopeças", "Lojas e e-commerce do setor", "Retíficas e oficinas", "Operações B2B"],
    ctaLabel: CTA,
  },
  {
    slug: "papelaria-e-livros", kind: "segmento", nome: "Papelaria e Livros",
    eyebrow: "Segmento · Papelaria e Livros",
    title: "Papelaria e livros com expedição ágil.",
    intro:
      "Alto volume de pedidos e ticket variado pedem separação precisa e embalagem eficiente. Cuidamos do fluxo para você vender mais sem gargalo na expedição.",
    image: IMG.boxes,
    benefits: [
      "Separação ágil para alto volume de pedidos",
      "Embalagem adequada para livros e materiais",
      "Armazenagem com controle de estoque",
      "Integração com marketplaces e loja própria",
      "Rastreamento e comprovante de entrega",
      "Estrutura para volta às aulas e picos",
    ],
    steps: S_FULFILL,
    idealFor: ["Papelarias e e-commerce", "Editoras e livrarias", "Materiais escolares", "Operações sazonais"],
    ctaLabel: CTA,
  },
  {
    slug: "atacado-e-varejo", kind: "segmento", nome: "Atacado e Varejo",
    eyebrow: "Segmento · Atacado e Varejo",
    title: "Atacado e varejo: do CD à loja e ao consumidor.",
    intro:
      "Abastecimento de lojas, transferências e venda direta ao consumidor numa só operação. Estrutura que sustenta volume alto com previsibilidade e controle.",
    image: IMG.warehouse,
    benefits: [
      "Abastecimento de lojas e transferências entre filiais",
      "Fulfillment para venda direta ao consumidor",
      "Armazenagem com controle de estoque em tempo real",
      "Rotas programadas e capilaridade",
      "Rastreabilidade ponta a ponta",
      "Escala para datas de alta demanda",
    ],
    steps: S_FULFILL,
    idealFor: ["Redes de varejo", "Distribuidores e atacadistas", "Operações omnichannel", "Marcas com múltiplas lojas"],
    ctaLabel: CTA,
  },
  {
    slug: "restaurantes", kind: "segmento", nome: "Restaurantes",
    eyebrow: "Segmento · Restaurantes",
    title: "Logística para restaurantes e food service.",
    intro:
      "Insumos, delivery próprio e abastecimento de unidades com pontualidade. Coletas programadas e entregas rápidas para não parar a operação.",
    image: IMG.van,
    benefits: [
      "Entregas rápidas de delivery próprio",
      "Abastecimento de insumos entre unidades",
      "Coletas programadas e sob demanda",
      "Rastreamento em tempo real",
      "Entregador dedicado quando necessário",
      "Estrutura para horários de pico",
    ],
    steps: S_LASTMILE,
    idealFor: ["Restaurantes e redes", "Dark kitchens", "Food service e distribuidores", "Delivery próprio"],
    ctaLabel: CTA,
  },
  {
    slug: "empresas-de-tecnologia", kind: "segmento", nome: "Empresas de Tecnologia",
    eyebrow: "Segmento · Tecnologia",
    title: "Logística para empresas de tecnologia.",
    intro:
      "Equipamentos, kits, trocas e logística reversa de dispositivos com rastreabilidade e SLA. Operação flexível que acompanha o ritmo de quem escala rápido.",
    image: IMG.city,
    benefits: [
      "Envio de equipamentos e kits de onboarding",
      "Logística reversa de dispositivos",
      "Rastreabilidade ponta a ponta e SLA",
      "Armazenagem e controle de estoque",
      "Operação flexível que escala com você",
      "Comprovação de entrega com evidência",
    ],
    steps: S_FULFILL,
    idealFor: ["Startups e SaaS com hardware", "Empresas de dispositivos e IoT", "Times remotos (envio de kits)", "Assistência e RMA"],
    ctaLabel: CTA,
  },
  {
    slug: "fintechs", kind: "segmento", nome: "Fintechs",
    eyebrow: "Segmento · Fintechs",
    title: "Logística para fintechs, do cartão à maquininha.",
    intro:
      "Envio de cartões, maquininhas, kits de onboarding e reversa de equipamentos com rastreio e agilidade. Estrutura que escala com a sua base de clientes.",
    image: IMG.courier,
    benefits: [
      "Envio de cartões e maquininhas",
      "Kits de onboarding para novos clientes",
      "Logística reversa de equipamentos",
      "Rastreabilidade ponta a ponta",
      "Escala para crescimento acelerado da base",
      "Comprovação de entrega com evidência",
    ],
    steps: S_FULFILL,
    idealFor: ["Fintechs e adquirentes", "Bancos digitais", "Meios de pagamento", "Operações com hardware em campo"],
    ctaLabel: CTA,
  },
  {
    slug: "laboratorios", kind: "segmento", nome: "Laboratórios",
    eyebrow: "Segmento · Laboratórios",
    title: "Logística para laboratórios e diagnóstico.",
    intro:
      "Amostras, materiais e correlatos com manuseio cuidadoso, coleta programada e rastreabilidade. Operação orientada a processo e evidência.",
    image: IMG.pharma,
    benefits: [
      "Coleta programada de amostras e materiais",
      "Manuseio cuidadoso e conforme o item",
      "Rastreabilidade e evidência em cada etapa",
      "Checklist e comprovação de recebimento",
      "Rotas dedicadas entre unidades",
      "Atendimento e SLA dedicados",
    ],
    steps: S_LASTMILE,
    idealFor: ["Laboratórios clínicos", "Centros de diagnóstico", "Distribuidores de correlatos", "Redes com múltiplas coletas"],
    ctaLabel: CTA,
  },
  {
    slug: "empresas", kind: "segmento", nome: "Pequenas, Médias e Grandes Empresas",
    eyebrow: "Segmento · Empresas",
    title: "Logística que cresce junto com a sua empresa.",
    intro:
      "Da pequena operação ao volume corporativo, estruturamos a logística sob medida. Você escala vendas sem escalar complexidade nem custo fixo.",
    image: IMG.city,
    benefits: [
      "Operação sob medida para o seu porte",
      "Armazenagem, expedição e transporte integrados",
      "Indicadores de desempenho e transparência",
      "Escala sem novos galpões ou equipes",
      "Atendimento dedicado",
      "Custo variável que acompanha o volume",
    ],
    steps: S_FULFILL,
    idealFor: ["Pequenas empresas", "Médias empresas", "Grandes operações", "Indústrias e distribuidores"],
    ctaLabel: CTA,
  },

  // ===================== SERVIÇOS (novos) =====================
  {
    slug: "transporte-rodoviario", kind: "servico", nome: "Transporte Rodoviário",
    eyebrow: "Serviço · Transporte Rodoviário",
    title: "Transporte rodoviário com rastreio e evidência.",
    intro:
      "Fracionado ou dedicado, cargas de todos os tamanhos com motorista treinado, acompanhamento em tempo real e comprovação de entrega. Malha para São Paulo, região e rotas programadas.",
    image: IMG.truck,
    benefits: [
      "Cargas fracionadas e dedicadas",
      "Transferências entre filiais e CDs",
      "Rastreamento em tempo real",
      "Comprovante de entrega com foto/assinatura",
      "Motorista treinado e comunicação direta",
      "Agendamento conforme a sua necessidade",
    ],
    steps: S_TRANSPORT,
    idealFor: ["Indústrias e distribuidores", "Atacado e varejo", "Empresas com múltiplas filiais", "Cargas fracionadas e volumosas"],
    ctaLabel: CTA,
  },
  {
    slug: "transporte-aereo", kind: "servico", nome: "Transporte Aéreo",
    eyebrow: "Serviço · Transporte Aéreo",
    title: "Transporte aéreo para quando o prazo é curto.",
    intro:
      "Quando a distância é grande e o prazo é apertado, o modal aéreo resolve. Coletamos, despachamos e acompanhamos sua carga com rastreabilidade de ponta a ponta.",
    image: IMG.city,
    benefits: [
      "Entregas de longa distância no menor prazo",
      "Coleta, despacho e acompanhamento",
      "Rastreamento em tempo real",
      "Integração com last mile na chegada",
      "Documentação e conferência da carga",
      "Solução para urgências e prazos críticos",
    ],
    steps: S_TRANSPORT,
    idealFor: ["Envios interestaduais urgentes", "Cargas de alto valor", "Reposição crítica", "E-commerce com entrega nacional"],
    ctaLabel: CTA,
  },
  {
    slug: "documentos", kind: "servico", nome: "Documentos e Malotes",
    eyebrow: "Serviço · Documentos e Malotes",
    title: "Documentos e malotes com sigilo e comprovação.",
    intro:
      "Contratos, malotes, cartões e documentos sensíveis transportados com segurança, sigilo e comprovação de entrega. Rotas programadas ou sob demanda, com registro de cada movimentação.",
    image: IMG.courier,
    benefits: [
      "Coleta e entrega de malotes e documentos",
      "Sigilo e cadeia de custódia",
      "Comprovação com assinatura e foto",
      "Rotas programadas ou urgentes",
      "Rastreamento de cada movimentação",
      "Atendimento dedicado",
    ],
    steps: S_DOC,
    idealFor: ["Bancos e fintechs", "Escritórios e cartórios", "Backoffice corporativo", "Empresas com malote entre unidades"],
    ctaLabel: CTA,
  },
];

export function getLandingPage(slug: string): LandingPage | undefined {
  return LANDING_PAGES.find((p) => p.slug === slug);
}
export function allLandingSlugs(): string[] {
  return LANDING_PAGES.map((p) => p.slug);
}

// ---------------------------------------------------------------------------
// Menus (header + footer). Incluem páginas novas E links pras que já existem.
// ---------------------------------------------------------------------------
export type MenuLink = { label: string; href: string; sub?: string };

export const MENU_SEGMENTOS: MenuLink[] = [
  { label: "E-commerce", href: "/ecommerce" },
  { label: "Marketplaces", href: "/marketplaces" },
  { label: "Moda e Vestuário", href: "/moda-e-vestuario" },
  { label: "Cosméticos", href: "/cosmeticos" },
  { label: "Farmacêutico", href: "/farma" },
  { label: "Saúde", href: "/saude" },
  { label: "Eletrônicos", href: "/eletronicos" },
  { label: "Autopeças", href: "/autopecas" },
  { label: "Papelaria e Livros", href: "/papelaria-e-livros" },
  { label: "Atacado e Varejo", href: "/atacado-e-varejo" },
  { label: "Restaurantes", href: "/restaurantes" },
  { label: "Empresas de Tecnologia", href: "/empresas-de-tecnologia" },
  { label: "Fintechs", href: "/fintechs" },
  { label: "Laboratórios", href: "/laboratorios" },
  { label: "Peq., Médias e Grandes Empresas", href: "/empresas" },
];

// Estes 3 itens NÃO têm mais dropdown próprio na barra — foram realocados para
// DENTRO da aba Ecommerce do mega-menu (ver Header.tsx). A lista segue aqui como
// fonte única (usada também no rodapé e no Mapa do Site). `sub` = subtítulo que
// os deixa visualmente iguais aos serviços da aba Ecommerce.
export const MENU_SERVICOS: MenuLink[] = [
  { label: "Transporte Rodoviário", href: "/transporte-rodoviario", sub: "Fracionado e dedicado" },
  { label: "Transporte Aéreo", href: "/transporte-aereo", sub: "Prazo curto, longa distância" },
  { label: "Soluções para E-commerce", href: "/solucoes/ecommerce-express", sub: "Same Day, Next Day e reversa" },
];
