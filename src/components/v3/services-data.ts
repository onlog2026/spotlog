// Dados de serviços da landing v3 — portado de _zip_inspect/v3/components/services-data.jsx
export type ServiceStep = [string, string];

export type Service = {
  id: string;
  group: 'ecommerce' | 'farma';
  name: string;
  buy: string;
  eyebrow: string;
  title: string;
  trigger: string;
  intro: string;
  scene: string;
  src: string;
  benefits: string[];
  idealFor: string[];
  note?: string;
  steps: ServiceStep[];
  cta: string;
};

export type ServiceGroup = {
  id: 'ecommerce' | 'farma';
  label: string;
  tagline: string;
  items: Service[];
};

// =====================================================================
// SERVICE TREE + per-service content for explaining pages.
// Grouped into two pillars: Ecommerce e Farma.
// =====================================================================

export const SERVICES: Service[] = [
  // ---------- ECOMMERCE ----------
  {
    id: "same-day", group: "ecommerce",
    name: "Same Day & Next Day",
    buy: "Crescimento das vendas",
    eyebrow: "Foco em Ecommerce",
    title: "Seu cliente compra hoje. Nós entregamos hoje.",
    trigger: "Quanto sua empresa perde por atrasos na entrega?",
    intro: "Operação especializada em entregas no mesmo dia e no dia seguinte para ecommerces que precisam aumentar conversão, reduzir reclamações e acelerar o crescimento. Velocidade que vira diferencial competitivo no checkout.",
    scene: "boxes", src: "1607082348824-0a96f2a4b9da",
    benefits: ["Entregas Same Day em SP e RMSP","Entregas Next Day com previsibilidade","Priorização inteligente de rotas","Rastreamento em tempo real para o comprador","Notificações automáticas (e-mail, SMS, WhatsApp)","Escalabilidade para picos de demanda"],
    idealFor: ["Lojas virtuais","Marcas DTC","Moda, calçados e acessórios","Operações omnichannel"],
    steps: [
      ["Integração","Conectamos sua loja ou marketplace em poucos cliques."],
      ["Coleta","Retiramos no seu CD em janela programada."],
      ["Rota expressa","Sequenciamento priorizando Same/Next Day."],
      ["Entrega + evidência","Foto, status e avaliação do comprador."],
    ],
    cta: "Solicitar simulação gratuita",
  },
  {
    id: "fulfillment", group: "ecommerce",
    name: "Armazenagem & Fulfillment",
    buy: "Escalabilidade",
    eyebrow: "Foco em Crescimento",
    title: "Cresça sem aumentar a estrutura.",
    trigger: "Estoque sem controle, atrasos na expedição, alto custo operacional?",
    intro: "Enquanto você foca em vendas, marketing e crescimento, nós cuidamos de toda a operação logística: recebimento, armazenagem, separação, embalagem e expedição. Integrado ao last mile para reduzir prazos e elevar a satisfação dos clientes.",
    scene: "warehouse", src: "1553413077-190dd305871c",
    benefits: ["Recebimento e conferência","Armazenagem com controle de estoque","Separação e embalagem","Expedição integrada ao last mile","Estrutura que acompanha Black Friday e picos","Transparência total de movimentações"],
    idealFor: ["Ecommerce em crescimento","Marcas com sazonalidade forte","Operações que querem terceirizar a logística"],
    steps: [
      ["Recebimento","Entrada conferida item a item."],
      ["Armazenagem","Estoque organizado e rastreável."],
      ["Pedido","Separação e embalagem ágeis."],
      ["Expedição","Integração direta com Same/Next Day."],
    ],
    cta: "Solicitar diagnóstico gratuito",
  },
  {
    id: "coleta", group: "ecommerce",
    name: "Coleta Programada",
    buy: "Previsibilidade",
    eyebrow: "Rotina logística confiável",
    title: "Tenha uma operação previsível, com retiradas programadas.",
    trigger: "Pare de perder tempo com solicitações avulsas de coleta.",
    intro: "Garantimos que suas mercadorias sejam retiradas nos horários e frequências acordados, criando uma rotina logística confiável para acompanhar o crescimento do seu negócio — com planejamento, monitoramento e execução eficiente.",
    scene: "van", src: "1568010567469-8622db8079bf",
    benefits: ["Coletas diárias ou personalizadas","Rotas otimizadas","Mais controle e previsibilidade","Integração com Same Day e Next Day","Atendimento dedicado","Escalabilidade para operações em crescimento"],
    idealFor: ["Ecommerce com volume recorrente","Distribuidores","Operações B2B"],
    steps: [
      ["Acordo de janela","Definimos horários e frequência."],
      ["Coleta recorrente","Retirada pontual no seu endereço."],
      ["Triagem","Separação por região e SLA."],
      ["Entrega","Ciclo venda → entrega mais curto."],
    ],
    cta: "Agendar avaliação logística",
  },
  {
    id: "reversa", group: "ecommerce",
    name: "Logística Reversa",
    buy: "Experiência do cliente",
    eyebrow: "Pós-venda que fideliza",
    title: "Transforme devoluções em oportunidades de fidelização.",
    trigger: "A experiência do cliente não termina na entrega.",
    intro: "Operação completa de logística reversa para empresas que buscam agilidade, controle e excelência. Coletamos produtos devolvidos, trocas, garantias e retornos operacionais com total rastreabilidade — mantendo o padrão de qualidade em toda a jornada.",
    scene: "boxes", src: "1586528116311-ad8dd3c8310d",
    benefits: ["Coleta de devoluções e trocas","Gestão de garantias e retornos","Rastreabilidade ponta a ponta","Acompanhamento por status","Relatórios de reversa","Padrão de qualidade preservado"],
    idealFor: ["Ecommerce","Varejo","Farmacêutico","Cosméticos","Eletrônicos","Distribuidores"],
    steps: [
      ["Solicitação","Cliente final ou loja aciona a reversa."],
      ["Coleta","Retiramos no endereço do consumidor."],
      ["Conferência","Produto checado e registrado."],
      ["Retorno","Devolução ao CD com evidência."],
    ],
    cta: "Solicitar proposta de reversa",
  },
  // ---------- FARMA ----------
  {
    id: "farmaco", group: "farma",
    name: "Logística Farmacêutica",
    buy: "Segurança e conformidade",
    eyebrow: "Foco Farmacêutico",
    title: "Logística farmacêutica com a segurança que sua operação exige.",
    trigger: "Quando o produto é sensível, a logística não pode falhar.",
    intro: "Especializada em medicamentos, cosméticos e produtos regulados, com processos adequados às exigências do setor. Operação orientada à conformidade, com documentação cadastrada e validada — sem afirmar certificações que não estejam comprovadas.",
    scene: "pharmacy", src: "1576091160550-2173dba999ef",
    benefits: ["Transporte de medicamentos","Licenças e documentos no painel*","Controle operacional rigoroso","Rastreabilidade ponta a ponta","SLA dedicado","Operação B2B e B2C"],
    idealFor: ["Farmácias de manipulação","Drogarias","Distribuidores","Laboratórios","Clínicas e hospitais"],
    note: "*Licenças e documentos regulatórios cadastrados e validados internamente. Não afirmamos certificações sem comprovação documental.",
    steps: [
      ["Checklist","Procedimento por tipo de produto."],
      ["Coleta controlada","Janela curta e registro de saída."],
      ["Transporte","Cuidado de manuseio e rastreio."],
      ["Entrega + evidência","Foto e assinatura do recebedor."],
    ],
    cta: "Solicitar diagnóstico logístico",
  },
  {
    id: "dedicado", group: "farma",
    name: "Entregador Dedicado",
    buy: "Exclusividade",
    eyebrow: "Operação exclusiva",
    title: "Entregadores dedicados como uma extensão da sua equipe.",
    trigger: "Sua operação merece uma logística exclusiva.",
    intro: "Diferente dos modelos compartilhados, nossa solução dedicada garante disponibilidade exclusiva para coletas, entregas, movimentações internas e atendimentos urgentes sempre que sua operação precisar — com rapidez, comprometimento e foco total no seu negócio.",
    scene: "courier", src: "1601584115197-04ecc0da31d7",
    benefits: ["Disponibilidade exclusiva","Coletas e entregas sob demanda","Movimentações internas","Atendimentos urgentes","SLA dedicado","Equipe alocada à sua operação"],
    idealFor: ["Laboratórios","Farmácias","Hospitais","Clínicas","Distribuidores","Escritórios corporativos","Ecommerce de alta demanda"],
    steps: [
      ["Estudo operacional","Mapeamos sua demanda."],
      ["Alocação","Entregador(es) dedicado(s)."],
      ["Operação","Extensão da sua equipe no dia a dia."],
      ["Gestão","Indicadores e SLA acompanhados."],
    ],
    cta: "Solicitar estudo operacional",
  },
  {
    id: "sob-demanda", group: "farma",
    name: "Operação Sob Demanda",
    buy: "Flexibilidade",
    eyebrow: "Capacidade adicional",
    title: "Flexibilidade operacional para empresas que não podem parar.",
    trigger: "Sua operação cresce. Sua logística acompanha.",
    intro: "Nem sempre a demanda é previsível. Por isso disponibilizamos recursos logísticos adicionais de forma rápida e eficiente, permitindo que sua empresa absorva aumentos de volume sem comprometer prazos, qualidade ou experiência do cliente.",
    scene: "van", src: "1568010567469-8622db8079bf",
    benefits: ["Motos dedicadas temporárias","Veículos utilitários","Equipes de apoio operacional","Coletas extraordinárias","Entregas emergenciais","Projetos personalizados"],
    idealFor: ["Operações sazonais","Campanhas e datas de pico","Projetos temporários","Lançamentos"],
    steps: [
      ["Acionamento","Você sinaliza o aumento de volume."],
      ["Mobilização","Recursos extras em pouco tempo."],
      ["Execução","Capacidade adicional ativa."],
      ["Encerramento","Volta ao baseline sem ruído."],
    ],
    cta: "Falar com especialista",
  },
  {
    id: "cosmeticos", group: "farma",
    name: "Cosméticos & Correlatos",
    buy: "Cuidado e padrão",
    eyebrow: "Produtos de alto valor",
    title: "Cuidado de manuseio para cosméticos, dermo e correlatos.",
    trigger: "Produto premium pede operação premium.",
    intro: "Dermocosméticos, suplementos, correlatos e dispositivos exigem manuseio cuidadoso, embalagem adequada e logística reversa eficiente. Tratamos cada item com o padrão que a sua marca construiu.",
    scene: "pharmacy", src: "1556228578-8c89e6adf883",
    benefits: ["Manuseio cuidadoso","Embalagem adequada","Rastreabilidade","Logística reversa","Operação B2B e B2C","Relatórios por categoria"],
    idealFor: ["Marcas de cosméticos","Dermocosméticos","Suplementos","Correlatos e dispositivos"],
    steps: [
      ["Recebimento","Conferência com cuidado de valor."],
      ["Separação","Embalagem protetiva."],
      ["Entrega","Padrão de experiência da marca."],
      ["Reversa","Trocas e garantias rastreadas."],
    ],
    cta: "Receber proposta personalizada",
  },
];

export const SERVICE_TREE: ServiceGroup[] = [
  {
    id: "ecommerce", label: "Ecommerce",
    tagline: "Vender mais e entregar melhor",
    items: SERVICES.filter(s => s.group === "ecommerce"),
  },
  {
    id: "farma", label: "Farmacêutico",
    tagline: "Segurança para produtos sensíveis",
    items: SERVICES.filter(s => s.group === "farma"),
  },
];

export const findService = (id: string): Service | undefined =>
  SERVICES.find((s) => s.id === id);

// URL REAL de cada serviço do mega-menu (Ecommerce/Farma) — pra NAVEGAR em vez
// de abrir modal. Mantém URL = conteúdo = nome do menu.
export const SERVICE_HREF: Record<string, string> = {
  "same-day": "/solucoes/same-day",
  fulfillment: "/solucoes/armazenagem",
  coleta: "/solucoes/coletas",
  reversa: "/solucoes/reversa",
  farmaco: "/farma",
  dedicado: "/solucoes/moto-fixa",
  "sob-demanda": "/solucoes/sob-demanda",
  cosmeticos: "/cosmeticos",
};
export const serviceHref = (id: string): string => SERVICE_HREF[id] ?? "/solucoes";
