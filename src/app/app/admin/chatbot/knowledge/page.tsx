import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listKnowledge, KB_CATEGORIES, type KBCategory } from "@/lib/queries/chatbot";
import { Card, CardContent } from "@/components/ui/card";
import { deleteKnowledgeAction } from "../actions";
import { Pencil, Plus, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

const CAT_LABEL: Record<string, string> = Object.fromEntries(
  KB_CATEGORIES.map((c) => [c.value, c.label]),
);

export default async function KnowledgeListPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; q?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const category = sp.category && CAT_LABEL[sp.category] ? (sp.category as KBCategory) : undefined;
  const items = await listKnowledge({ category, search: sp.q });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <form className="flex flex-wrap items-center gap-2">
          <input
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Buscar por pergunta…"
            className="rounded-md border border-white/10 bg-card/40 px-3 py-1.5 text-sm w-64"
          />
          <select
            name="category"
            defaultValue={category ?? ""}
            className="rounded-md border border-white/10 bg-card/40 px-3 py-1.5 text-sm"
          >
            <option value="">Todas categorias</option>
            {KB_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm font-medium hover:bg-white/15"
          >
            Filtrar
          </button>
        </form>
        <Link
          href="/app/admin/chatbot/knowledge/novo"
          className="inline-flex items-center gap-1.5 rounded-md bg-spotorange-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-spotorange-600"
        >
          <Plus className="h-4 w-4" />
          Nova entrada
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="border-white/10 bg-card/40">
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma entrada na base. Clique em &quot;Nova entrada&quot; pra começar.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((it) => (
            <Card
              key={it.id}
              className="border-white/10 bg-card/40 hover:bg-card/60 transition"
            >
              <CardContent className="flex flex-wrap items-start justify-between gap-3 py-3">
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded bg-spotorange-500/20 px-2 py-0.5 font-medium text-spotorange-300">
                      {CAT_LABEL[it.category] ?? it.category}
                    </span>
                    <span className="rounded bg-white/5 px-2 py-0.5 text-muted-foreground">
                      prioridade {it.priority}
                    </span>
                    {!it.active ? (
                      <span className="rounded bg-red-500/20 px-2 py-0.5 text-red-300">
                        inativo
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm font-semibold">{it.question}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {it.answer}
                  </p>
                  {it.keywords.length ? (
                    <p className="text-[10px] text-muted-foreground">
                      keywords: {it.keywords.join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/app/admin/chatbot/knowledge/${it.id}/editar`}
                    className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2.5 py-1 text-xs hover:bg-white/5"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Editar
                  </Link>
                  <form action={deleteKnowledgeAction}>
                    <input type="hidden" name="id" value={it.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-md border border-red-500/30 bg-red-500/10 px-2.5 py-1 text-xs text-red-300 hover:bg-red-500/20"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      Excluir
                    </button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
