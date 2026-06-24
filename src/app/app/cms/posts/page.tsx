import Link from "next/link";
import { Plus, FileText, Edit3 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getPostsAdmin } from "@/lib/queries/cms";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

export default async function PostsListPage() {
  const ctx = await requireSession();
  const posts = await getPostsAdmin(ctx.org.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{posts.length} {posts.length === 1 ? "post" : "posts"}</div>
        <Button asChild>
          <Link href="/app/cms/posts/novo">
            <Plus className="h-4 w-4 mr-1.5" />
            Novo post
          </Link>
        </Button>
      </div>

      {posts.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Nenhum post ainda</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Crie o primeiro post pra aparecer em /blog</p>
            <Button asChild>
              <Link href="/app/cms/posts/novo">Criar primeiro post</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Título</th>
                  <th className="text-left px-4 py-3 font-medium">Categoria</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Publicado</th>
                  <th className="text-right px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map((p) => (
                  <tr key={p.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium">{p.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">/{p.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{p.category}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          p.status === "publicado"
                            ? "border-green-500/40 text-green-500"
                            : p.status === "arquivado"
                            ? "border-muted text-muted-foreground"
                            : "border-amber-500/40 text-amber-500"
                        }
                      >
                        {p.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(p.published_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/cms/posts/${p.id}/editar`}>
                          <Edit3 className="h-4 w-4 mr-1" /> Editar
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
