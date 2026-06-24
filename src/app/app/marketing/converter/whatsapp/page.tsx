import { requireSession } from "@/lib/auth";
import { listMarketing, type WhatsappButton } from "@/lib/queries/marketing";
import { createWaButton, deleteMarketingItem } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, MessageCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function WhatsappPage() {
  const ctx = await requireSession();
  const buttons = await listMarketing<WhatsappButton>(ctx.org.id, "wabutton");

  async function submit(formData: FormData) {
    "use server";
    const paths = String(formData.get("show_on_paths") ?? "/")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    await createWaButton({
      name: String(formData.get("name") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").replace(/\D/g, ""),
      default_message: String(formData.get("default_message") ?? "") || undefined,
      position: (formData.get("position") as WhatsappButton["position"]) ?? "bottom_right",
      show_on_paths: paths,
    });
  }
  async function remove(formData: FormData) {
    "use server";
    await deleteMarketingItem("wabutton", String(formData.get("id")));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h2 className="text-lg font-semibold">Botões de WhatsApp</h2>
          <Button asChild variant="orange" size="sm">
            <a href="/app/marketing/converter/whatsapp/templates">Galeria de templates</a>
          </Button>
        </div>
        {buttons.length === 0 ? (
          <Card className="border-white/10 bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhum botão configurado.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {buttons.map((w) => (
              <Card key={w.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <MessageCircle className="h-4 w-4 text-emerald-500" />
                      <h3 className="font-medium text-sm">{w.name}</h3>
                      <Badge variant={w.active ? "default" : "secondary"}>
                        {w.active ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">+{w.phone}</p>
                    <p className="text-xs text-muted-foreground italic">"{w.default_message}"</p>
                    <p className="text-[10px] text-muted-foreground mt-1">
                      Posição: {w.position} · Cliques: {w.clicks}
                    </p>
                  </div>
                  <form action={remove}>
                    <input type="hidden" name="id" value={w.id} />
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
        <CardHeader><CardTitle className="text-base">Novo botão</CardTitle></CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <Input name="name" placeholder="Nome interno" required />
            <Input name="phone" placeholder="5511999999999 (E.164)" required />
            <Textarea
              name="default_message"
              rows={3}
              placeholder="Mensagem padrão"
              defaultValue="Olá! Vim pelo site da Spotlog."
            />
            <select name="position" className="w-full h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm" defaultValue="bottom_right">
              <option value="bottom_right">Inferior direito</option>
              <option value="bottom_left">Inferior esquerdo</option>
            </select>
            <Input name="show_on_paths" placeholder="/, /precos (separe por vírgula)" defaultValue="/" />
            <Button type="submit" className="w-full" variant="orange">Salvar botão</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
