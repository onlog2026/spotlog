"use server";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const cardSchema = z.object({
  page: z.string().min(1).max(60),
  section: z.string().min(1).max(60),
  slot: z.string().min(1).max(60),
  title: z.string().max(2000).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  image_url: z.string().max(800).nullable().optional(),
  cta_label: z.string().max(80).nullable().optional(),
  cta_url: z.string().max(400).nullable().optional(),
  active: z.boolean().default(true),
  sort: z.coerce.number().int().default(0),
});

function fdToCard(fd: FormData) {
  const base = cardSchema.parse({
    page: String(fd.get("page") ?? ""),
    section: String(fd.get("section") ?? ""),
    slot: String(fd.get("slot") ?? ""),
    title: (fd.get("title") as string) || null,
    description: (fd.get("description") as string) || null,
    image_url: (fd.get("image_url") as string) || null,
    cta_label: (fd.get("cta_label") as string) || null,
    cta_url: (fd.get("cta_url") as string) || null,
    active: fd.get("active") === "on" || fd.get("active") === "true",
    sort: fd.get("sort") ?? 0,
  });
  const imageUrlMobile = (fd.get("image_url_mobile") as string) || null;

  // Tipografia: só inclui o que foi preenchido (vazio = mantém padrão do design).
  const style: Record<string, unknown> = {};
  const sStr = (k: string) => {
    const v = (fd.get(k) as string)?.trim();
    return v ? v : undefined;
  };
  const sNum = (k: string) => {
    const v = (fd.get(k) as string)?.trim();
    const n = v ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const sBool = (k: string) => fd.get(k) === "on" || fd.get(k) === "true";
  for (const t of ["title", "desc"] as const) {
    const color = sStr(`style_${t}Color`);
    const size = sNum(`style_${t}Size`);
    const weight = sStr(`style_${t}Weight`);
    const font = sStr(`style_${t}Font`);
    const align = sStr(`style_${t}Align`);
    const italic = sBool(`style_${t}Italic`);
    if (color) style[`${t}Color`] = color;
    if (size) style[`${t}Size`] = size;
    if (weight) style[`${t}Weight`] = weight;
    if (font) style[`${t}Font`] = font;
    if (align) style[`${t}Align`] = align;
    if (italic) style[`${t}Italic`] = true;
  }

  return { base, imageUrlMobile, style };
}

function revalidatePublic(_page?: string) {
  // SINCRONIZAÇÃO TOTAL: um card pode ser exibido em várias páginas (home,
  // páginas de produto, institucionais). Revalidar o layout RAIZ invalida TODAS
  // as rotas do site de uma vez — então excluir/incluir/editar/ativar um card
  // reflete na hora em TODA página que o mostra, não só na home.
  revalidatePath("/", "layout");
  // Cobre também os fetch() com cache taggeado (/[slug], /solucoes/[slug]).
  revalidateTag("site-cards");
}

export async function criarCard(fd: FormData) {
  await requireSession();
  const supabase = await createClient();
  const { base, imageUrlMobile, style } = fdToCard(fd);
  const metadata: Record<string, unknown> = {};
  if (imageUrlMobile) metadata.image_url_mobile = imageUrlMobile;
  if (Object.keys(style).length) metadata.style = style;
  const { error } = await supabase.from("site_cards").insert({ ...base, metadata });
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms/site/cards");
  revalidatePublic(base.page);
  redirect("/app/cms/site/cards");
}

export async function atualizarCard(id: string, fd: FormData) {
  await requireSession();
  const supabase = await createClient();
  const { base, imageUrlMobile, style } = fdToCard(fd);

  // Mescla metadata pra não apagar listas (chips/metrics/items/icon) já salvas.
  const { data: existing } = await supabase
    .from("site_cards")
    .select("metadata")
    .eq("id", id)
    .maybeSingle();
  const prevMeta = ((existing as { metadata?: Record<string, unknown> } | null)?.metadata ?? {}) as Record<string, unknown>;
  const metadata: Record<string, unknown> = {
    ...prevMeta,
    image_url_mobile: imageUrlMobile ?? null,
    style: Object.keys(style).length ? style : undefined,
  };

  const { error } = await supabase
    .from("site_cards")
    .update({ ...base, metadata })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms/site/cards");
  revalidatePath(`/app/cms/site/cards/${id}`);
  revalidatePublic(base.page);
  redirect("/app/cms/site/cards");
}

export async function excluirCard(id: string) {
  await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("site_cards")
    .select("page")
    .eq("id", id)
    .maybeSingle();
  const { error } = await supabase.from("site_cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms/site/cards");
  if (row && (row as { page?: string }).page) {
    revalidatePublic((row as { page: string }).page);
  }
  redirect("/app/cms/site/cards");
}

export async function toggleAtivo(id: string) {
  await requireSession();
  const supabase = await createClient();
  const { data: row } = await supabase
    .from("site_cards")
    .select("active, page")
    .eq("id", id)
    .maybeSingle();
  if (!row) return;
  const r = row as { active: boolean; page: string };
  const { error } = await supabase
    .from("site_cards")
    .update({ active: !r.active })
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms/site/cards");
  revalidatePublic(r.page);
}
