import { requireSession } from "@/lib/auth";
import { listMarketing, type Audience } from "@/lib/queries/marketing";
import { createAudience, deleteMarketingItem } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, Users2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PublicosPage() {
  const ctx = await requireSession();
  const items = await listMarketing<Audience>(ctx.org.id, "audience");

  async function submit(formData: FormData) {
    "use server";
    await createAudience({
      name: String(formData.get("name") ?? "").trim(),
      description: String(formData.get("description") ?? "") || undefined,
      type: (formData.get("type") as Audience["type"]) ?? "custom",
      size_estimate: String(formData.get("size_estimate") ?? "") || undefined,
    });
  }
  async function remove(formData: FormData) {
    "use server";
    await deleteMarketingItem("audience", String(formData.get("id")));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Públicos para anúncios</h2>
        {items.length === 0 ? (
          <Card className="border-white/10 bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Crie segmentações de público pra usar em campanhas externas.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {items.map((a) => (
              <Card key={a.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="capitalize">{a.type}</Badge>
                      <Users2 className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {(a.size_estimate ?? 0).toLocaleString("pt-BR")} pessoas est.
                      </span>
                    </div>
                    <h3 className="font-medium text-sm">{a.name}</h3>
                    {a.description && <p className="text-xs text-muted-foreground">{a.description}</p>}
                  </div>
                  <form action={remove}>
                    <input type="hidden" name="id" value={a.id} />
                    <Button type="submit" size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="border-white/10 bg-card/50 h-fit">
        <CardHeader><CardTitle className="text-base">Novo público</CardTitle></CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <Input name="name" placeholder="Nome do público" required />
            <select name="type" className="w-full h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm" defaultValue="custom">
              <option value="custom">Público personalizado</option>
              <option value="lookalike">Lookalike (semelhantes)</option>
              <option value="retargeting">Retargeting</option>
            </select>
            <Textarea name="description" placeholder="Filtros / critérios" rows={3} />
            <Input name="size_estimate" placeholder="Tamanho estimado" type="number" />
            <Button type="submit" className="w-full" variant="orange">Criar público</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
