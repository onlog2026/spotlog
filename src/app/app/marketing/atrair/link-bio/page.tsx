import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listMarketing, type LinkInBio } from "@/lib/queries/marketing";
import { createBio, addBioLink, deleteMarketingItem } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Link2, Plus, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function LinkBioPage() {
  const ctx = await requireSession();
  const bios = await listMarketing<LinkInBio>(ctx.org.id, "bio");

  async function submit(formData: FormData) {
    "use server";
    await createBio({
      slug: String(formData.get("slug") ?? ""),
      title: String(formData.get("title") ?? "").trim(),
      bio: String(formData.get("bio") ?? "") || undefined,
      theme: String(formData.get("theme") ?? "default"),
    });
  }

  async function addLink(formData: FormData) {
    "use server";
    await addBioLink(
      String(formData.get("bio_id")),
      String(formData.get("label") ?? "").trim(),
      String(formData.get("url") ?? "").trim(),
    );
  }

  async function remove(formData: FormData) {
    "use server";
    await deleteMarketingItem("bio", String(formData.get("id")));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Link na bio</h2>
        {bios.length === 0 ? (
          <Card className="border-white/10 bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Crie sua primeira página de link na bio.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {bios.map((b) => (
              <Card key={b.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <h3 className="font-semibold">{b.title}</h3>
                      <Link
                        href={`/bio/${b.slug}`}
                        target="_blank"
                        className="text-xs text-[#BA0102] hover:underline inline-flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" /> /bio/{b.slug}
                      </Link>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={b.active ? "default" : "secondary"}>
                        {b.active ? "Ativo" : "Inativo"}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{b.clicks} cliques</span>
                      <form action={remove}>
                        <input type="hidden" name="id" value={b.id} />
                        <Button type="submit" size="icon" variant="ghost">
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      </form>
                    </div>
                  </div>
                  <form action={addLink} className="flex flex-col sm:flex-row gap-2 border-t border-white/5 pt-3">
                    <input type="hidden" name="bio_id" value={b.id} />
                    <Input name="label" placeholder="Rótulo" required className="flex-1" />
                    <Input name="url" placeholder="https://..." required className="flex-1" />
                    <Button type="submit" size="sm" variant="outline">
                      <Plus className="h-3.5 w-3.5" /> Link
                    </Button>
                  </form>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Card className="border-white/10 bg-card/50 h-fit">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Link2 className="h-4 w-4" /> Nova bio
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <Input name="title" placeholder="Nome / Marca" required />
            <Input name="slug" placeholder="slug (URL)" required />
            <Textarea name="bio" placeholder="Bio curta" rows={3} />
            <select name="theme" className="w-full h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm">
              <option value="default">Tema padrão</option>
              <option value="dark">Escuro</option>
              <option value="brand">Spotlog brand</option>
            </select>
            <Button type="submit" className="w-full" variant="orange">Criar bio</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
