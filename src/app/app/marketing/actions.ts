"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

type Kind =
  | "landing"
  | "popup"
  | "wabutton"
  | "push"
  | "social"
  | "ads"
  | "audience"
  | "seo"
  | "bio";

const KIND_TABLE: Record<Kind, string> = {
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

export async function deleteMarketingItem(kind: Kind, id: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const table = KIND_TABLE[kind];
  if (!table) throw new Error("Tipo inválido");
  const { error } = await supabase
    .from(table)
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/marketing/${kind === "landing" ? "converter/landing" : ""}`);
}

// ===== Landing =====

export async function createLanding(input: {
  title: string;
  slug?: string;
  description?: string;
  cta_label?: string;
  cta_url?: string;
  form_slug?: string;
  hero_image_url?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error("Slug inválido");
  const { data, error } = await supabase
    .from("landing_pages")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .insert({
      organization_id: ctx.org.id,
      slug,
      title: input.title,
      description: input.description ?? null,
      cta_label: input.cta_label ?? "Quero saber mais",
      cta_url: input.cta_url ?? null,
      form_slug: input.form_slug ?? null,
      hero_image_url: input.hero_image_url ?? null,
      status: "rascunho",
    } as never)
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const id = (data as { id: string }).id;
  revalidatePath("/app/marketing/converter/landing");
  redirect(`/app/marketing/converter/landing/${id}`);
}

export async function updateLanding(
  id: string,
  patch: Record<string, unknown>,
) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("landing_pages")
    .update(patch as never)
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/converter/landing");
  revalidatePath(`/app/marketing/converter/landing/${id}`);
}

// ===== Pop-up =====
export async function createPopup(input: {
  name: string;
  title: string;
  body?: string;
  cta_label?: string;
  cta_url?: string;
  cta_form_slug?: string;
  trigger_type?: "time" | "scroll" | "exit_intent" | "page_visit";
  trigger_value?: string;
  display_on_paths?: string[];
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("popups").insert({
    organization_id: ctx.org.id,
    ...input,
    display_on_paths: input.display_on_paths ?? ["/"],
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/converter/popups");
}

// ===== WhatsApp button =====
export async function createWaButton(input: {
  name: string;
  phone: string;
  default_message?: string;
  position?: "bottom_right" | "bottom_left";
  show_on_paths?: string[];
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_buttons").insert({
    organization_id: ctx.org.id,
    ...input,
    show_on_paths: input.show_on_paths ?? ["/"],
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/converter/whatsapp");
}

// ===== Social =====
export async function createSocialPost(input: {
  network: "instagram" | "facebook" | "linkedin" | "twitter" | "tiktok";
  caption: string;
  media_url?: string;
  scheduled_for?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const status = input.scheduled_for ? "agendado" : "rascunho";
  const { error } = await supabase
    .from("social_posts")
    .insert({ organization_id: ctx.org.id, ...input, status } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/atrair/social");
}

// ===== Ads =====
export async function createAdCampaign(input: {
  platform: "meta" | "google" | "linkedin" | "tiktok";
  name: string;
  objective?: string;
  daily_budget?: string;
  form_slug?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const payload = {
    organization_id: ctx.org.id,
    ...input,
    daily_budget: input.daily_budget ? Number(input.daily_budget) : null,
  };
  const { error } = await supabase.from("ad_campaigns").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/atrair/ads");
}

// ===== Audience =====
export async function createAudience(input: {
  name: string;
  description?: string;
  type?: "custom" | "lookalike" | "retargeting";
  size_estimate?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const payload = {
    organization_id: ctx.org.id,
    ...input,
    size_estimate: input.size_estimate ? Number(input.size_estimate) : null,
  };
  const { error } = await supabase.from("audiences").insert(payload as never);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/atrair/publicos");
}

// ===== SEO =====
export async function upsertSeoPage(input: {
  path: string;
  title?: string;
  meta_description?: string;
  keywords?: string[];
  last_audit_score?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const payload = {
    organization_id: ctx.org.id,
    ...input,
    last_audit_score: input.last_audit_score
      ? Number(input.last_audit_score)
      : null,
  };
  const { error } = await supabase
    .from("seo_pages")
    .upsert(payload as never, { onConflict: "organization_id,path" });
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/atrair/seo");
}

// ===== Push =====
export async function createPushCampaign(input: {
  title: string;
  body: string;
  icon_url?: string;
  url?: string;
  scheduled_for?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("web_push_campaigns")
    .insert({ organization_id: ctx.org.id, ...input } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/converter/push");
}

// ===== Bio =====
export async function createBio(input: {
  slug: string;
  title: string;
  bio?: string;
  avatar_url?: string;
  theme?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("link_in_bio").insert({
    organization_id: ctx.org.id,
    ...input,
    slug: slugify(input.slug || input.title),
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/atrair/link-bio");
}

export async function addBioLink(
  bio_id: string,
  label: string,
  url: string,
  icon?: string,
) {
  await requireSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("link_in_bio_links").insert({
    bio_id,
    label,
    url,
    icon: icon ?? null,
    sort: 0,
    active: true,
  } as never);
  if (error) throw new Error(error.message);
  revalidatePath("/app/marketing/atrair/link-bio");
}
