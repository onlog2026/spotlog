import { type PushTemplate, pollinationsCover } from "./types";

const cover = (p: string) => pollinationsCover(p, 600, 400);
const icon = (p: string) => pollinationsCover(p, 192, 192);

export const PUSH_TEMPLATES: PushTemplate[] = [
  {
    slug: "promo-black-friday",
    title: "Promo Black Friday",
    description: "Push promocional pra campanha sazonal de Black Friday.",
    category: "promo",
    cover_url: cover("black friday promotion notification mobile dark Brazil professional"),
    preset: {
      title: "🎉 Black Friday Spotlog",
      body: "30% off na primeira coleta. Cota agora — só hoje.",
      icon_url: icon("black friday logistics promo logo flat"),
      url: "/precos?utm_campaign=push-bf",
    },
  },
  {
    slug: "novo-blog-post",
    title: "Novo Post no Blog",
    description: "Aviso de novo artigo publicado no blog Spotlog.",
    category: "conteudo",
    cover_url: cover("blog notification new post article logistics professional"),
    preset: {
      title: "Novo no blog Spotlog",
      body: "5 alavancas pra reduzir custo de última milha em 2026.",
      icon_url: icon("Spotlog logo navy red minimal"),
      url: "/blog?utm_campaign=push-novo-post",
    },
  },
  {
    slug: "anvisa-renovacao",
    title: "Renovação AFE Anvisa",
    description: "Lembrete pra farmácias renovarem AFE com oferta especial.",
    category: "anuncio",
    cover_url: cover("Anvisa renewal pharmaceutical notification reminder Brazil"),
    preset: {
      title: "Renovação AFE: oferta Spotlog",
      body: "Migra pra Spotlog na renovação da sua AFE e economize 18%. Fale com a gente.",
      icon_url: icon("Anvisa seal pharmaceutical professional flat"),
      url: "/farma?utm_campaign=push-afe-renew",
    },
  },
  {
    slug: "webinar-amanha",
    title: "Lembrete Webinar Amanhã",
    description: "Lembrete pra inscritos no webinar 24h antes.",
    category: "lembrete",
    cover_url: cover("webinar reminder notification calendar tomorrow professional"),
    preset: {
      title: "Webinar amanhã às 19h",
      body: "Reduza 23% do custo de frota em 90 dias. Garanta sua vaga.",
      icon_url: icon("webinar calendar reminder logo flat"),
      url: "/eventos?utm_campaign=push-webinar",
    },
  },
];

export function findPushTemplate(slug: string): PushTemplate | undefined {
  return PUSH_TEMPLATES.find((t) => t.slug === slug);
}
