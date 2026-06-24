import { requireSession } from "@/lib/auth";
import { listSmartLeads } from "@/lib/queries/marketing-rel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Sparkles, Check, RefreshCw } from "lucide-react";
import { detectSmartLeads, ackSmartLead } from "../actions";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

const SIGNAL_LABEL: Record<string, string> = {
  high_score: "Score alto",
  recent_with_utm: "Recente c/ UTM",
  visited_pricing_3x: "Visitou preços 3x",
  abandoned_cart: "Carrinho abandonado",
};

export default async function InteligentesPage() {
  const ctx = await requireSession();
  const list = await listSmartLeads(ctx.org.id);
  const pending = list.filter((s) => !s.acknowledged);
  const acked = list.filter((s) => s.acknowledged);

  async function detect() {
    "use server";
    await detectSmartLeads();
    revalidatePath("/app/marketing/relacionar/inteligentes");
  }

  async function ack(formData: FormData) {
    "use server";
    await ackSmartLead(String(formData.get("id")));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold inline-flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#BA0102]" /> Leads Inteligentes
          </h2>
          <p className="text-sm text-muted-foreground">
            Sinais de compra detectados pela IA. Aja antes do concorrente.
          </p>
        </div>
        <form action={detect}>
          <Button type="submit" className="bg-[#BA0102] hover:bg-[#a10002] text-white">
            <RefreshCw className="h-4 w-4 mr-1" /> Detectar agora
          </Button>
        </form>
      </div>

      {pending.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-12 text-center">
            <Activity className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Nenhum sinal quente agora</p>
            <p className="text-sm text-muted-foreground mb-4">
              Clique em &quot;Detectar agora&quot; pra rodar a heurística sobre seus leads atuais.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold">{pending.length} sinais ativos</h3>
          {pending.map((s) => (
            <Card key={s.id} className="border-white/10 bg-card/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-[#BA0102] text-white inline-flex items-center justify-center flex-none">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-sm">
                      {s.lead_name ?? s.lead_email ?? "Lead sem nome"}
                    </h4>
                    <Badge className="bg-[#011960] text-white text-[10px]">
                      {SIGNAL_LABEL[s.signal] ?? s.signal}
                    </Badge>
                    <Badge variant="secondary" className="text-[10px]">
                      score {s.score}
                    </Badge>
                  </div>
                  {s.lead_email && (
                    <p className="text-xs text-muted-foreground">{s.lead_email}</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">
                    Detectado {new Date(s.detected_at).toLocaleString("pt-BR")}
                  </p>
                </div>
                <form action={ack}>
                  <input type="hidden" name="id" value={s.id} />
                  <Button type="submit" size="sm" variant="outline" className="border-white/20">
                    <Check className="h-3 w-3 mr-1" /> Marcar como visto
                  </Button>
                </form>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {acked.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Histórico ({acked.length})
          </h3>
          {acked.slice(0, 10).map((s) => (
            <Card key={s.id} className="border-white/10 bg-card/30 opacity-70">
              <CardContent className="p-3 flex items-center gap-3 text-xs">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="flex-1">
                  {s.lead_name ?? s.lead_email} — {SIGNAL_LABEL[s.signal] ?? s.signal}
                </span>
                <span className="text-muted-foreground">
                  {new Date(s.detected_at).toLocaleDateString("pt-BR")}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
