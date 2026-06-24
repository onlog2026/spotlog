import Link from "next/link";
import { Plus, Trophy, Edit3 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getCasesAdmin } from "@/lib/queries/cms";

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "2-digit" });
}

export default async function CasesListPage() {
  const ctx = await requireSession();
  const cases = await getCasesAdmin(ctx.org.id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">{cases.length} {cases.length === 1 ? "case" : "cases"}</div>
        <Button asChild>
          <Link href="/app/cms/cases/novo">
            <Plus className="h-4 w-4 mr-1.5" />
            Novo case
          </Link>
        </Button>
      </div>

      {cases.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="py-16 text-center">
            <Trophy className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-medium">Nenhum case ainda</p>
            <p className="text-sm text-muted-foreground mt-1 mb-5">Mostre resultados reais em /cases</p>
            <Button asChild>
              <Link href="/app/cms/cases/novo">Criar primeiro case</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-white/10 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-3 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 font-medium">Segmento</th>
                  <th className="text-left px-4 py-3 font-medium">Status</th>
                  <th className="text-left px-4 py-3 font-medium">Publicado</th>
                  <th className="text-right px-4 py-3 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {cases.map((c) => (
                  <tr key={c.id} className="hover:bg-white/5">
                    <td className="px-4 py-3">
                      <div className="font-medium">{c.client_name}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">/{c.slug}</div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{c.segment}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant="outline"
                        className={
                          c.status === "publicado"
                            ? "border-green-500/40 text-green-500"
                            : c.status === "arquivado"
                            ? "border-muted text-muted-foreground"
                            : "border-amber-500/40 text-amber-500"
                        }
                      >
                        {c.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{fmtDate(c.published_at)}</td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/app/cms/cases/${c.id}/editar`}>
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
