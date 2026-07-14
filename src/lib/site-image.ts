import "server-only";
import { getSiteCards } from "@/lib/site-cards";

/**
 * Lê uma imagem do CMS por page/section/slot, com fallback pro valor atual
 * (hardcoded). Assim qualquer imagem do site fica editável no painel sem
 * quebrar nada: se não houver card, usa o fallback.
 */
export async function getSiteImage(
  page: string,
  section: string,
  slot: string,
  fallback: string,
): Promise<string> {
  const rows = await getSiteCards(page, section);
  return rows.find((r) => r.slot === slot)?.image_url || fallback;
}
