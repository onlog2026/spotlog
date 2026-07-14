// ============================================================================
// MAPA DO SITE — registro central de tudo que é editável no CMS (site_cards).
// ----------------------------------------------------------------------------
// Deriva dos arrays de CÓDIGO que definem o site (menus, páginas de produto,
// grade da home). Consequência: produto novo no código aparece AUTOMATICAMENTE
// no Mapa do Site do CMS; produto removido do código faz o card virar ÓRFÃO
// (detectável e excluível). É o ciclo de vida que faltava.
// Server-only (importa componentes com getSiteCards) — usar só em páginas /app.
// ============================================================================

import { MENU_SEGMENTOS, MENU_SERVICOS, LANDING_PAGES } from "@/lib/landing-pages";
import { SOLUCOES } from "@/lib/solucoes-content";
import { SERVICE_TREE, SERVICE_HREF } from "@/components/v3/services-data";
import { GRID_DEFAULTS } from "@/components/v3/legacy/SolucoesGridV3";

export type SiteMapEntry = {
  group: string; // agrupamento na tela (ordem do site)
  label: string; // nome humano
  where: string; // "Aparece em: ..."
  frontUrl: string; // link pra ver no site
  page: string;
  section: string;
  slot: string;
  kind: "banner" | "texto";
  /** true = item de menu sem card próprio (página construída à mão) */
  noCard?: boolean;
};

// Seções da home (page='home') com rótulo humano — usadas pra agrupar os cards
// de texto/imagem existentes e pra NÃO marcá-los como órfãos.
export const HOME_SECTIONS: Record<string, string> = {
  hero: "Banner principal (topo da home)",
  beneficios: "Números + 'operador logístico'",
  focos: "Focos (Ecommerce & Farma)",
  integracoes: "Integrações (plataformas)",
  dores: "Dores que resolvemos",
  portfolio: "Portfólio de serviços (lista)",
  cobertura: "Cobertura (mapa SP, controle, atendimento)",
  blog: "Blog (seção da home)",
  creatives: "Vitrine de criativos",
  jornada: "Jornada da entrega (rastreio)",
  processo: "Processo operacional",
  header: "Cabeçalho (imagens do mega-menu)",
  contato: "Contato (imagem)",
  theme: "Tema do site (cores/logo/favicon)",
  solucoes: "Soluções", // slots de produto tratados à parte
};

// Páginas fixas (construídas à mão) que têm card de hero editável.
const FIXED_PAGES: { page: string; label: string; url: string }[] = [
  { page: "ecommerce", label: "Página Ecommerce — foto do topo", url: "/ecommerce" },
  { page: "farma", label: "Página Farma — foto do topo", url: "/farma" },
  { page: "sobre", label: "Página Sobre — foto principal", url: "/sobre" },
  { page: "tecnologia", label: "Página Tecnologia — foto principal", url: "/tecnologia" },
];

// Slots de texto/banner da seção Soluções da home (não são produtos).
const SOLUCOES_TEXT_SLOTS: { slot: string; label: string; kind: "banner" | "texto" }[] = [
  { slot: "banner", label: "Banner da seção Soluções (imagem + frase)", kind: "banner" },
  { slot: "heading", label: "Título da seção Soluções", kind: "texto" },
  { slot: "lead", label: "Subtítulo da seção Soluções", kind: "texto" },
  { slot: "eyebrow", label: "Etiqueta da seção Soluções", kind: "texto" },
];

/** slug do produto a partir do href do menu (ex.: /solucoes/coletas → coletas). */
function slugFromHref(href: string): string | null {
  if (href.startsWith("/solucoes/")) return href.slice("/solucoes/".length) || null;
  if (href === "/solucoes" || href === "/") return null;
  if (href === "/ecommerce" || href === "/farma") return null; // páginas fixas
  if (href.startsWith("/")) return href.slice(1) || null;
  return null;
}

function productEntry(
  group: string,
  label: string,
  slot: string,
  frontUrl: string,
  where: string,
): SiteMapEntry {
  return { group, label, where, frontUrl, page: "home", section: "solucoes", slot, kind: "banner" };
}

