import "server-only";

/**
 * Base de conhecimento ESTÁTICA do chatbot Spotlog.
 * Usada como fallback quando o banco está indisponível.
 */

export type KBStaticEntry = {
  category: "produto" | "servico" | "politica" | "faq" | "contato" | "outro";
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
};

export const STATIC_KB: KBStaticEntry[] = [
  {
    category: "produto",
    question: "O que é a Spotlog?",
    answer:
      "A Spotlog é uma transportadora de logística inteligente que opera em São Paulo e Grande SP. Oferecemos entregas para e-commerce, farma, manipulação, correlatos, dermocosméticos e B2B com rastreabilidade ponta a ponta. Nosso slogan: \"Nós entregamos realizações.\"",
    keywords: ["o que é", "sobre", "empresa", "quem é", "spotlog"],
    priority: 100,
  },
  {
    category: "servico",
    question: "Quais serviços vocês oferecem?",
    answer:
      "Oferecemos: 1) Same Day Delivery (entrega no mesmo dia), 2) Moto Fixa (motoboy dedicado), 3) E-commerce Express, 4) Soluções Personalizadas (etiquetagem, fracionamento, etc), 5) Express Pharma (transporte farmacêutico com AFE Anvisa).",
    keywords: ["serviços", "soluções", "o que fazem", "tipos de entrega", "modalidades"],
    priority: 90,
  },
  {
    category: "produto",
    question: "Vocês têm AFE da Anvisa?",
    answer:
      "Sim! A Spotlog possui AFE (Autorização de Funcionamento para Transporte) da Anvisa. Isso garante que cumprimos todos os requisitos para transportar medicamentos, termolábeis e correlatos. Temos farmacêutico responsável acompanhando todo o processo.",
    keywords: ["anvisa", "afe", "medicamento", "farmacia", "termolabel", "licença", "farmacêutico"],
    priority: 100,
  },
  {
    category: "produto",
    question: "Vocês transportam medicamentos termolábeis?",
    answer:
      "Sim. Possuímos AFE da Anvisa e infraestrutura para transporte de termolábeis com controle de temperatura adequado, veículos validados e farmacêutico responsável.",
    keywords: ["termolabel", "refrigerado", "vacina", "medicamento gelado", "cadeia de frio"],
    priority: 90,
  },
  {
    category: "servico",
    question: "Onde vocês atuam?",
    answer:
      "Atuamos em todo o estado de São Paulo e região metropolitana (Grande SP). Para outras regiões, consulte nosso comercial.",
    keywords: ["onde", "região", "cobertura", "atendem", "cidade", "área", "sp"],
    priority: 80,
  },
  {
    category: "servico",
    question: "Como funciona o Same Day Delivery?",
    answer:
      "Same Day Delivery é a entrega feita no mesmo dia da compra. Ideal pra e-commerces que querem encantar o cliente com agilidade.",
    keywords: ["same day", "mesmo dia", "express", "rápido", "hoje"],
    priority: 80,
  },
  {
    category: "faq",
    question: "Como rastrear minha entrega?",
    answer:
      "Acesse nosso rastreamento público em https://octatracking.com.br/prerastreio ou clique no botão \"Acompanhe seu pedido\" no topo do site. Você só precisa do código da remessa.",
    keywords: ["rastrear", "rastreamento", "onde está", "localizar pedido", "status", "código"],
    priority: 95,
  },
  {
    category: "faq",
    question: "Como solicitar uma cotação?",
    answer:
      "Você pode: 1) Falar com nosso comercial pelo WhatsApp (11) 91479-1442, 2) E-mail comercial@spotlogoficial.com.br, ou 3) Preencher o formulário em /contato. Retornamos em até 1 dia útil.",
    keywords: ["cotação", "preço", "orçamento", "valor", "quanto custa", "contratar", "comercial"],
    priority: 95,
  },
  {
    category: "contato",
    question: "Como entro em contato?",
    answer:
      "Telefone/WhatsApp: (11) 91479-1442. E-mails: contato@spotlogoficial.com.br (geral), comercial@spotlogoficial.com.br (vendas), sac@spotlogoficial.com.br (suporte). Instagram: @spotlogoficial.",
    keywords: ["contato", "telefone", "whatsapp", "email", "falar", "atendimento", "fone"],
    priority: 95,
  },
  {
    category: "produto",
    question: "Vocês atendem e-commerce?",
    answer:
      "Sim! Temos serviço E-commerce Express com integração via API, etiquetagem, fracionamento, rastreabilidade e Same Day Delivery. Ideal pra lojistas que querem ganhar conversão e reputação.",
    keywords: ["ecommerce", "e-commerce", "loja online", "marketplace", "vtex", "shopify"],
    priority: 90,
  },
  {
    category: "faq",
    question: "Quanto tempo leva uma entrega?",
    answer:
      "Depende da modalidade: Same Day (mesmo dia), Express (até 24h), Standard (1-3 dias úteis). Pra rotas dedicadas (Moto Fixa) é imediato dentro da janela contratada.",
    keywords: ["tempo", "prazo", "quanto demora", "quando chega", "horas", "dias"],
    priority: 85,
  },
  {
    category: "politica",
    question: "Como vocês tratam meus dados? (LGPD)",
    answer:
      "Levamos LGPD a sério. Coletamos só o necessário (nome, contato, dados de remessa), usamos base legal de execução de contrato/interesse legítimo, e você pode pedir exclusão a qualquer momento via sac@spotlogoficial.com.br. Veja nossa Política de Privacidade.",
    keywords: ["lgpd", "privacidade", "dados", "dados pessoais", "política"],
    priority: 70,
  },
  {
    category: "servico",
    question: "Vocês têm motoboy fixo?",
    answer:
      "Sim — serviço \"Moto Fixa\": entregador disponível diariamente em período integral (segunda a sexta), com horários e dias adicionais a combinar conforme sua necessidade.",
    keywords: ["motoboy", "motoboy fixo", "exclusivo", "dedicado", "diário"],
    priority: 80,
  },
  {
    category: "servico",
    question: "Fazem coleta no meu CD/loja?",
    answer:
      "Sim, coletamos diretamente no seu CD, loja, distribuidor ou farmácia. Agende pelo painel ou pelo comercial.",
    keywords: ["coleta", "retirada", "buscar", "pegar", "agendar"],
    priority: 80,
  },
  {
    category: "faq",
    question: "Como abrir um chamado de ocorrência?",
    answer:
      "Pelo SAC: sac@spotlogoficial.com.br ou pelo WhatsApp (11) 91479-1442. Se você é cliente Spotlog, abra direto pelo painel em /app/cliente/chamados.",
    keywords: ["ocorrência", "reclamação", "problema", "dano", "extravio", "chamado", "ticket", "sac"],
    priority: 85,
  },
];

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

export function searchStaticKB(query: string, limit = 5): KBStaticEntry[] {
  const q = normalize(query);
  if (!q) return [];

  const scored = STATIC_KB.map((entry) => {
    let score = 0;
    // Keywords match (peso 4)
    for (const kw of entry.keywords) {
      if (q.includes(normalize(kw))) score += 4;
    }
    // Question contém termo
    const questionNorm = normalize(entry.question);
    const qWords = q.split(/\s+/).filter((w) => w.length >= 3);
    for (const w of qWords) {
      if (questionNorm.includes(w)) score += 3;
    }
    // Answer contém termo
    const answerNorm = normalize(entry.answer);
    for (const w of qWords) {
      if (answerNorm.includes(w)) score += 1;
    }
    return { entry, score: score + entry.priority * 0.01 };
  })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored.map((s) => s.entry);
}
