import { requireSession } from "@/lib/auth";
import { listMarketing, type SocialPost } from "@/lib/queries/marketing";
import { createSocialPost, deleteMarketingItem } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Trash2, Send } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function SocialPage() {
  const ctx = await requireSession();
  const posts = await listMarketing<SocialPost>(ctx.org.id, "social");

  async function submit(formData: FormData) {
    "use server";
    await createSocialPost({
      network: (formData.get("network") as SocialPost["network"]) ?? "instagram",
      caption: String(formData.get("caption") ?? "").trim(),
      media_url: String(formData.get("media_url") ?? "") || undefined,
      scheduled_for: String(formData.get("scheduled_for") ?? "") || undefined,
    });
  }

  async function remove(formData: FormData) {
    "use server";
    await deleteMarketingItem("social", String(formData.get("id")));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Postagens em mídias sociais</h2>
        {posts.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-3">
            {posts.map((p) => (
              <Card key={p.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="capitalize">{p.network}</Badge>
                      <Badge variant={p.status === "publicado" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                      {p.scheduled_for && (
                        <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(p.scheduled_for).toLocaleString("pt-BR")}
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap line-clamp-4">{p.caption}</p>
                  </div>
                  <form action={remove}>
                    <input type="hidden" name="id" value={p.id} />
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
        <CardHeader>
          <CardTitle className="text-base">Novo post</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <select
              name="network"
              className="w-full h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm"
              defaultValue="instagram"
            >
              <option value="instagram">Instagram</option>
              <option value="facebook">Facebook</option>
              <option value="linkedin">LinkedIn</option>
              <option value="twitter">Twitter / X</option>
              <option value="tiktok">TikTok</option>
            </select>
            <Textarea name="caption" placeholder="Legenda do post" required rows={5} />
            <Input name="media_url" placeholder="URL da mídia (opcional)" />
            <div>
              <label className="text-xs text-muted-foreground">Agendar para</label>
              <Input type="datetime-local" name="scheduled_for" />
            </div>
            <Button type="submit" className="w-full" variant="orange">
              <Send className="h-4 w-4" /> Agendar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <Card className="border-white/10 bg-card/50">
      <CardContent className="py-12 text-center">
        <p className="text-sm text-muted-foreground">
          Nenhum post agendado. Use o formulário ao lado pra criar o primeiro.
        </p>
      </CardContent>
    </Card>
  );
}
