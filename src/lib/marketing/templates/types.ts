// Shared types for marketing template gallery

export type LandingBlock = {
  type: "hero" | "features" | "stats" | "testimonial" | "cta" | "form" | "faq" | "logos";
  config: Record<string, unknown>;
};

export type LandingTemplate = {
  slug: string;
  title: string;
  description: string;
  category: "farma" | "ecommerce" | "b2b" | "lead-magnet" | "captura-geral";
  cover_url: string;
  hero_image_url: string;
  preset: {
    title: string;
    description: string;
    hero_image_url: string;
    body_json: { blocks: LandingBlock[] };
    cta_label: string;
    cta_url: string;
    form_slug?: string;
    seo_title: string;
    seo_description: string;
  };
};

export type PopupTemplate = {
  slug: string;
  title: string;
  description: string;
  category: "exit-intent" | "scroll" | "time" | "page-visit";
  cover_url: string;
  preset: {
    name: string;
    title: string;
    body: string;
    cta_label: string;
    cta_url: string;
    cta_form_slug?: string;
    trigger_type: "time" | "scroll" | "exit_intent" | "page_visit";
    trigger_value: string;
    display_on_paths: string[];
  };
};

export type WhatsappTemplate = {
  slug: string;
  title: string;
  description: string;
  category: "geral" | "farma" | "comercial" | "suporte";
  cover_url: string;
  preset: {
    name: string;
    phone: string;
    default_message: string;
    position: "bottom_right" | "bottom_left";
    show_on_paths: string[];
  };
};

export type PushTemplate = {
  slug: string;
  title: string;
  description: string;
  category: "promo" | "conteudo" | "lembrete" | "anuncio";
  cover_url: string;
  preset: {
    title: string;
    body: string;
    icon_url?: string;
    url?: string;
  };
};

export type FormTemplateField = {
  field_key: string;
  type: "text" | "email" | "phone" | "textarea" | "select" | "radio" | "checkbox" | "number" | "date" | "url" | "hidden";
  label: string;
  placeholder?: string;
  required?: boolean;
  width?: "full" | "half" | "third";
  options?: Array<{ value: string; label: string }>;
  maps_to_lead?: string;
};

export type FormTemplate = {
  slug: string;
  title: string;
  description: string;
  category: "captura" | "cotacao" | "agenda" | "newsletter" | "feedback";
  cover_url: string;
  preset: {
    slug: string;
    title: string;
    description: string;
    submit_label: string;
    success_title: string;
    success_message: string;
    lead_source_detail: string;
    fields: FormTemplateField[];
  };
};

export type TemplateType = "landing" | "popup" | "whatsapp" | "push" | "form";

// Helper: build a Pollinations image URL
export function pollinationsCover(prompt: string, w = 600, h = 400): string {
  const encoded = encodeURIComponent(prompt);
  return `https://image.pollinations.ai/prompt/${encoded}?width=${w}&height=${h}&nologo=true&model=flux`;
}
