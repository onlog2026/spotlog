import "server-only";
import { createClient } from "@/lib/supabase/server";

export type SiteCard = {
  id: string;
  page: string;
  section: string;
  slot: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  active: boolean;
  sort: number;
};

/**
 * Busca cards de uma seção. Retorna [] se a tabela não existir ainda (deploy
 * antes da migration) ou se houver qualquer erro — chamadores devem ter fallback.
 */
export async function getSiteCards(page: string, section: string): Promise<SiteCard[]> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("site_cards")
      .select(
        "id, page, section, slot, title, description, image_url, cta_label, cta_url, active, sort",
      )
      .eq("page", page)
      .eq("section", section)
      .eq("active", true)
      .order("sort", { ascending: true });
    if (error) return [];
    return (data ?? []) as SiteCard[];
  } catch {
    return [];
  }
}

export function mergeBySlot<T extends { slot: string }>(
  defaults: T[],
  overrides: SiteCard[],
): Array<T & Partial<SiteCard>> {
  const map = new Map(overrides.map((o) => [o.slot, o]));
  return defaults.map((d) => {
    const o = map.get(d.slot);
    if (!o) return d;
    return {
      ...d,
      title: o.title ?? (d as unknown as { title?: string }).title,
      description: o.description ?? (d as unknown as { description?: string }).description,
      image_url: o.image_url ?? null,
      cta_label: o.cta_label ?? null,
      cta_url: o.cta_url ?? null,
    } as T & Partial<SiteCard>;
  });
}
