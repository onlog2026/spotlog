import { createAdminClient } from "@/lib/supabase/admin";

export type MarketingKind =
  | "landing"
  | "popup"
  | "wabutton"
  | "push"
  | "social"
  | "ads"
  | "audience"
  | "seo"
  | "bio";

/**
 * Mapa de kind → tabela real no Supabase.
 */
const KIND_TABLE: Record<MarketingKind, string> = {
  landing: "landing_pages",
  popup: "popups",
  wabutton: "whatsapp_buttons",
  push: "web_push_campaigns",
  social: "social_posts",
  ads: "ad_campaigns",
  audience: "audiences",
  seo: "seo_pages",
  bio: "link_in_bio",
};

/**
 * Lista entidades de marketing direto da tabela (RPC `mkt_list` foi removida).
 */
export async function listMarketing<T = Record<string, unknown>>(
  orgId: string,
  kind: MarketingKind,
): Promise<T[]> {
  const supabase = createAdminClient();
  const table = KIND_TABLE[kind];
  if (!table) return [];
  const { data, error } = await supabase
    .from(table)
    .select("*")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[marketing] list error", kind, table, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export type LandingPage = {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  description: string | null;
  hero_image_url: string | null;
  body_json: Record<string, unknown>;
  cta_label: string | null;
  cta_url: string | null;
  form_slug: string | null;
  status: "rascunho" | "publicado" | "arquivado";
  published_at: string | null;
  views: number;
  conversions: number;
  seo_title: string | null;
  seo_description: string | null;
  created_at: string;
  updated_at: string;
};

export type Popup = {
  id: string;
  organization_id: string;
  name: string;
  trigger_type: "time" | "scroll" | "exit_intent" | "page_visit";
  trigger_value: string | null;
  title: string;
  body: string | null;
  cta_label: string | null;
  cta_url: string | null;
  cta_form_slug: string | null;
  image_url: string | null;
  display_on_paths: string[];
  hide_after_close_hours: number;
  active: boolean;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
};

export type WhatsappButton = {
  id: string;
  organization_id: string;
  name: string;
  phone: string;
  default_message: string;
  position: "bottom_right" | "bottom_left";
  color: string;
  show_on_paths: string[];
  active: boolean;
  clicks: number;
  created_at: string;
};

export type SocialPost = {
  id: string;
  organization_id: string;
  network: "instagram" | "facebook" | "linkedin" | "twitter" | "tiktok";
  caption: string;
  media_url: string | null;
  scheduled_for: string | null;
  posted_at: string | null;
  status: "rascunho" | "agendado" | "publicado" | "falhou";
  created_at: string;
};

export type AdCampaign = {
  id: string;
  organization_id: string;
  platform: "meta" | "google" | "linkedin" | "tiktok";
  name: string;
  objective: string;
  daily_budget: number | null;
  form_slug: string | null;
  status: "rascunho" | "ativa" | "pausada" | "encerrada";
  leads_count: number;
  spent: number;
  created_at: string;
};

export type Audience = {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  type: "custom" | "lookalike" | "retargeting";
  filters_json: Record<string, unknown>;
  size_estimate: number | null;
  created_at: string;
};

export type SeoPage = {
  id: string;
  organization_id: string;
  path: string;
  title: string | null;
  meta_description: string | null;
  keywords: string[];
  last_audit_score: number | null;
  last_audit_at: string | null;
  created_at: string;
};

export type LinkInBio = {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  bio: string | null;
  avatar_url: string | null;
  theme: string;
  active: boolean;
  clicks: number;
  created_at: string;
};

export type WebPushCampaign = {
  id: string;
  organization_id: string;
  title: string;
  body: string;
  icon_url: string | null;
  url: string | null;
  scheduled_for: string | null;
  sent_at: string | null;
  sent_count: number;
  click_count: number;
  created_at: string;
};
