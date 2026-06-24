import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listSegments } from "@/lib/queries/marketing-rel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { saveSmsForm } from "../../actions";
import { SmsMessageInput } from "@/components/marketing/relacionar/sms-message-input";

export const dynamic = "force-dynamic";

export default async function NovaSmsPage() {
  const ctx = await requireSession();
  const segments = await listSegments(ctx.org.id);

  return (
    <div className="space-y-6 max-w-2xl">
      <Link
        href="/app/marketing/relacionar/sms"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div>
        <h2 className="text-xl font-bold">Nova campanha SMS</h2>
        <p className="text-sm text-muted-foreground">
          Crie e agende. O envio depende de um provedor conectado (Twilio/Zenvia).
        </p>
      </div>

      <form action={saveSmsForm} className="space-y-4">
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Detalhes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="name">Nome da campanha *</Label>
              <Input id="name" name="name" required placeholder="Ex: Black Friday 30% OFF" />
            </div>

            <SmsMessageInput />

            <div>
              <Label htmlFor="segment_id">Segmento alvo</Label>
              <select
                id="segment_id"
                name="segment_id"
                className="w-full h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm"
              >
                <option value="">— Todos os leads —</option>
                {segments.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.member_count})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="scheduled_for">Agendar (opcional)</Label>
              <Input id="scheduled_for" name="scheduled_for" type="datetime-local" />
              <p className="text-[11px] text-muted-foreground mt-1">
                Em branco = salva como rascunho
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2 justify-end">
          <Link href="/app/marketing/relacionar/sms">
            <Button type="button" variant="outline" className="border-white/20">
              Cancelar
            </Button>
          </Link>
          <Button type="submit" className="bg-[#BA0102] hover:bg-[#a10002] text-white">
            Salvar campanha
          </Button>
        </div>
      </form>
    </div>
  );
}
