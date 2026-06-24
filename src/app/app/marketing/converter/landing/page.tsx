import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listMarketing, type LandingPage } from "@/lib/queries/marketing";
import { deleteMarketingItem } from "../../actions";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Plus, Trash2, FileText } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LandingListPage() {
  const ctx = await requireSession();
  const items = await listMarketing<LandingPage>(ctx.org.id, "landing");

  async function remove(formData: FormData) {
    "use server";
    await deleteMarketingItem("landing", String(formData.get("id")));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <h2 className="text-lg font-semibold">Landing Pages</h2>
        <div className="flex gap-2">
          <Button asChild variant="orange">
            <Link href="/app/marketing/converter/landing/templates">
              Galeria de templates
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/app/marketing/converter/landing/nova">
              <Plus className="h-4 w-4" /> Em branco
            </Link>
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="py-16 text-center">
            <FileText className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">Nenhuma landing page ainda.</p>
            <Button asChild variant="orange">
              <Link href="/app/marketing/converter/landing/nova">Criar a primeira</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {items.map((l) => (
            <Card key={l.id} className="border-white/10 bg-card/50 hover:border-white/20 transition">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={l.status === "publicado" ? "default" : "secondary"}
                    className="capitalize"
                  >
                    {l.status}
                  </Badge>
                  <code className="text-[10px] text-muted-foreground">/{l.slug}</code>
                </div>
                <h3 className="font-semibold text-sm line-clamp-2">{l.title}</h3>
                {l.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{l.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                  <div className="text-center">
                    <div className="text-base font-bold">{l.views ?? 0}</div>
                    <div className="text-[9px] uppercase text-muted-foreground">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-base font-bold text-emerald-400">{l.conversions ?? 0}</div>
                    <div className="text-[9px] uppercase text-muted-foreground">Conversões</div>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-2 pt-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/marketing/converter/landing/${l.id}`}>Editar</Link>
                  </Button>
                  <Link
                    href={`/lp/${l.slug}`}
                    target="_blank"
                    className="text-xs text-[#BA0102] inline-flex items-center gap-1 hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" /> Abrir
                  </Link>
                  <form action={remove}>
                    <input type="hidden" name="id" value={l.id} />
                    <Button type="submit" size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
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
