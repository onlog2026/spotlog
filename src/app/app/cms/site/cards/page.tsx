import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, ImageOff } from "lucide-react";

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
  updated_at: string;
};

export default async function SiteCardsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  await requireSession();
  const params = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("site_cards")
    .select(
      "id, page, section, slot, title, description, image_url, cta_label, cta_url, active, sort, updated_at",
    )
    .order("page", { ascending: true })
    .order("section", { ascending: true })
    .order("sort", { ascending: true });

  if (params.page) query = query.eq("page", params.page);
  if (params.q) query = query.ilike("title", `%${params.q}%`);

  const { data } = await query;
  const rows = (data ?? []) as SiteCardRow[];

  // Agrupar por page → section
  const grouped = new Map<string, Map<string, SiteCardRow[]>>();
  for (const r of rows) {
    if (!grouped.has(r.page)) grouped.set(r.page, new Map());
    const sections = grouped.get(r.page)!;
    if (!sections.has(r.section)) sections.set(r.section, []);
    sections.get(r.section)!.push(r);
  }

  // Lista de páginas únicas pra filtro
  const allPages = Array.from(new Set(rows.map((r) => r.page))).sort();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">Cards do site</h2>
          <p className="text-sm text-muted-foreground">
            Edite imagens, textos e CTAs dos cards que aparecem nas páginas públicas.
          </p>
        </div>
        <Button asChild>
          <Link href="/app/cms/site/cards/novo">
            <Plus className="h-4 w-4 mr-1.5" /> Novo card
          </Link>
        </Button>
      </div>

      <form className="flex flex-wrap gap-3" method="GET">
        <select
          name="page"
          defaultValue={params.page ?? ""}
          className="h-10 rounded-md border border-input bg-background px-3 text-sm"
        >
          <option value="">Todas as páginas</option>
          {allPages.map((p) => (
            <option key={p} value={p}>
              /{p === "home" ? "" : p}
            </option>
          ))}
        </select>
        <input
          name="q"
          defaultValue={params.q ?? ""}
          placeholder="Buscar por título..."
          className="h-10 rounded-md border border-input bg-background px-3 text-sm flex-1 min-w-[200px]"
        />
        <Button type="submit" variant="outline">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Nenhum card cadastrado.
          </CardContent>
        </Card>
      ) : (
        Array.from(grouped.entries()).map(([page, sections]) => (
          <div key={page} className="space-y-4">
            <h3 className="text-base font-semibold text-foreground">
              Página: <span className="text-spotorange-500">/{page === "home" ? "" : page}</span>
            </h3>
            {Array.from(sections.entries()).map(([section, items]) => (
              <div key={section} className="space-y-2">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Seção: {section}
                </p>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {items.map((c) => (
                    <Card
                      key={c.id}
                      className={`border-white/10 bg-card/50 overflow-hidden ${
                        c.active ? "" : "opacity-50"
                      }`}
                    >
                      <div className="aspect-video bg-muted/40 relative">
                        {c.image_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.image_url}
                            alt={c.title ?? c.slot}
                            className="absolute inset-0 w-full h-full object-cover"
                          />
                        ) : (
                          <div className="absolute inset-0 grid place-items-center text-muted-foreground">
                            <ImageOff className="h-8 w-8" />
                          </div>
                        )}
                        <Badge
                          variant={c.active ? "default" : "secondary"}
                          className="absolute top-2 right-2"
                        >
                          {c.active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <CardContent className="p-3 space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground font-mono">{c.slot}</p>
                          <h4 className="text-sm font-semibold leading-tight line-clamp-2">
                            {c.title ?? "(sem título)"}
                          </h4>
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