/** Monta o mapa completo, na ordem em que as coisas aparecem no site. */
export function siteMapEntries(): SiteMapEntry[] {
  const out: SiteMapEntry[] = [];

  // 1) Mega-menu Ecommerce / Farma — cada serviço aponta pro card do produto-destino.
  for (const g of SERVICE_TREE) {
    const group = g.id === "ecommerce" ? "Menu — Ecommerce" : "Menu — Farma";
    for (const s of g.items) {
      const href = SERVICE_HREF[s.id] ?? "/solucoes";
      const slug = slugFromHref(href);
      if (slug) {
        out.push(productEntry(group, s.name, slug, href, `Menu ${g.label} → ${s.name} · página ${href}`));
      } else if (href === "/farma") {
        out.push({ group, label: s.name, where: `Menu ${g.label} → ${s.name} · página /farma`, frontUrl: "/farma", page: "farma", section: "hero", slot: "image", kind: "banner" });
      } else {
        out.push({ group, label: s.name, where: `Menu ${g.label} → ${s.name} · aponta pra ${href} (página fixa, sem card próprio)`, frontUrl: href, page: "", section: "", slot: "", kind: "banner", noCard: true });
      }
    }
  }

  // 2) Menu Segmentos (19).
  for (const m of MENU_SEGMENTOS) {
    const slug = slugFromHref(m.href);
    if (slug) {
      out.push(productEntry("Menu — Segmentos", m.label, slug, m.href, `Menu Segmentos → ${m.label} · página ${m.href}`));
    } else {
      const page = m.href === "/farma" ? "farma" : "ecommerce";
      out.push({ group: "Menu — Segmentos", label: m.label, where: `Menu Segmentos → ${m.label} · página ${m.href}`, frontUrl: m.href, page, section: "hero", slot: "image", kind: "banner" });
    }
  }

  // 3) Menu Serviços (7).
  for (const m of MENU_SERVICOS) {
    const slug = slugFromHref(m.href);
    if (slug) {
      out.push(productEntry("Menu — Serviços", m.label, slug, m.href, `Menu Serviços → ${m.label} · página ${m.href}`));
    }
  }

  // 4) Grade de Soluções da home (9 cards) + textos/banner da seção.
  for (const t of SOLUCOES_TEXT_SLOTS) {
    out.push({ group: "Home — seção Soluções", label: t.label, where: "Home → seção Soluções", frontUrl: "/#solucoes", page: "home", section: "solucoes", slot: t.slot, kind: t.kind });
  }
  for (const d of GRID_DEFAULTS) {
    out.push(productEntry("Home — grade de Soluções", d.title, d.slot, `/solucoes/${d.slot}`, `Home → grade de Soluções → ${d.title} · página /solucoes/${d.slot}`));
  }

  // 5) Páginas fixas (hero editável).
  for (const f of FIXED_PAGES) {
    out.push({ group: "Páginas fixas (foto do topo)", label: f.label, where: `Página ${f.url}`, frontUrl: f.url, page: f.page, section: "hero", slot: "image", kind: "banner" });
  }

  return out;
}

const key = (page: string, section: string, slot: string) => `${page}/${section}/${slot}`;

/** Conjunto de slugs de PRODUTO válidos em home/solucoes (grade + landings + soluções). */
export function validProductSlots(): Set<string> {
  const s = new Set<string>();
  for (const d of GRID_DEFAULTS) s.add(d.slot);
  for (const l of LANDING_PAGES) s.add(l.slug);
  for (const sol of SOLUCOES) s.add(sol.slug);
  for (const t of SOLUCOES_TEXT_SLOTS) s.add(t.slot);
  return s;
}

/**
 * Uma linha do site_cards é ÓRFÃ quando o site não lê mais aquela chave:
 * - page='home' + section conhecida (HOME_SECTIONS) → ok, EXCETO solucoes com
 *   slot que não é produto/texto válido (produto removido do código = órfão).
 * - páginas fixas com section='hero' → ok.
 * - qualquer outra coisa (ex.: page='servico') → órfã.
 */
export function isOrphan(row: { page: string; section: string; slot: string }): boolean {
  if (row.page === "home") {
    if (!(row.section in HOME_SECTIONS)) return true;
    if (row.section === "solucoes") return !validProductSlots().has(row.slot);
    return false;
  }
  if (FIXED_PAGES.some((f) => f.page === row.page) && row.section === "hero") return false;
  return true;
}

export function entryKey(e: { page: string; section: string; slot: string }): string {
  return key(e.page, e.section, e.slot);
}
