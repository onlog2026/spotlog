"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const cardSchema = z.object({
  page: z.string().min(1).max(60),
  section: z.string().min(1).max(60),
  slot: z.string().min(1).max(60),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(800).nullable().optional(),
  image_url: z.string().max(800).nullable().optional(),
  cta_label: z.string().max(60).nullable().optional(),
  cta_url: z.string().max(400).nullable().optional(),
  active: z.boolean().default(true),
  sort: z.coerce.number().int().default(0),
});

function fdToCard(fd: FormData) {
  return cardSchema.parse({
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
}

function revalidatePublic(page: string) {
  revalidatePath("/");
  if (page && page !== "home") revalidatePath(`/${page}`);
}

export async function criarCard(fd: FormData) {
  await requireSession();
  const supabase = await createClient();
  const data = fdToCard(fd);
  const { error } = await supabase.from("site_cards").insert(data);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms/site/cards");
  revalidatePublic(data.page);
  redirect("/app/cms/site/cards");
}

export async function atualizarCard(id: string, fd: FormData) {
  await requireSession();
  const supabase = await createClient();
  const data = fdToCard(fd);
  const { error } = await supabase
    .from("site_cards")
    .update(data)
    .eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms/site/cards");
  revalidatePath(`/app/cms/site/cards/${id}`);
  revalidatePublic(data.page);
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
