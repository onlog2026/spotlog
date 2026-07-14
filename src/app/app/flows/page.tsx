import Link from "next/link";
import { Workflow, Plus, Bot } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import { listFlows, criarFluxo } from "@/lib/flows/actions";
import { DeleteFlowButton } from "@/components/flows/flow-actions";

export const dynamic = "force-dynamic";

export default async function FlowsPage() {
  await requireSession();
  let flows: Awaited<ReturnType<typeof listFlows>> = [];
  let dbReady = true;
  try {
    flows = await listFlows();
  } catch {
    dbReady = false; // tabela ainda não criada (migration pendente)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Bot className="h-6 w-6 text-brand-400" /> Robô / Construtor de Fluxos
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monte fluxos de atendimento automático (estilo Digisac): recebe no
            WhatsApp, responde, coleta dados, transfere e dispara ações.
          </p>
        </div>
        <form action={criarFluxo}>
          <Button type="submit" variant="orange" disabled={!dbReady}>
            <Plus className="h-4 w-4" /> Novo fluxo
          </Button>
        </form>
      </div>

      {!dbReady && (
        <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
          <strong>Falta 1 passo pra ligar o Robô:</strong> rode a migration{" "}
          <code>20260701130000_flow_builder.sql</code> no{" "}
          <a
            href="https://supabase.com/dashboard/project/lfvuwrpfdnyqfxjaicba/sql/new"
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-semibold"
          >
            SQL Editor do Supabase
          </a>{" "}
          (cria as tabelas <code>flows</code>). Depois recarregue esta página.
        </div>
      )}

      {dbReady && flows.length === 0 && (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Workflow className="h-10 w-10 mx-auto mb-3 opacity-50" />
            Nenhum fluxo ainda. Clique em <strong>Novo fluxo</strong> pra começar.
          </CardContent>
        </Card>
      )}

      {flows.length > 0 && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {flows.map((f) => (
            <Card key={f.id} className="border-white/10 bg-card/50">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link href={`/app/flows/${f.id}`} className="font-semibold hover:underline">
                    {f.name}
                  </Link>
                  <StatusBadge status={f.status} />
                </div>
                {f.description && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {f.description}
                  </p>
                )}
                <div className="text-[11px] text-muted-foreground mt-3 flex items-center justify-between">
                  <span>Atualizado {formatDateTime(f.updated_at)}</span>
                  <DeleteFlowButton id={f.id} />
                </div>
                <Button variant="outline" size="sm" asChild className="w-full mt-3">
                  <Link href={`/app/flows/${f.id}`}>Abrir editor</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "active") return <Badge variant="success">Ativo</Badge>;
  if (status === "paused") return <Badge variant="warning">Pausado</Badge>;
  return <Badge variant="secondary">Rascunho</Badge>;
}
