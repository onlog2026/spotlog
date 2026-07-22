import Link from "next/link";
import { FileText, Plus, ArrowRight, Sparkles } from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; v: string }> = {
  draft: { label: "Rascunho", v: "outline" },
  sent: { label: "Enviada", v: "default" },
  viewed: { label: "Visualizada", v: "warning" },
  accepted: { label: "Aceita", v: "success" },
  rejected: { label: "Recusada", v: "destructive" },
  expired: { label: "Expirada", v: "secondary" },
};

export default async function PropostasPage() {
  const ctx = await requireOrgModule("propostas"); // Eixo A — neutro enquanto enforcement OFF
  const supabase = await createClient();
  const { data: proposals } = await supabase
    .from("proposals")
    .select("id, number, title, status, total, currency, created_at, sent_at")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Propostas</h1>
          <p className="text-muted-foreground mt-1">
            Geradas a partir das suas tabelas de preço. Link de aceite digital.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/propostas/tabelas">Tabelas de preço</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/propostas/modelos">Modelos</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/propostas/nova-ia">
              <Sparkles className="h-4 w-4" />
              Nova com IA
            </Link>
          </Button>
          <Button variant="orange" asChild>
            <Link href="/app/propostas/nova">
              <Plus className="h-4 w-4" />
              Nova proposta
            </Link>
          </Button>
        </div>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-0">
          {!proposals || proposals.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
                <FileText className="h-7 w-7 text-brand-400" />
              </div>
              <h3 className="font-semibold text-lg">Nenhuma proposta</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Suba sua tabela de preço primeiro (em Excel), depois gere
                propostas em segundos.
              </p>
              <div className="mt-6 flex gap-2 justify-center">
                <Button variant="outline" asChild>
                  <Link href="/app/propostas/tabelas">Subir tabela</Link>
                </Button>
                <Button variant="orange" asChild>
                  <Link href="/app/propostas/nova">Criar proposta</Link>
                </Button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">#</th>
                    <th className="text-left p-4">Título</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4 hidden md:table-cell">Valor</th>
                    <th className="text-left p-4 hidden lg:table-cell">Criada</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {proposals.map((p) => {
                    const pr = p as unknown as {
                      id: string;
                      number: number;
                      title: string;
                      status: string;
                      total: number;
                      currency: string;
                      created_at: string;
                    };
                    const st = STATUS[pr.status] ?? STATUS.draft;
                    return (
                      <tr
                        key={pr.id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="p-4 text-xs text-muted-foreground">
                          #{pr.number}
                        </td>
                        <td className="p-4 font-medium">{pr.title}</td>
                        <td className="p-4">
                          <Badge
                            variant={
                              st.v as
                                | "default"
                                | "secondary"
                                | "outline"
                                | "success"
                                | "warning"
                                | "destructive"
                            }
                          >
                            {st.label}
                          </Badge>
                        </td>
                        <td className="p-4 hidden md:table-cell font-semibold">
                          {formatCurrency(Number(pr.total), pr.currency)}
                        </td>
                        <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {formatDateTime(pr.created_at)}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/app/propostas/${pr.id}`}
                            className="text-brand-400 hover:underline text-xs flex items-center gap-1"
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
