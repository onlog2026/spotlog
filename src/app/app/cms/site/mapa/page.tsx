import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Pencil, RefreshCw, Map as MapIcon, Palette } from "lucide-react";
import { siteMapEntries, isOrphan, entryKey, HOME_SECTIONS, type SiteMapEntry } from "@/lib/site-map";
import { OrphanActions } from "./orphan-actions";
import { sincronizarMapa } from "./actions";

type Row = {
  id: string;
  page: string;
  section: string;
  slot: string;
  title: string | null;
  image_url: string | null;
  active: boolean;
};

/**
 * MAPA DO SITE — espelho da estrutura real (menus → páginas → seções da home).
 * Clique em Editar abre o card certo (criando se faltar). Órfãos no fim.
 */
export default async function MapaDoSitePage({
  searchParams,
}: {
  searchParams: Promise<{ criados?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const supabase = await createClient();
  const { data } = await supabase
    .from("site_cards")
    .select("id, page, section, slot, title, image_url, active");
  const rows = (data ?? []) as Row[];
  const byKey = new Map(rows.map((r) => [entryKey(r), r]));

  // Grupos do registro, na ordem do site.
  const entries = siteMapEntries();
  const groups = new Map<string, SiteMapEntry[]>();
  for (const e of entries) {
    if (!groups.has(e.group)) groups.set(e.group, []);
    groups.get(e.group)!.push(e);
  }

  // Seções "abertas" da home (conteúdo livre) — mostradas a partir do banco.
  const openSections = Object.keys(HOME_SECTIONS).filter(
    (s) => !["solucoes", "theme"].includes(s),
  );
  const homeOpen = new Map<string, Row[]>();
  for (const s of openSections) {
    const list = rows
      .filter((r) => r.page === "home" && r.section === s)
      .sort((a, b) => a.slot.localeCompare(b.slot));
    if (list.length) homeOpen.set(s, list);
  }

  const orphans = rows.filter(isOrphan);
  const missing = entries.filter((e) => !e.noCard && !byKey.has(entryKey(e)));

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <MapIcon className="h-5 w-5" /> Mapa do Site
          </h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Tudo que dá pra editar, organizado como aparece no site. Clique em{" "}
            <strong>Editar</strong> pra trocar imagem/texto — se o card ainda não
            existir, ele é criado na hora. Renomear o título de um produto muda o
            nome no menu e no card da home.
          </p>
        </div>
        <form action={sincronizarMapa}>
          <Button type="submit" variant="outline">
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Sincronizar cards{missing.length > 0 ? ` (${missing.length} faltando)` : ""}
          </Button>
        </form>
      </div>

      {sp.criados !== undefined && (
        <div className="rounded-lg border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-300">
          Sincronizado: {sp.criados} card(s) criado(s).
        </div>
      )}

      {/* Grupos derivados do código (menus, grade, páginas fixas) */}
      {Array.from(groups.entries()).map(([group, items]) => (
        <div key={group} className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">{group} · {items.length}</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((e, i) => {
              const row = e.noCard ? undefined : byKey.get(entryKey(e));
              return (
                <Card key={group + e.slot + i} className="overflow-hidden">
                  <div className="flex gap-3 p-3">
                    <div className="h-16 w-24 shrink-0 rounded-md bg-muted/40 overflow-hidden grid place-items-center">
                      {row?.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={row.image_url} alt={e.label} className="h-full w-full object-cover" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground px-1 text-center">
                          {e.noCard ? "página fixa" : row ? "sem imagem" : "card será criado"}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold leading-tight truncate">
                        {row?.title ?? e.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-snug mt-0.5 line-clamp-2">
                        {e.where}
                      </p>
                      <div className="mt-2 flex items-center gap-2">
                        {!e.noCard && (
                          <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs">
                            <Link
                              href={`/app/cms/site/cards/abrir?page=${encodeURIComponent(e.page)}&section=${encodeURIComponent(e.section)}&slot=${encodeURIComponent(e.slot)}&label=${encodeURIComponent(e.label)}`}
                            >
                              <Pencil className="h-3 w-3 mr-1" /> Editar
                            </Link>
                          </Button>
                        )}
                        <a
                          href={e.frontUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          <ExternalLink className="h-3 w-3" /> ver no site
                        </a>
                        {row && !row.active && <Badge variant="secondary">inativo</Badge>}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      ))}

      {/* Tema */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">Tema do site</p>
        <Card>
          <CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold">Cores, fontes, logo e favicon</p>
              <p className="text-[11px] text-muted-foreground">Vale pro site todo (e logo/favicon do painel).</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/app/cms/site/tema">
                <Palette className="h-3.5 w-3.5 mr-1.5" /> Abrir tema
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Seções da home com conteúdo livre (mostra o que existe no banco) */}
      {Array.from(homeOpen.entries()).map(([section, list]) => (
        <div key={section} className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Home — {HOME_SECTIONS[section]} · {list.length}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {list.map((r) => (
              <Card key={r.id} className={`overflow-hidden ${r.active ? "" : "opacity-60"}`}>
                <div className="flex gap-3 p-3">
                  <div className="h-16 w-24 shrink-0 rounded-md bg-muted/40 overflow-hidden grid place-items-center">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt={r.title ?? r.slot} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">texto</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight truncate">{r.title ?? r.slot}</p>
                    <p className="text-[11px] text-muted-foreground font-mono">{r.slot}</p>
                    <Button asChild size="sm" variant="outline" className="h-7 px-2 text-xs mt-2">
                      <Link href={`/app/cms/site/cards/${r.id}`}>
                        <Pencil className="h-3 w-3 mr-1" /> Editar
                      </Link>
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Órfãos — cards que o site NÃO usa mais */}
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-wider text-red-400">
          Órfãos — cards que o site não usa mais · {orphans.length}
        </p>
        {orphans.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum órfão. Tudo limpo ✅</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orphans.map((r) => (
              <Card key={r.id} className="overflow-hidden border-red-500/30">
                <div className="flex gap-3 p-3">
                  <div className="h-16 w-24 shrink-0 rounded-md bg-muted/40 overflow-hidden grid place-items-center">
                    {r.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={r.image_url} alt={r.title ?? r.slot} className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-[10px] text-muted-foreground">texto</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-tight truncate">{r.title ?? r.slot}</p>
                    <p className="text-[11px] text-muted-foreground font-mono truncate">
                      {r.page}/{r.section}/{r.slot} {r.active ? "" : "· inativo"}
                    </p>
                    <div className="mt-2">
                      <OrphanActions id={r.id} label={r.title ?? r.slot} active={r.active} />
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
