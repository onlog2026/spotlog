import Link from "next/link";
import { Send, Plus, Mail, MessageCircle, ArrowRight } from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function CadenciasPage() {
  const ctx = await requireOrgModule("cadencias"); // Eixo A — neutro enquanto enforcement OFF
  const supabase = await createClient();

  const { data: sequences } = await supabase
    .from("sequences")
    .select("id, name, description, default_channel, is_active, created_at")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Cadências</h1>
          <p className="text-muted-foreground mt-1">
            Sequências automáticas de e-mail + WhatsApp + tarefas que tocam pra
            cada contato.
          </p>
        </div>
        <Button variant="orange" asChild>
          <Link href="/app/cadencias/nova">
            <Plus className="h-4 w-4" />
            Nova cadência
          </Link>
        </Button>
      </div>

      {!sequences || sequences.length === 0 ? (
        <div className="text-center py-16 max-w-md mx-auto">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
            <Send className="h-7 w-7 text-brand-400" />
          </div>
          <h3 className="font-semibold text-lg">Nenhuma cadência ainda</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Cadências são as sequências de mensagens que o agente envia
            automaticamente pra cada contato inscrito.
          </p>
          <Button variant="orange" className="mt-6" asChild>
            <Link href="/app/cadencias/nova">Criar primeira cadência</Link>
          </Button>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sequences.map((s) => {
            const sq = s as unknown as {
              id: string;
              name: string;
              description: string | null;
              default_channel: string;
              is_active: boolean;
            };
            return (
              <Card
                key={sq.id}
                className="border-white/10 bg-card/50 hover:border-white/20"
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {sq.default_channel === "whatsapp" ? (
                        <MessageCircle className="h-4 w-4 text-green-400" />
                      ) : (
                        <Mail className="h-4 w-4 text-blue-400" />
                      )}
                      <Link
                        href={`/app/cadencias/${sq.id}`}
                        className="font-semibold hover:underline"
                      >
                        {sq.name}
                      </Link>
                    </div>
                    <Badge variant={sq.is_active ? "success" : "secondary"}>
                      {sq.is_active ? "Ativa" : "Pausada"}
                    </Badge>
                  </div>
                  {sq.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {sq.description}
                    </p>
                  )}
                  <Link
                    href={`/app/cadencias/${sq.id}`}
                    className="text-xs text-brand-400 flex items-center gap-1 hover:underline"
                  >
                    Configurar passos <ArrowRight className="h-3 w-3" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
