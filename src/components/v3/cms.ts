import "server-only";
import { createPublicClient } from "@/lib/supabase/admin";

export type CardContent = {
  slot: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  image_url_mobile: string | null;
  cta_label: string | null;
  cta_url: string | null;
  sort: number;
  metadata: Record<string, unknown>;
};

export type CardsBySection = Record<string, Record<string, CardContent>>;

type Row = {
  section: string;
  slot: string;
  title: string | null;
  description: string | null;
  image_url: string | null;
  cta_label: string | null;
  cta_url: string | null;
  sort: number | null;
  metadata: Record<string, unknown> | null;
};

/**
 * Lê todos os cards ativos de uma página do CMS, agrupados por section → slot.
 * Tolerante a falha: se o banco/coluna não responder, devolve {} e as seções
 * usam os defaults hardcoded. Nunca quebra a landing.
 */
export async function getPageCards(page: string): Promise<CardsBySection> {
  try {
    const supabase = createPublicClient();
    const { data, error } = await supabase
      .from("site_cards")
      .select("section, slot, title, description, image_url, cta_label, cta_url, sort, metadata")
      .eq("page", page)
      .eq("active", true)
      .order("sort", { ascending: true });
    if (error || !data) return {};

    const out: CardsBySection = {};
    for (const r of data as Row[]) {
      const meta = (r.metadata ?? {}) as Record<string, unknown>;
      const card: CardContent = {
        slot: r.slot,
        title: r.title,
        description: r.description,
        image_url: r.image_url,
        image_url_mobile: (meta.image_url_mobile as string) ?? null,
        cta_label: r.cta_label,
        cta_url: r.cta_url,
        sort: r.sort ?? 0,
        metadata: meta,
      };
      (out[r.section] ??= {})[r.slot] = card;
    }
    return out;
  } catch {
    return {};
  }
}

/** Açúcar: pega um campo de texto de um slot, com fallback. */
export function cardText(
  cards: Record<string, CardContent> | undefined,
  slot: string,
  field: "title" | "description" | "cta_label" | "cta_url",
  fallback: string,
): string {
  return cards?.[slot]?.[field] ?? fallback;
}
