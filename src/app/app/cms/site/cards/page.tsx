import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Type } from "lucide-react";
import { siteMapEntries, isOrphan, entryKey } from "@/lib/site-map";

type SiteCardRow = {
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

const pageLabel = (p: string) => (p === "home" ? "Home (/)" : `/${p}`);

export default async function SiteCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; section?: string; type?: string; q?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const supabase = await createClient();

  // Busca TODOS os cards uma vez (tabela pequena). Os filtros são aplicados em
  // memória — assim o seletor de páginas/seções nunca "colapsa" pro que já foi filtrado.
  const { data } = await supabase
    .from("site_cards")
    .select(
      "id, page, section, slot, title, description, image_url, cta_label, cta_url, active, sort",
    )
    .order("page", { ascending: true })
    .order("section", { ascending: true })
    .order("sort", { ascending: true });
  const all = (data ?? []) as SiteCardRow[];

  // "Aparece em:" — junta com o Mapa do Site (registro derivado do código).
  const whereByKey = new Map<string, string>();
  for (const e of siteMapEntries()) {
    const k = entryKey(e);
    if (!whereByKey.has(k)) whereByKey.set(k, e.where);
  }

  // Opções de filtro sempre completas
  const allPages = Array.from(new Set(all.map((r) => r.page))).sort();
  const sectionsForPage = Array.from(
    new Set(all.filter((r) => !sp.page || r.page === sp.page).map((r) => r.section)),
  ).sort();

  const q = (sp.q ?? "").trim().toLowerCase();
  const type = sp.type ?? "img"; // padrão: abre mostrando só os banners (com imagem)
  const filtered = all.filter((r) => {
    if (sp.page && r.page !== sp.page) return false;
    if (sp.section && r.section !== sp.section) return false;
    if (type === "img" && !r.image_url) return false;
    if (type === "text" && r.image_url) return false;
    if (q) {
      const hay = `${r.title ?? ""} ${r.description ?? ""} ${r.slot} ${r.section} ${r.cta_label ?? ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const grouped = new Map<string, Map<string, SiteCardRow[]>>();
  for (const r of filtered) {
    if (!grouped.has(r.page)) grouped.set(r.page, new Map());
    const secs = grouped.get(r.page)!;
    if (!secs.has(r.section)) secs.set(r.section, []);
    secs.get(r.section)!.push(r);
  }

  const withImg = all.filter((r) => r.image_url).length;
  const hasFilter = Boolean(sp.page || sp.section || sp.q || sp.type);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cards do site</h2>
          <p className="text-sm text-muted-foreground">
            {all.length} cards · {withImg} com imagem (banner). Edite imagens, textos e CTAs das páginas públicas.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/cms/site/cards/novo">
            <Plus className="h-4 w-4 mr-1.5" /> Novo card
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap items-center gap-2" method="GET">
        <select
          name="page"
          defaultValue={sp.page ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas as páginas</option>
          {allPages.map((p) => (
            <option key={p} value={p}>
              {pageLabel(p)}
            </option>
          ))}
        </select>
        <select
          name="section"
          defaultValue={sp.section ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas as seções</option>
          {sectionsForPage.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select
          name="type"
          defaultValue={type}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="all">Todos os tipos</option>
          <option value="img">Com imagem (banner)</option>
          <option value="text">Só texto</option>
        </select>
        <input
          name="q"
          defaultValue={sp.q ?? ""}
          placeholder="Buscar por nome, texto, slot..."
          className="h-10 rounded-md border border-input bg-background px-3 text-sm flex-1 min-w-[180px]"
        />
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
        {hasFilter && (
          <Button asChild variant="ghost">
            <Link href="/app/cms/site/cards">Limpar</Link>
          </Button>
        )}
      </form>

      <p className="text-xs text-muted-foreground">
        Mostrando {filtered.length} {type === "img" ? "banner(s) com imagem" : "card(s)"} de {all.length} no total.
        {type === "img"
          ? ` Os ${all.length - withImg} cards de texto estão ocultos (nada foi apagado) — mude o filtro "Tipo" para "Todos" ou "Só texto" para vê-los e editá-los.`
          : ""}
        {" "}As páginas de serviço (Ecommerce, Same Day, Fulfillment, Reversa, etc.) são definidas no código e não aparecem aqui.
      </p>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum card com esse filtro.
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([page, sections]) => (
          <div key={page} className="space-y-4">
            <h3 className="text-base font-semibold">
              Página: <span className="text-primary">{pageLabel(page)}</span>
            </h3>
            {Array.from(sections.entries()).map(([section, items]) => (
              <div key={section} className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Seção: {section} · {items.length}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((c) => (
                    <Card
                      key={c.id}
                      className={`overflow-hidden ${c.active ? "" : "opacity-60"}`}
                    >
                      <div className="aspect-video relative bg-muted/40">
                        {c.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.image_url}
                            alt={c.title ?? c.slot}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 p-3 flex flex-col gap-1 overflow-hidden">
                            <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                              <Type className="h-3 w-3" /> Card de texto
                            </span>
                            <p className="text-sm font-medium leading-snug line-clamp-2 text-foreground">
                              {c.title || c.cta_label || "(sem título)"}
                            </p>
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {c.description || c.cta_url || ""}
                            </p>
                          </div>
                        )}
                        <Badge
                          variant={c.active ? "default" : "secondary"}
                          className="absolute top-2 right-2"
                        >
                          {c.image_url ? "Banner" : "Texto"}
                          {c.active ? "" : " · off"}
                        </Badge>
                      </div>
                      <CardContent className="p-3 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground font-mono">{c.slot}</p>
                          <h4 className="text-sm font-semibold leading-tight line-clamp-2">
                            {c.title ?? c.cta_label ?? "(sem título)"}
                          </h4>
                          {whereByKey.get(`${c.page}/${c.section}/${c.slot}`) ? (
                            <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                              📍 {whereByKey.get(`${c.page}/${c.section}/${c.slot}`)}
                            </p>
                          ) : isOrphan(c) ? (
                            <Badge variant="destructive" className="mt-1">órfão — site não usa</Badge>
                          ) : null}
                        </div>
                        <Button asChild size="sm" variant="outline" className="w-full">
                          <Link href={`/app/cms/site/cards/${c.id}`}>
                            <Pencil className="h-3.5 w-3.5 mr-1.5" />
                            Editar
                          </Link>
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  );
}
