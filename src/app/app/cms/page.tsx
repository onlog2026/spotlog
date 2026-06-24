import Link from "next/link";
import { FileText, Trophy, Edit3, Eye, Plus, FileEdit } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCmsDashboardKpis, getRecentPosts } from "@/lib/queries/cms";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function CmsDashboardPage() {
  const ctx = await requireSession();
  const [kpis, recent] = await Promise.all([
    getCmsDashboardKpis(ctx.org.id),
    getRecentPosts(ctx.org.id, 5),
  ]);

  const cards = [
    { label: "Posts publicados", value: kpis.postsPublicados, icon: FileText, color: "text-green-500" },
    { label: "Posts em rascunho", value: kpis.postsRascunho, icon: FileEdit, color: "text-amber-500" },
    { label: "Cases publicados", value: kpis.casesPublicados, icon: Trophy, color: "text-spotorange-500" },
    { label: "Cases em rascunho", value: kpis.casesRascunho, icon: Edit3, color: "text-muted-foreground" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <Button asChild>
          <Link href="/app/cms/posts/novo">
            <Plus className="h-4 w-4 mr-1.5" /> Novo post
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/app/cms/cases/novo">
            <Plus className="h-4 w-4 mr-1.5" /> Novo case
          </Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/blog" target="_blank">
            <Eye className="h-4 w-4 mr-1.5" /> Ver blog público
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-white/10 bg-card/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-3xl font-bold">{c.value}</div>
                  <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
                </div>
                <c.icon className={`h-8 w-8 ${c.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Últimos posts editados</CardTitle>
        </CardHeader>
        <CardContent>
          {recent.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground mb-4">Nenhum post ainda.</p>
              <Button asChild>
                <Link href="/app/cms/posts/novo">Criar primeiro post</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {recent.map((p) => (
                <Link
                  key={p.id}
                  href={`/app/cms/posts/${p.id}/editar`}
                  className="flex items-center justify-between py-3 hover:bg-white/5 -mx-3 px-3 rounded-lg"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate">{p.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {fmtDate(p.updated_at)} · /{p.slug}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-3 shrink-0">
                    <Badge variant="outline">{p.category}</Badge>
                    <Badge
                      variant="outline"
                      className={
                        p.status === "publicado"
                          ? "border-green-500/40 text-green-500"
                          : "border-amber-500/40 text-amber-500"
                      }
                    >
                      {p.status}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Conectado a <strong>{ctx.org.name}</strong>. Posts e cases com status &quot;publicado&quot; aparecem
        automaticamente em /blog e /cases.
      </p>
    </div>
  );
}
