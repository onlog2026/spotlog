import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listSegments } from "@/lib/queries/marketing-rel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, Trash2, RefreshCw } from "lucide-react";
import { computeSegment, deleteSegment } from "../actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

export default async function SegmentosPage() {
  const ctx = await requireSession();
  const segments = await listSegments(ctx.org.id);

  async function recompute(formData: FormData) {
    "use server";
    await computeSegment(String(formData.get("id")));
    revalidatePath("/app/marketing/relacionar/segmentos");
  }

  async function remove(formData: FormData) {
    "use server";
    await deleteSegment(String(formData.get("id")));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Segmentação de Leads</h2>
          <p className="text-sm text-muted-foreground">
            Crie segmentos dinâmicos pra reusar em campanhas e automações
          </p>
        </div>
        <Link href="/app/marketing/relacionar/segmentos/novo">
          <Button className="bg-[#BA0102] hover:bg-[#a10002] text-white">
            <Plus className="h-4 w-4 mr-1" /> Novo segmento
          </Button>
        </Link>
      </div>

      {segments.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Nenhum segmento ainda</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie seu primeiro segmento pra agrupar leads por critérios e usar em campanhas.
            </p>
            <Link href="/app/marketing/relacionar/segmentos/novo">
              <Button className="bg-[#BA0102] hover:bg-[#a10002] text-white">
                <Plus className="h-4 w-4 mr-1" /> Criar primeiro segmento
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {segments.map((s) => (
            <Card key={s.id} className="border-white/10 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-md bg-[#011960] text-white inline-flex items-center justify-center flex-none">
                    <Layers className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{s.name}</h3>
                      <Badge variant="secondary" className="text-[10px]">
                        {s.member_count} leads
                      </Badge>
                      {s.is_dynamic && (
                        <Badge variant="outline" className="text-[10px]">
                          dinâmico
                        </Badge>
                      )}
                    </div>
                    {s.description && (
                      <p className="text-xs text-muted-foreground mb-1">{s.description}</p>
                    )}
                    <p className="text-[11px] text-muted-foreground">
                      {s.last_computed_at
                        ? `Atualizado ${new Date(s.last_computed_at).toLocaleString("pt-BR")}`
                        : "Nunca computado"}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <form action={recompute}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button
                        type="submit"
                        size="sm"
                        variant="outline"
                        className="border-white/20"
                      >
                        <RefreshCw className="h-3 w-3 mr-1" /> Recomputar
                      </Button>
                    </form>
                    <form action={remove}>
                      <input type="hidden" name="id" value={s.id} />
                      <Button type="submit" size="icon" variant="ghost">
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </form>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
