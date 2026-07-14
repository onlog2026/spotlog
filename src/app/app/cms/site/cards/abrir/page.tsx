import { redirect, notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

/**
 * Abre o editor do card identificado por (page, section, slot) — CRIANDO a
 * linha se ainda não existir (title = label). É o que garante "clicou no item
 * do Mapa do Site → sempre abre um card". Idempotente: 2 cliques seguidos
 * caem na mesma linha (select antes de insert; conflito → re-select).
 */
export default async function AbrirCardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; section?: string; slot?: string; label?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const page = (sp.page ?? "").trim().slice(0, 60);
  const section = (sp.section ?? "").trim().slice(0, 60);
  const slot = (sp.slot ?? "").trim().slice(0, 60);
  const label = (sp.label ?? "").trim().slice(0, 200);
  if (!page || !section || !slot) notFound();

  const supabase = await createClient();
  const find = async () => {
    const { data } = await supabase
      .from("site_cards")
      .select("id")
      .eq("page", page)
      .eq("section", section)
      .eq("slot", slot)
      .order("active", { ascending: false })
      .limit(1)
      .maybeSingle();
    return (data as { id: string } | null)?.id ?? null;
  };

  let id = await find();
  if (!id) {
    const { data, error } = await supabase
      .from("site_cards")
      .insert({ page, section, slot, title: label || slot, active: true, sort: 0, metadata: {} })
      .select("id")
      .single();
    if (!error && data) id = (data as { id: string }).id;
    else id = await find(); // corrida/conflito → alguém criou antes; reusa.
  }
  if (!id) throw new Error("Não foi possível abrir/criar o card.");
  redirect(`/app/cms/site/cards/${id}`);
}
