import Link from "next/link";
import { Bot, Plus, Play, Pause, ArrowRight } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export const dynamic = "force-dynamic";

export default async function ProspeccaoPage() {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { data: campaigns } = await supabase
    .from("prospecting_campaigns")
    .select(
      "id, name, status, found_count, total_target, daily_limit, sources, created_at",
    )
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Prospecção</h1>
          <p className="text-muted-foreground mt-1">
            Campanhas que o agente SDR roda buscando leads que batem com seu
            ICP.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/app/prospeccao/nova">
            <Plus className="h-4 w-4" />
            Nova campanha
          </Link>
        </Button>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <EmptyCampaigns />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((c) => {
            const ca = c as unknown as {
              id: string;
              name: string;
              status: string;
              found_count: number;
              total_target: number;
              daily_limit: number;
              sources: string[];
              created_at: string;
            };
            const pct = Math.min(
              100,
              Math.round((ca.found_count / Math.max(1, ca.total_target)) * 100),
            );
            return (
              <Card
                key={ca.id}
                className="border-white/10 bg-card/50 hover:border-white/20 transition"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-brand">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <Link
                          href={`/app/prospeccao/${ca.id}`}
                          className="font-semibold hover:underline"
                        >
                          {ca.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {ca.sources?.join(" · ")}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={ca.status} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>
                        {ca.found_count} / {ca.total_target} leads
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {ca.daily_limit}/dia
                    </span>
                    <Link
                      href={`/app/prospeccao/${ca.id}`}
                      className="text-brand-400 flex items-center gap-1 hover:underline"
                    >
                      Detalhes <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function EmptyCampaigns() {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
        <Bot className="h-7 w-7 text-brand-400" />
      </div>
      <h3 className="font-semibold text-lg">Nenhuma campanha</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Crie sua primeira campanha definindo seu perfil de cliente ideal (ICP).
        O agente busca, enriquece e (se você ativar) já enfileira na cadência.
      </p>
      <Button variant="gradient" className="mt-6" asChild>
        <Link href="/app/prospeccao/nova">Criar primeira campanha</Link>
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "running")
    return (
      <Badge variant="success">
        <Play className="h-2.5 w-2.5 mr-1" /> Rodando
      </Badge>
    );
  if (status === "paused")
    return (
      <Badge variant="warning">
        <Pause className="h-2.5 w-2.5 mr-1" /> Pausada
      </Badge>
    );
  if (status === "completed") return <Badge variant="secondary">Concluída</Badge>;
  if (status === "error") return <Badge variant="destructive">Erro</Badge>;
  return <Badge variant="outline">Rascunho</Badge>;
}
