import { type LandingTemplate, pollinationsCover } from "./types";

const hero = (prompt: string) => pollinationsCover(prompt, 1200, 600);
const cover = (prompt: string) => pollinationsCover(prompt, 600, 400);

export const LANDING_TEMPLATES: LandingTemplate[] = [
  {
    slug: "garantia-de-seguranca-na-entrega-do-seu-medicamento",
    title: "Garantia de Segurança na Entrega do Medicamento",
    description: "AFE Anvisa + farmacêutico responsável + cadeia de frio. Hero com selo Anvisa, 3 features, FAQ sobre transporte de termolábeis.",
    category: "farma",
    cover_url: cover("photorealistic pharmaceutical delivery van Brazil temperature control professional"),
    hero_image_url: hero("photorealistic pharmaceutical delivery van with temperature control Brazil professional"),
    preset: {
      title: "Garantia de Segurança na Entrega do Seu Medicamento",
      description: "Spotlog: transportadora com AFE Anvisa, farmacêutico responsável e cadeia de frio validada. Seu medicamento entregue com segurança em São Paulo.",
      hero_image_url: hero("photorealistic pharmaceutical delivery van with temperature control Brazil professional"),
      body_json: {
        blocks: [
          {
            type: "hero",
            config: {
              headline: "Seu medicamento entregue com segurança total",
              subheadline: "AFE Anvisa, farmacêutico responsável e cadeia de frio validada",
              cta: "Solicitar cotação",
            },
          },
          {
            type: "features",
            config: {
              items: [
                { title: "AFE Anvisa", desc: "Autorização de Funcionamento pra Transporte de medicamentos" },
                { title: "Farmacêutico responsável", desc: "Acompanhamento técnico em todas as etapas" },
                { title: "Cadeia de frio", desc: "Veículos validados com termorregistro 2°C–8°C" },
              ],
            },
          },
          {
            type: "faq",
            config: {
              items: [
                { q: "Quais classes terapêuticas vocês transportam?", a: "Termolábeis, controlados (Portaria 344), oncológicos, vacinas e medicamentos sensíveis." },
                { q: "Como vocês monitoram a temperatura?", a: "Datalogger calibrado em cada veículo, com relatório enviado ao destinatário." },
                { q: "Qual a área de cobertura?", a: "São Paulo capital, Grande SP e principais cidades do interior, com expansão nacional sob demanda." },
              ],
            },
          },
          {
            type: "cta",
            config: {
              headline: "Pronto pra entregar com segurança?",
              button_label: "Falar com especialista",
            },
          },
        ],
      },
      cta_label: "Falar com especialista",
      cta_url: "/contato?utm_source=lp&utm_medium=organic&utm_campaign=farma-seguranca",
      form_slug: "solicitar-proposta",
      seo_title: "Garantia de Segurança na Entrega do Seu Medicamento | Spotlog",
      seo_description: "Transportadora AFE Anvisa em SP. Farmacêutico responsável, cadeia de frio validada. Solicite cotação.",
    },
  },
  {
    slug: "same-day-delivery-ecommerce",
    title: "Same Day Delivery pra E-commerce",
    description: "Entrega no mesmo dia pra e-commerces. Stats de SLA, NPS e depoimentos reais.",
    category: "ecommerce",
    cover_url: cover("ecommerce delivery courier motorcycle Sao Paulo Brazil same day fast urban photorealistic"),
    hero_image_url: hero("ecommerce delivery courier motorcycle Sao Paulo Brazil same day fast urban photorealistic"),
    preset: {
      title: "Same Day pra E-commerce: cliente recebe hoje",
      description: "Pedido até 12h, entrega até 18h. Integração com Shopify, VTEX, Nuvemshop e WhatsApp do cliente.",
      hero_image_url: hero("ecommerce delivery courier motorcycle Sao Paulo Brazil same day fast urban photorealistic"),
      body_json: {
        blocks: [
          {
            type: "hero",
            config: {
              headline: "Cliente do seu e-commerce recebe no mesmo dia",
              subheadline: "Pedido até 12h, entregue até 18h. Cobertura SP + Grande SP.",
              cta: "Quero ativar Same Day",
            },
          },
          {
            type: "stats",
            config: {
              items: [
                { value: "98,7%", label: "SLA cumprido no prazo" },
                { value: "+72", label: "NPS médio dos clientes finais" },
                { value: "+340", label: "Lojas integradas" },
              ],
            },
          },
          {
            type: "testimonial",
            config: {
              quote: "Aumentamos a recompra em 28% no primeiro mês com Same Day. Cliente fideliza quando recebe no dia.",
              author: "Marina Costa",
              role: "Head de Operações, Loja Skin Beauty",
            },
          },
          {
            type: "cta",
            config: {
              headline: "Vamos integrar sua loja em 24h",
              button_label: "Falar com vendas",
            },
          },
        ],
      },
      cta_label: "Quero ativar Same Day",
      cta_url: "/contato?utm_campaign=sameday",
      form_slug: "solicitar-proposta",
      seo_title: "Same Day Delivery pra E-commerce em SP | Spotlog",
      seo_description: "Entrega no mesmo dia em São Paulo pra e-commerce. SLA 98,7%, integração Shopify, VTEX, Nuvemshop.",
    },
  },
  {
    slug: "logistica-reversa-ecommerce",
    title: "Logística Reversa Simplificada",
    description: "Reversa em 3 passos pra e-commerce: solicitação, coleta, devolução no CD.",
    category: "ecommerce",
    cover_url: cover("ecommerce return package logistics warehouse Brazil photorealistic"),
    hero_image_url: hero("ecommerce return package logistics warehouse Brazil photorealistic"),
    preset: {
      title: "Logística Reversa que o seu cliente ama",
      description: "Cliente solicita pelo WhatsApp, motorista coleta em até 48h, devolução no CD com rastreio em tempo real.",
      hero_image_url: hero("ecommerce return package logistics warehouse Brazil photorealistic"),
      body_json: {
        blocks: [
          {
            type: "hero",
            config: {
              headline: "Reversa em 3 passos. Sem dor de cabeça.",
              subheadline: "Cliente solicita, Spotlog coleta, você recebe no CD.",
              cta: "Solicitar orçamento",
            },
          },
          {
            type: "features",
            config: {
              items: [
                { title: "1. Solicitação", desc: "Cliente final pede coleta pelo link no e-mail ou WhatsApp" },
                { title: "2. Coleta agendada", desc: "Motorista coleta em até 48h, com janela escolhida pelo cliente" },
                { title: "3. Devolução no CD", desc: "Produto chega no seu CD com nota fiscal e rastreio completo" },
              ],
            },
          },
          {
            type: "cta",
            config: {
              headline: "Reduza CAC retendo quem devolve",
              button_label: "Solicitar orçamento de reversa",
            },
          },
        ],
      },
      cta_label: "Solicitar orçamento",
      cta_url: "/contato?utm_campaign=reversa",
      form_slug: "solicitar-proposta",
      seo_title: "Logística Reversa pra E-commerce | Spotlog",
      seo_description: "Logística reversa em 3 passos: cliente solicita, Spotlog coleta, você recebe no CD com rastreio.",
    },
  },
  {
    slug: "rotas-dedicadas-b2b",
    title: "Rotas Dedicadas B2B",
    description: "Moto/van fixa pra empresas B2B com volume diário. Pricing transparente.",
    category: "b2b",
    cover_url: cover("dedicated delivery van B2B corporate logistics Brazil photorealistic"),
    hero_image_url: hero("dedicated delivery van B2B corporate logistics Brazil professional"),
    preset: {
      title: "Rotas Dedicadas: motorista fixo, preço fechado",
      description: "Pra empresas com volume diário acima de 30 entregas. Moto ou van dedicada, motorista treinado, preço mensal fechado.",
      hero_image_url: hero("dedicated delivery van B2B corporate logistics Brazil professional"),
      body_json: {
        blocks: [
          {
            type: "hero",
            config: {
              headline: "Motorista fixo. Preço fechado. Sem surpresa.",
              subheadline: "Rota dedicada pra empresas com 30+ entregas/dia em SP.",
              cta: "Ver planos",
            },
          },
          {
            type: "features",
            config: {
              items: [
                { title: "Plano Moto Fixa", desc: "R$ 4.200/mês — até 80 entregas/dia, motoboy uniformizado" },
                { title: "Plano Van Fixa", desc: "R$ 11.800/mês — até 150 entregas/dia, ajudante incluso" },
                { title: "Plano Misto", desc: "Sob medida — combine moto e van conforme volume" },
              ],
            },
          },
          {
            type: "stats",
            config: {
              items: [
                { value: "30%", label: "Economia média vs. avulso" },
                { value: "100%", label: "Disponibilidade contratada" },
                { value: "24h", label: "Setup da operação" },
              ],
            },
          },
          {
            type: "cta",
            config: {
              headline: "Quanto sua operação economiza com rota dedicada?",
              button_label: "Quero a cotação",
            },
          },
        ],
      },
      cta_label: "Ver planos B2B",
      cta_url: "/contato?utm_campaign=dedicada",
      form_slug: "solicitar-proposta",
      seo_title: "Rotas Dedicadas B2B em SP | Spotlog",
      seo_description: "Moto ou van dedicada pra B2B em São Paulo. Preço mensal fechado, motorista fixo, 30% mais barato que avulso.",
    },
  },
  {
    slug: "ebook-logistica-farmaceutica",
    title: "Ebook Logística Farmacêutica",
    description: "Lead magnet — ebook gratuito sobre transporte farmacêutico Anvisa.",
    category: "lead-magnet",
    cover_url: cover("ebook cover pharmaceutical logistics Brazil professional minimal navy red"),
    hero_image_url: hero("open ebook cover pharmaceutical logistics Brazil professional minimal navy red gradient"),
    preset: {
      title: "Ebook: Guia Completo de Logística Farmacêutica",
      description: "47 páginas sobre AFE Anvisa, cadeia de frio, Portaria 344 e melhores práticas. Baixe grátis.",
      hero_image_url: hero("open ebook cover pharmaceutical logistics Brazil professional minimal navy red gradient"),
      body_json: {
        blocks: [
          {
            type: "hero",
            config: {
              headline: "Guia Completo: Logística Farmacêutica no Brasil",
              subheadline: "Ebook gratuito de 47 páginas. AFE, Anvisa, Portaria 344 e mais.",
              cta: "Baixar ebook agora",
            },
          },
          {
            type: "features",
            config: {
              items: [
                { title: "Como obter AFE Anvisa", desc: "Checklist passo a passo pra autorização de transporte" },
                { title: "Cadeia de frio na prática", desc: "Validação de veículos, dataloggers, SLA térmico" },
                { title: "Portaria 344 explicada", desc: "Transporte de controlados sem dor de cabeça" },
              ],
            },
          },
          {
            type: "form",
            config: { headline: "Pra onde mandamos o ebook?" },
          },
        ],
      },
      cta_label: "Baixar ebook grátis",
      cta_url: "/contato?utm_campaign=ebook-farma",
      form_slug: "baixar-ebook",
      seo_title: "Ebook Grátis: Guia de Logística Farmacêutica | Spotlog",
      seo_description: "Baixe grátis o guia completo de logística farmacêutica: AFE Anvisa, cadeia de frio, Portaria 344.",
    },
  },
  {
    slug: "checklist-conformidade-anvisa",
    title: "Checklist Conformidade Anvisa",
    description: "Lead magnet — checklist gratuito de auditoria Anvisa pra transportadoras.",
    category: "lead-magnet",
    cover_url: cover("clipboard checklist Anvisa compliance pharmaceutical Brazil professional"),
    hero_image_url: hero("clipboard checklist Anvisa compliance pharmaceutical Brazil professional clean"),
    preset: {
      title: "Checklist Anvisa: sua transportadora está pronta?",
      description: "Checklist com 38 itens da RDC 304/2019. Use pra auditoria interna antes da fiscalização.",
      hero_image_url: hero("clipboard checklist Anvisa compliance pharmaceutical Brazil professional clean"),
      body_json: {
        blocks: [
          {
            type: "hero",
            config: {
              headline: "Está pronto pra fiscalização da Anvisa?",
              subheadline: "Checklist com 38 itens da RDC 304/2019 — gratuito.",
              cta: "Quero o checklist",
            },
          },
          {
            type: "features",
            config: {
              items: [
                { title: "38 itens auditáveis", desc: "Todos os pontos cobrados em fiscalização" },
                { title: "Modelo editável", desc: "PDF + planilha Excel pra você usar no dia a dia" },
                { title: "Baseado em RDC 304/2019", desc: "Atualizado com a última revisão da norma" },
              ],
            },
          },
          {
            type: "form",
            config: { headline: "Onde enviamos o checklist?" },
          },
        ],
      },
      cta_label: "Baixar checklist",
      cta_url: "/contato?utm_campaign=checklist-anvisa",
      form_slug: "baixar-ebook",
      seo_title: "Checklist Conformidade Anvisa RDC 304 Grátis | Spotlog",
      seo_description: "Baixe o checklist gratuito com 38 itens da RDC 304/2019. Auditoria Anvisa sem surpresa.",
    },
  },
  {
    slug: "webinar-gestao-frota",
    title: "Webinar Gestão de Frota",
    description: "Inscrição em webinar ao vivo sobre redução de custo de frota.",
    category: "captura-geral",
    cover_url: cover("webinar online presentation logistics fleet management professional"),
    hero_image_url: hero("webinar online presentation logistics fleet management professional Brazil"),
    preset: {
      title: "Webinar: Como reduzir 23% do custo de frota em 90 dias",
      description: "Ao vivo, com Adriano Rosa (CEO Spotlog). Quinta-feira, 19h. Inscrições limitadas.",
      hero_image_url: hero("webinar online presentation logistics fleet management professional Brazil"),
      body_json: {
        blocks: [
          {
            type: "hero",
            config: {
              headline: "Reduza 23% do custo da sua frota em 90 dias",
              subheadline: "Webinar ao vivo. Quinta, 19h. Grátis.",
              cta: "Garantir vaga",
            },
          },
          {
            type: "features",
            config: {
              items: [
                { title: "Agenda do webinar", desc: "19h00 — Diagnóstico de custos · 19h20 — 3 alavancas · 19h50 — Q&A" },
                { title: "Quem apresenta", desc: "Adriano Rosa, CEO Spotlog. 12 anos em logística B2B." },
                { title: "Pra quem é", desc: "Gestores logísticos com frota acima de 10 veículos" },
              ],
            },
          },
          {
            type: "form",
            config: { headline: "Inscreva-se agora" },
          },
        ],
      },
      cta_label: "Garantir minha vaga",
      cta_url: "/contato?utm_campaign=webinar-frota",
      form_slug: "agendar-demo",
      seo_title: "Webinar: Reduza 23% do Custo de Frota | Spotlog",
      seo_description: "Inscreva-se grátis. Quinta 19h. Diagnóstico de custo de frota + 3 alavancas + Q&A com CEO Spotlog.",
    },
  },
  {
    slug: "spotlog-vs-correios",
    title: "Spotlog vs. Correios",
    description: "Comparativo direto Spotlog vs. Correios pra última milha B2C.",
    category: "captura-geral",
    cover_url: cover("comparison chart delivery vs courier Brazil minimal modern"),
    hero_image_url: hero("comparison chart delivery service Brazil last mile professional modern"),
    preset: {
      title: "Spotlog vs. Correios: qual entrega mais rápido em SP?",
      description: "Comparativo de SLA, custo, rastreabilidade e atendimento. Veja por que e-commerces estão migrando.",
      hero_image_url: hero("comparison chart delivery service Brazil last mile professional modern"),
      body_json: {
        blocks: [
          {
            type: "hero",
            config: {
              headline: "Spotlog ou Correios? O comparativo honesto",
              subheadline: "SLA, custo, rastreabilidade e atendimento lado a lado.",
              cta: "Quero cotação Spotlog",
            },
          },
          {
            type: "features",
            config: {
              items: [
                { title: "SLA na Grande SP", desc: "Spotlog 98,7% no prazo · Correios 78,4%" },
                { title: "Tempo médio", desc: "Spotlog same-day · Correios 3–5 dias" },
                { title: "Rastreio em tempo real", desc: "Spotlog GPS ao vivo · Correios eventos pontuais" },
                { title: "Atendimento", desc: "Spotlog WhatsApp 24/7 · Correios 0800 horário comercial" },
              ],
            },
          },
          {
            type: "stats",
            config: {
              items: [
                { value: "21%", label: "Mais barato em média" },
                { value: "5x", label: "Mais rápido na Grande SP" },
                { value: "98,7%", label: "SLA cumprido" },
              ],
            },
          },
          {
            type: "cta",
            config: {
              headline: "Pronto pra trocar?",
              button_label: "Quero cotação Spotlog",
            },
          },
        ],
      },
      cta_label: "Solicitar cotação",
      cta_url: "/contato?utm_campaign=vs-correios",
      form_slug: "solicitar-proposta",
      seo_title: "Spotlog vs. Correios: Comparativo em SP | Spotlog",
      seo_description: "Compare SLA, custo, rastreio e atendimento. Spotlog vs. Correios na Grande SP. Solicite cotação.",
    },
  },
];

export function findLandingTemplate(slug: string): LandingTemplate | undefined {
  return LANDING_TEMPLATES.find((t) => t.slug === slug);
}
