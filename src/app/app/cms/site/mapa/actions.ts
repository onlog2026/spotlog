"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { siteMapEntries, isOrphan, entryKey } from "@/lib/site-map";

/**
 * Cria de uma vez todos os cards do registro que ainda não existem no banco
 * (title = nome do item). Roda quantas vezes quiser — só cria o que falta.
 */
export async function sincronizarMapa() {
  await requireSession();
  const supabase = await createClient();

  const { data } = await supabase
    .from("site_cards")
    .select("page, section, slot");
  const existing = new Set(
    ((data ?? []) as { page: string; section: string; slot: string }[]).map(entryKey),
  );

  // dedupe por chave (o mesmo card pode aparecer em mais de um grupo do mapa)
  const missing = new Map<string, { page: string; section: string; slot: string; title: string }>();
  for (const e of siteMapEntries()) {
    if (e.noCard) continue;
    const k = entryKey(e);
    if (!existing.has(k) && !missing.has(k)) {
      missing.set(k, { page: e.page, section: e.section, slot: e.slot, title: e.label });
    }
  }

  let criados = 0;
  if (missing.size > 0) {
    const rows = [...missing.values()].map((m) => ({ ...m, active: true, sort: 0, metadata: {} }));
    const { error } = await supabase.from("site_cards").insert(rows);
    if (error) throw new Error(error.message);
    criados = rows.length;
  }

  revalidatePath("/app/cms/site/mapa");
  revalidatePath("/app/cms/site/cards");
  // Cards recém-criados precisam refletir no site inteiro na hora.
  revalidatePath("/", "layout");
  revalidateTag("site-cards");
  redirect(`/app/cms/site/mapa?criados=${criados}`);
}

/** Exclui DE VEZ um card órfão. Guarda anti-tiro-no-pé: recusa chave do registro. */
export async function excluirOrfao(id: string) {
  await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_cards")
    .select("page, section, slot")
    .eq("id", id)
    .maybeSingle();
  if (!data) return;
  const row = data as { page: string; section: string; slot: string };
  if (!isOrphan(row)) throw new Error("Este card está em uso pelo site — não dá pra excluir por aqui.");
  const { error } = await supabase.from("site_cards").delete().eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms/site/mapa");
  revalidatePath("/app/cms/site/cards");
  revalidatePath("/", "layout");
  revalidateTag("site-cards");
}

/** Desativa (some do site, não apaga) um card órfão. */
export async function desativarOrfao(id: string) {
  await requireSession();
  const supabase = await createClient();
  const { error } = await supabase.from("site_cards").update({ active: false }).eq("id", id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/cms/site/mapa");
  revalidatePath("/", "layout");
  revalidateTag("site-cards");
}
