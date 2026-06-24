import { requireSession } from "@/lib/auth";
import { listMarketing, type Popup } from "@/lib/queries/marketing";
import { createPopup, deleteMarketingItem } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function PopupsPage() {
  const ctx = await requireSession();
  const popups = await listMarketing<Popup>(ctx.org.id, "popup");

  async function submit(formData: FormData) {
    "use server";
    const paths = String(formData.get("display_on_paths") ?? "/")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await createPopup({
      name: String(formData.get("name") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
      body: String(formData.get("body") ?? "") || undefined,
      cta_label: String(formData.get("cta_label") ?? "") || undefined,
      cta_url: String(formData.get("cta_url") ?? "") || undefined,
      cta_form_slug: String(formData.get("cta_form_slug") ?? "") || undefined,
      trigger_type: (formData.get("trigger_type") as Popup["trigger_type"]) ?? "time",
      trigger_value: String(formData.get("trigger_value") ?? "") || undefined,
      display_on_paths: paths,
    });
  }
  async function remove(formData: FormData) {
    "use server";
    await deleteMarketingItem("popup", String(formData.get("id")));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold">Pop-ups</h2>
          <Button asChild variant="orange" size="sm">
            <a href="/app/marketing/converter/popups/templates">Galeria de templates</a>
          </Button>
        </div>
        {popups.length === 0 ? (
          <Card className="border-white/10 bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhum pop-up criado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {popups.map((p) => (
              <Card key={p.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary" className="capitalize">{p.trigger_type}</Badge>
                      {p.trigger_value && (
                        <span className="text-[10px] text-muted-foreground">{p.trigger_value}</span>
                      )}
                      <Badge variant={p.active ? "default" : "secondary"}>
                        {p.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <h3 className="font-medium text-sm">{p.title}</h3>
                    <p className="text-xs text-muted-foreground">{p.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Páginas: {p.display_on_paths?.join(", ")}
                    </p>
                    <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Impressões: {p.impressions}</span>
                      <span>Cliques: {p.clicks}</span>
                      <span>Conversões: {p.conversions}</span>
                    </div>
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
        <CardHeader><CardTitle className="text-base">Novo pop-up</CardTitle></CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <Input name="name" placeholder="Nome interno" required />
            <Input name="title" placeholder="Título exibido" required />
            <Textarea name="body" placeholder="Mensagem do pop-up" rows={3} />
            <div className="grid grid-cols-2 gap-2">
              <select
                name="trigger_type"
                className="h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm"
                defaultValue="time"
              >
                <option value="time">Tempo</option>
                <option value="scroll">Scroll</option>
                <option value="exit_intent">Exit intent</option>
                <option value="page_visit">Visita à página</option>
              </select>
              <Input name="trigger_value" placeholder="Ex: 5s ou 50%" />
            </div>
            <Input name="cta_label" placeholder="Texto do botão CTA" />
            <Input name="cta_url" placeholder="URL do CTA" />
            <Input name="cta_form_slug" placeholder="Slug de formulário (opcional)" />
            <Input name="display_on_paths" placeholder="/, /precos, /sobre (separe por vírgula)" defaultValue="/" />
            <Button type="submit" className="w-full" variant="orange">Criar pop-up</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
