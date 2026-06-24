import { requireSession } from "@/lib/auth";
import { listMarketing, type AdCampaign } from "@/lib/queries/marketing";
import { createAdCampaign, deleteMarketingItem } from "../../actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdsPage() {
  const ctx = await requireSession();
  const ads = await listMarketing<AdCampaign>(ctx.org.id, "ads");

  async function submit(formData: FormData) {
    "use server";
    await createAdCampaign({
      platform: (formData.get("platform") as AdCampaign["platform"]) ?? "meta",
      name: String(formData.get("name") ?? "").trim(),
      objective: String(formData.get("objective") ?? "leads"),
      daily_budget: String(formData.get("daily_budget") ?? "") || undefined,
      form_slug: String(formData.get("form_slug") ?? "") || undefined,
    });
  }

  async function remove(formData: FormData) {
    "use server";
    await deleteMarketingItem("ads", String(formData.get("id")));
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Lead Ads</h2>
        <p className="text-xs text-muted-foreground -mt-2">
          Registre suas campanhas de Lead Ads. Sincronização com plataformas (Meta, Google, LinkedIn) é stub — registra a configuração para acompanhamento manual.
        </p>
        {ads.length === 0 ? (
          <Card className="border-white/10 bg-card/50">
            <CardContent className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma campanha registrada.
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3">
            {ads.map((a) => (
              <Card key={a.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="capitalize">{a.platform}</Badge>
                      <Badge variant="secondary">{a.status}</Badge>
                    </div>
                    <h3 className="font-medium text-sm">{a.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      Objetivo: {a.objective} · Budget diário: R$ {a.daily_budget ?? "—"} · Leads: {a.leads_count}
                    </p>
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
        <CardHeader>
          <CardTitle className="text-base">Nova campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={submit} className="space-y-3">
            <select name="platform" className="w-full h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm" defaultValue="meta">
              <option value="meta">Meta (Facebook + Instagram)</option>
              <option value="google">Google Ads</option>
              <option value="linkedin">LinkedIn Ads</option>
              <option value="tiktok">TikTok Ads</option>
            </select>
            <Input name="name" placeholder="Nome da campanha" required />
            <Input name="objective" placeholder="Objetivo (leads / tráfego / conversão)" defaultValue="leads" />
            <Input name="daily_budget" placeholder="Budget diário R$" type="number" step="0.01" />
            <Input name="form_slug" placeholder="Formulário associado (slug)" />
            <Button type="submit" className="w-full" variant="orange">Criar campanha</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
