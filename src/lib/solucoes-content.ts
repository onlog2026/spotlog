// Conteúdo das páginas de destino de cada solução (/solucoes/[slug]).
// Slugs = os slots dos cards em SolucoesGridV3. Conteúdo de logística real,
// sem números/estatísticas inventados. Editável aqui (fonte única).

export type SolucaoStep = { t: string; d: string };

export type SolucaoContent = {
  slug: string;
  eyebrow: string;
  title: string;
  intro: string;
  /** imagem do banner (topo da página) */
  image: string;
  benefits: string[];
  steps: SolucaoStep[];
  idealFor: string[];
  ctaLabel: string;
  // ----- campos OPCIONAIS (páginas ricas, ex.: Armazenagem). As 8 páginas
  // antigas não os usam; ficam undefined e nada muda nelas. -----
  /** parágrafo de reforço logo abaixo do banner */
  lead2?: string;
  /** título do bloco de benefícios (default "Benefícios") */
  benefitsTitle?: string;
  /** segunda lista em formato checklist (ex.: "Você ganha") */
  gains?: string[];
  gainsTitle?: string;
  gainsEyebrow?: string;
  /** seções de texto corrido (narrativa de vendas) */
  sections?: SolucaoStep[];
  /** frase de fechamento no CTA final */
  closing?: string;
};

