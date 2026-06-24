import { type WhatsappTemplate, pollinationsCover } from "./types";

const cover = (p: string) => pollinationsCover(p, 600, 400);

export const WHATSAPP_TEMPLATES: WhatsappTemplate[] = [
  {
    slug: "atendimento-geral",
    title: "Atendimento Geral",
    description: "Botão padrão pra todas as páginas. Mensagem genérica de boas-vindas.",
    category: "geral",
    cover_url: cover("WhatsApp floating button website general greeting professional"),
    preset: {
      name: "WhatsApp Atendimento Geral",
      phone: "5511999990000",
      default_message: "Olá! Vim pelo site da Spotlog e gostaria de mais informações.",
      position: "bottom_right",
      show_on_paths: ["/"],
    },
  },
  {
    slug: "farma-especialista",
    title: "Farma — Especialista",
    description: "Botão exclusivo da página /farma. Encaminha pro especialista farmacêutico.",
    category: "farma",
    cover_url: cover("WhatsApp button pharmaceutical specialist medical professional"),
    preset: {
      name: "WhatsApp Especialista Farma",
      phone: "5511999990001",
      default_message: "Olá! Quero falar com o especialista de transporte farmacêutico da Spotlog.",
      position: "bottom_right",
      show_on_paths: ["/farma", "/farma/*"],
    },
  },
  {
    slug: "cotacao-rapida",
    title: "Cotação Rápida",
    description: "Botão em páginas comerciais com promessa de cotação em 24h.",
    category: "comercial",
    cover_url: cover("WhatsApp button quote sales commercial fast Brazil"),
    preset: {
      name: "WhatsApp Cotação 24h",
      phone: "5511999990002",
      default_message: "Olá! Quero cotação em 24h. Volume estimado: ___ entregas/mês.",
      position: "bottom_right",
      show_on_paths: ["/precos", "/contato", "/ecommerce"],
    },
  },
  {
    slug: "emergencia-24h",
    title: "Emergência 24h",
    description: "Botão de SAC pra emergências logísticas 24/7.",
    category: "suporte",
    cover_url: cover("WhatsApp emergency 24h support logistics urgent professional"),
    preset: {
      name: "WhatsApp Emergência 24h",
      phone: "5511999990003",
      default_message: "URGENTE: preciso de coleta/entrega emergencial agora. Detalhes: ___",
      position: "bottom_left",
      show_on_paths: ["/app/cliente", "/rastreamento", "/rastrear"],
    },
  },
];

export function findWhatsappTemplate(slug: string): WhatsappTemplate | undefined {
  return WHATSAPP_TEMPLATES.find((t) => t.slug === slug);
}
