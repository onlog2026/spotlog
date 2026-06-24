import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listSmsCampaigns } from "@/lib/queries/marketing-rel";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Plus, Trash2, Calendar } from "lucide-react";
import { deleteSms } from "../actions";

export const dynamic = "force-dynamic";

const STATUS_COLOR: Record<string, string> = {
  rascunho: "bg-white/10 text-foreground",
  agendada: "bg-blue-500/20 text-blue-300",
  enviando: "bg-yellow-500/20 text-yellow-300",
  enviada: "bg-emerald-500/20 text-emerald-300",
  falhou: "bg-red-500/20 text-red-300",
};

export default async function SmsPage() {
  const ctx = await requireSession();
  const campaigns = await listSmsCampaigns(ctx.org.id);

  async function remove(formData: FormData) {
    "use server";
    await deleteSms(String(formData.get("id")));
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Mensagens de SMS</h2>
          <p className="text-sm text-muted-foreground">
            Campanhas SMS segmentadas. Conecte um provedor (Twilio/Zenvia) em Integrações pra disparar.
          </p>
        </div>
        <Link href="/app/marketing/relacionar/sms/nova">
          <Button className="bg-[#BA0102] hover:bg-[#a10002] text-white">
            <Plus className="h-4 w-4 mr-1" /> Nova campanha
          </Button>
        </Link>
      </div>

      {campaigns.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-12 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Nenhuma campanha SMS</p>
            <p className="text-sm text-muted-foreground mb-4">
              Crie sua primeira campanha pra alcançar leads onde eles estão.
            </p>
            <Link href="/app/marketing/relacionar/sms/nova">
              <Button className="bg-[#BA0102] hover:bg-[#a10002] text-white">
                <Plus className="h-4 w-4 mr-1" /> Criar campanha
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {campaigns.map((c) => (
            <Card key={c.id} className="border-white/10 bg-card/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-[#011960] text-white inline-flex items-center justify-center flex-none">
                  <MessageSquare className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm">{c.name}</h3>
                    <Badge className={STATUS_COLOR[c.status] ?? "bg-white/10"}>{c.status}</Badge>
                    {c.scheduled_for && (
                      <span className="text-[10px] text-muted-foreground inline-flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(c.scheduled_for).toLocaleString("pt-BR")}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{c.message}</p>
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {c.sent_count}/{c.total_count} enviados · {c.failed_count} falhas
                  </p>
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
  );
}