const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=1600&q=80`;

export const SOLUCOES: SolucaoContent[] = [
  {
    slug: "armazenagem",
    eyebrow: "Armazenagem & Fulfillment",
    title: "Transforme sua Logística em uma Máquina de Crescimento",
    intro:
      "Seu e-commerce está crescendo. Sua operação acompanha? Vender é apenas o começo — o verdadeiro desafio é armazenar, separar, embalar e entregar cada pedido com rapidez, precisão e qualidade. É exatamente para isso que existe o nosso serviço de Armazenagem Inteligente e Fullfillment.",
    image: U("1553413077-190dd305871c"),
    lead2:
      "Enquanto você perde tempo gerenciando estoque, atrasos, erros de separação e custos operacionais, sua equipe deixa de focar no que realmente importa: vender mais e crescer o negócio. Armazene, venda — nós fazemos o resto. Recebemos seus produtos, armazenamos com segurança, controlamos seu estoque em tempo real e cuidamos de todo o processo operacional após cada venda, com processos padronizados, tecnologia e total rastreabilidade.",
    benefitsTitle: "O que fazemos por você",
    benefits: [
      "Armazenagem segura e organizada",
      "Controle de estoque em tempo real",
      "Recebimento e conferência de mercadorias",
      "Separação (Picking) com alta precisão",
      "Embalagem profissional",
      "Expedição rápida",
      "Integração com marketplaces e plataformas de e-commerce",
      "Rastreabilidade completa dos pedidos",
      "Gestão logística com indicadores de desempenho",
    ],
    gainsEyebrow: "Eficiência",
    gainsTitle: "Reduza custos e aumente sua eficiência",
    gains: [
      "Menor custo operacional",
      "Mais velocidade nas entregas",
      "Menos erros de expedição",
      "Redução de devoluções",
      "Maior satisfação dos clientes",
      "Escalabilidade para datas de grande demanda",
      "Mais tempo para focar em marketing, vendas e expansão",
    ],
    steps: [
      { t: "Recebimento", d: "Recebemos e conferimos suas mercadorias item a item na entrada." },
      { t: "Armazenagem", d: "Estoque organizado, seguro e controlado em tempo real." },
      { t: "Separação & embalagem", d: "Picking de alta precisão e embalagem profissional a cada pedido." },
      { t: "Expedição", d: "Expedição rápida com rastreabilidade completa até o consumidor final." },
    ],
    sections: [
      {
        t: "Cada pedido é tratado como se fosse nosso",
        d: "Sabemos que cada entrega representa uma promessa feita ao seu cliente. Por isso, trabalhamos com processos rigorosos de conferência, armazenamento e expedição para garantir que cada pedido saia corretamente, dentro do prazo e com a qualidade que fortalece sua marca.",
      },
      {
        t: "Cresça sem se preocupar com a operação",
        d: "Não importa se você envia dezenas, centenas ou milhares de pedidos por mês. Nossa estrutura acompanha o crescimento da sua empresa sem que você precise investir em novos galpões, contratar equipes ou aumentar sua complexidade operacional. Você cresce. Sua logística cresce junto.",
      },
      {
        t: "Muito mais que armazenagem",
        d: "Somos um parceiro estratégico para empresas que desejam escalar suas vendas com uma operação logística eficiente, inteligente e confiável. Nossa missão é transformar a logística em uma vantagem competitiva para o seu negócio.",
      },
    ],
    idealFor: [
      "E-commerce em crescimento",
      "Marcas com forte sazonalidade",
      "Operações que querem terceirizar a logística",
      "Quem envia de dezenas a milhares de pedidos por mês",
    ],
    closing:
      "Sua logística pode ser um custo… ou o diferencial que fará sua empresa crescer.",
    ctaLabel: "Solicitar diagnóstico gratuito",
  },
  {
    slug: "ecommerce-express",
    eyebrow: "E-commerce",
    title: "Entregas para E-commerce, da coleta ao comprovante",
    intro:
      "Uma operação de última milha desenhada para lojas virtuais: coletamos no seu CD, entregamos com prazo curto e devolvemos a prova de entrega — tudo rastreado. Menos chamados no SAC, mais recompra e uma experiência de entrega que vira diferencial no checkout.",
    image: U("1556909114-f6e7ad7d3136"),
    benefits: [
      "Coleta programada no seu centro de distribuição ou loja",
      "Entregas expressas em São Paulo capital e Grande SP",
      "Rastreamento em tempo real para você e para o comprador",
      "Notificações automáticas por e-mail, SMS e WhatsApp",
      "Comprovante de entrega com foto e status",
      "Estrutura que aguenta picos (Black Friday, datas sazonais)",
    ],
    steps: [
      { t: "Integração", d: "Conectamos sua loja ou marketplace e definimos as janelas de coleta." },
      { t: "Coleta", d: "Retiramos os pedidos no horário combinado, com conferência." },
      { t: "Rota expressa", d: "Sequenciamento inteligente priorizando o menor prazo." },
      { t: "Entrega + evidência", d: "Foto, status e avaliação do comprador ao final." },
    ],
    idealFor: ["Lojas virtuais", "Marcas DTC", "Moda, calçados e acessórios", "Operações omnichannel"],
    ctaLabel: "Solicitar simulação gratuita",
  },
  {
    slug: "express-pharma",
    eyebrow: "Farma & Saúde",
    title: "Transporte farmacêutico com controle e conformidade",
    intro:
      "Operação sensível exige processo. Cuidamos de medicamentos, manipulados e correlatos com rastreabilidade ponta a ponta, checklist por entrega e evidência documental — respeitando os requisitos do setor de saúde e as boas práticas de distribuição.",
    image: U("1587854692152-cbe660dbde88"),
    benefits: [
      "Manuseio adequado para itens sensíveis e termolábeis",
      "Checklist e evidência fotográfica em cada entrega",
      "Assinatura digital e comprovação de recebimento",
      "Gestão de não conformidades e ocorrências",
      "Rastreamento em tempo real da coleta à entrega",
      "Equipe orientada às boas práticas do setor",
    ],
    steps: [
      { t: "Diagnóstico", d: "Mapeamos os requisitos da sua operação (temperatura, prazos, documentação)." },
      { t: "Coleta controlada", d: "Retirada com conferência e registro." },
      { t: "Transporte monitorado", d: "Acompanhamento em tempo real durante o trajeto." },
      { t: "Entrega com evidência", d: "Foto, assinatura e status para auditoria." },
    ],
    idealFor: ["Farmácias e drogarias", "Farmácias de manipulação", "Laboratórios", "Distribuidores de correlatos"],
    ctaLabel: "Falar com especialista farma",
  },
  {
    slug: "same-day",
    eyebrow: "Entregas Expressas",
    title: "Seu cliente compra hoje. A gente entrega hoje.",
    intro:
      "Operação especializada em entregas no mesmo dia (Same Day) e no dia seguinte (Next Day) para quem precisa aumentar conversão, reduzir reclamações e acelerar o crescimento. Velocidade que vira argumento de venda no checkout.",
    image: U("1494412651409-8963ce7935a7"),
    benefits: [
      "Same Day em São Paulo capital e região metropolitana",
      "Next Day com previsibilidade de janela",
      "Priorização inteligente de rotas",
      "Rastreamento em tempo real para o comprador",
      "Notificações automáticas em cada etapa",
      "Escalabilidade para picos de demanda",
    ],
    steps: [
      { t: "Integração", d: "Conectamos sua loja ou marketplace em poucos cliques." },
      { t: "Coleta", d: "Retiramos no seu CD em janela programada." },
      { t: "Rota expressa", d: "Sequenciamento priorizando Same/Next Day." },
      { t: "Entrega + evidência", d: "Foto, status e avaliação do comprador." },
    ],
    idealFor: ["Ecommerce que quer converter mais", "Marcas DTC", "Operações omnichannel", "Quem perde venda por prazo longo"],
    ctaLabel: "Solicitar simulação gratuita",
  },
  {
    slug: "coletas",
    eyebrow: "Rotina confiável",
    title: "Coletas programadas, operação previsível",
    intro:
      "Chega de solicitar coleta avulsa toda hora. Nossa equipe passa no seu CD, loja ou laboratório nos horários definidos, com checklist e confirmação — para você planejar a expedição com previsibilidade.",
    image: U("1586528116311-ad8dd3c8310d"),
    benefits: [
      "Janelas fixas de retirada, do seu jeito",
      "Checklist e conferência na coleta",
      "Confirmação de retirada em tempo real",
      "Integração direta com as rotas de entrega",
      "Menos ruído operacional e retrabalho",
      "Escala flexível conforme o volume",
    ],
    steps: [
      { t: "Definição", d: "Combinamos dias e horários das coletas." },
      { t: "Retirada", d: "A equipe passa no local com checklist." },
      { t: "Conferência", d: "Registro e confirmação dos volumes." },
      { t: "Encaminhamento", d: "Segue direto para a malha de entrega." },
    ],
    idealFor: ["Centros de distribuição", "Lojas físicas com envio", "Laboratórios", "Operações com volume recorrente"],
    ctaLabel: "Programar minhas coletas",
  },
  {
    slug: "moto-fixa",
    eyebrow: "Dedicado",
    title: "Moto fixa: entregador dedicado para a sua operação",
    intro:
      "Um motoboy dedicado ao seu volume, com escala combinada e suporte direto. Ideal para quem tem demanda constante e quer alguém que conhece a operação, os produtos e os clientes — sem a variabilidade do avulso.",
    image: U("1601584115197-04ecc0da31d7"),
    benefits: [
      "Entregador exclusivo para o seu negócio",
      "Escala definida conforme sua rotina",
      "Familiaridade com seus produtos e clientes",
      "Suporte direto e comunicação ágil",
      "Rastreamento e comprovação de entrega",
      "Custo previsível por período",
    ],
    steps: [
      { t: "Dimensionamento", d: "Entendemos seu volume e horários de pico." },
      { t: "Alocação", d: "Definimos a escala do entregador dedicado." },
      { t: "Operação", d: "Entregas do dia com rastreio e evidência." },
      { t: "Ajuste", d: "Revisamos a escala conforme a demanda evolui." },
    ],
    idealFor: ["Restaurantes e delivery próprio", "Farmácias de bairro", "Lojas com entrega local", "Operações com demanda diária"],
    ctaLabel: "Quero um entregador dedicado",
  },
  {
    slug: "reversa",
    eyebrow: "Pós-venda",
    title: "Logística reversa com a mesma rastreabilidade da ida",
    intro:
      "Devolução, troca e retorno de mercadoria fazem parte do jogo — e mal resolvidos custam caro em reputação. Cuidamos da coleta reversa com o mesmo padrão de rastreamento e evidência da entrega, para fechar o ciclo sem dor de cabeça.",
    image: U("1586528116493-a029325540fa"),
    benefits: [
      "Coleta de devoluções na casa do cliente",
      "Troca de mercadoria no mesmo movimento quando aplicável",
      "Rastreamento e evidência do retorno",
      "Integração com o fluxo de trocas do seu e-commerce",
      "Menos atrito no pós-venda",
      "Visibilidade do que está voltando e por quê",
    ],
    steps: [
      { t: "Solicitação", d: "A devolução/troca entra no fluxo." },
      { t: "Coleta reversa", d: "Retiramos o item com o cliente final." },
      { t: "Trânsito monitorado", d: "Acompanhamento até o destino." },
      { t: "Retorno confirmado", d: "Evidência e baixa no sistema." },
    ],
    idealFor: ["E-commerce com política de troca", "Marcas de moda e calçados", "Assistências técnicas", "Operações com recall pontual"],
    ctaLabel: "Resolver minha logística reversa",
  },
  {
    slug: "vans",
    eyebrow: "Cargas maiores",
    title: "Utilitários e vans para volumes e transferências",
    intro:
      "Quando a moto não dá conta: cargas maiores, mudanças comerciais e transferências entre filiais com motorista treinado e o mesmo padrão de rastreamento das entregas menores.",
    image: U("1620677368158-32b948b4ba6c"),
    benefits: [
      "Veículos utilitários e vans para volumes maiores",
      "Transferências entre filiais e CDs",
      "Mudanças comerciais e cargas fracionadas",
      "Motorista treinado e comunicação direta",
      "Rastreamento e comprovação de entrega",
      "Agendamento conforme sua necessidade",
    ],
    steps: [
      { t: "Cotação", d: "Dimensionamos o veículo pelo volume e destino." },
      { t: "Agendamento", d: "Definimos data, coleta e entrega." },
      { t: "Transporte", d: "Carga monitorada em trânsito." },
      { t: "Entrega", d: "Comprovação e status final." },
    ],
    idealFor: ["Empresas com múltiplas filiais", "Atacado e distribuição", "Mudanças comerciais", "Cargas fracionadas maiores"],
    ctaLabel: "Cotar utilitário/van",
  },
  {
    slug: "sob-demanda",
    eyebrow: "Escala flexível",
    title: "Operação sob demanda para picos e projetos",
    intro:
      "Picos sazonais, lançamentos e eventos pedem estrutura que aparece na hora certa e some quando não precisa. Escalamos a operação conforme sua necessidade, sem você carregar custo fixo o ano inteiro.",
    image: U("1581094288338-2314dddb7ece"),
    benefits: [
      "Capacidade extra para datas de pico",
      "Estrutura montada para lançamentos e eventos",
      "Sem custo fixo fora do período de necessidade",
      "Mesma qualidade de rastreamento e evidência",
      "Planejamento conjunto antes do pico",
      "Retorno ao normal sem burocracia",
    ],
    steps: [
      { t: "Planejamento", d: "Mapeamos o pico e a capacidade necessária." },
      { t: "Preparação", d: "Alocamos veículos e equipe extra." },
      { t: "Execução", d: "Operação escalada com acompanhamento." },
      { t: "Desmobilização", d: "Voltamos ao ritmo normal sem atrito." },
    ],
    idealFor: ["E-commerce sazonal", "Lançamentos de produto", "Eventos e ativações", "Campanhas de datas comemorativas"],
    ctaLabel: "Planejar meu pico",
  },
];

export function getSolucao(slug: string): SolucaoContent | undefined {
  return SOLUCOES.find((s) => s.slug === slug);
}

export function allSolucaoSlugs(): string[] {
  return SOLUCOES.map((s) => s.slug);
}
