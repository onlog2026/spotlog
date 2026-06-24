import { requireSession } from "@/lib/auth";
import { listMarketing, type WebPushCampaign } from "@/lib/queries/marketing";
import { createPushCampaign, deleteMarketingItem } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Bell, Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WebPushPage() {
  const ctx = await requireSession();
  const items = await listMarketing<WebPushCampaign>(ctx.org.id, "push");

  async function submit(formData: FormData) {
    "use server";
    await createPushCampaign({
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "").trim(),
      url: String(formData.get("url") ?? "") || undefined,
      icon_url: String(formData.get("icon_url") ?? "") || undefined,
      scheduled_for: String(formData.get("scheduled_for") ?? "") || undefined,
    });
  }
  async function remove(formData: FormData) {
    "use server";
    await deleteMarketingItem("push", String(formData.get("id")));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Bell className="h-5 w-5" /> Web Push
          </h2>
          <Button asChild variant="orange" size="sm">
            <a href="/app/marketing/converter/push/templates">Galeria de templates</a>
          </Button>
        </div>
        <p className="text-xs text-muted-foreground -mt-2">
          Stub: registra campanhas para envio futuro. Envio real depende de chaves VAPID (configurar
          em integrações).
        </p>
        {items.length === 0 ? (
          <Card className="border-white/10 bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma campanha Web Push agendada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {items.map((c) => (
              <Card key={c.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-medium text-sm">{c.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-2">{c.body}</p>
                    <div className="flex gap-4 text-[10px] text-muted-foreground mt-2">
                      <span>Enviados: {c.sent_count}</span>
                      <span>Cliques: {c.click_count}</span>
                      {c.scheduled_for && (
                        <span>Agendado: {new Date(c.scheduled_for).toLocaleString("pt-BR")}</span>
                      )}
                    </div>
                  </div>
                  <form action={remove}>
                    <input type="hidden" name="id" value={c.id} />
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
        <CardHeader><CardTitle className="text-base">Nova campanha</CardTitle></CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <Input name="title" placeholder="Título da notificação" required maxLength={50} />
            <Textarea name="body" placeholder="Corpo da notificação" required rows={3} maxLength={150} />
            <Input name="url" placeholder="URL ao clicar" />
            <Input name="icon_url" placeholder="URL do ícone (192x192)" />
            <div>
              <label className="text-xs text-muted-foreground">Agendar para</label>
              <Input type="datetime-local" name="scheduled_for" />
            </div>
            <Button type="submit" className="w-full" variant="orange">Agendar</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
