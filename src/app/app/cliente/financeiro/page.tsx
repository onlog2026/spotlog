import { Download, Wallet, Calendar, TrendingUp, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/operacao/empty-state";
import { requireSession } from "@/lib/auth";
import { getClienteInvoices } from "@/lib/queries/cliente";
import { formatCurrency, formatDate } from "@/lib/utils";
import { cn } from "@/lib/utils";
import type { InvoiceStatus } from "@/lib/types/operacao";

export const dynamic = "force-dynamic";

const INVOICE_BADGE: Record<InvoiceStatus, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-amber-500/15 text-amber-700 dark:text-amber-300" },
  paga: { label: "Paga", className: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300" },
  vencida: { label: "Vencida", className: "bg-spotorange-500/15 text-spotorange-500" },
  cancelada: { label: "Cancelada", className: "bg-slate-500/15 text-slate-700 dark:text-slate-300" },
};

function InvoiceBadge({ status }: { status: InvoiceStatus }) {
  const v = INVOICE_BADGE[status];
  return (
    <Badge variant="outline" className={cn("border-transparent font-medium", v.className)}>
      {v.label}
    </Badge>
  );
}

export default async function FinanceiroPage() {
  const ctx = await requireSession();
  const faturas = await getClienteInvoices(ctx.org.id);

  const emAberto = faturas
    .filter((f) => f.status !== "paga" && f.status !== "cancelada")
    .reduce((acc, f) => acc + Number(f.amount ?? 0), 0);
  const proximoVenc = faturas
    .filter((f) => f.status === "pendente" && f.due_date)
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))[0];
  const hoje = new Date();
  const mesAtualKey = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
  const mesAtual = faturas.find(
    (f) => f.competence && f.competence.startsWith(mesAtualKey),
  );

  const cards = [
    {
      label: "Valor em aberto",
      value: formatCurrency(emAberto),
      icon: Wallet,
      tint: "bg-spotorange-500/15 text-spotorange-500",
    },
    {
      label: "Próximo vencimento",
      value: proximoVenc?.due_date ? formatDate(proximoVenc.due_date) : "—",
      icon: Calendar,
      tint: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    {
      label: "Mês atual",
      value: mesAtual ? formatCurrency(Number(mesAtual.amount ?? 0)) : "—",
      icon: TrendingUp,
      tint: "bg-navy-900/10 text-navy-900 dark:text-white",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-bold">Financeiro</h2>
        <p className="text-sm text-muted-foreground">
          Faturas e histórico de pagamentos
        </p>
      </div>

      <section
        aria-label="Resumo financeiro"
        className="grid sm:grid-cols-3 gap-3"
      >
        {cards.map((c) => (
          <Card
            key={c.label}
            className="border-transparent bg-card/50 hover:border-spotorange-500 transition"
          >
            <CardContent className="p-5">
              <div
                className={`inline-flex h-10 w-10 items-center justify-center rounded-lg mb-3 ${c.tint}`}
              >
                <c.icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold">{c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {c.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Histórico de faturas</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {faturas.length === 0 ? (
            <EmptyState
              icon={Receipt}
              title="Nenhuma fatura ainda"
              description="As faturas serão geradas conforme as remessas forem entregues."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Identificador</th>
                    <th className="text-left py-2 px-4">Competência</th>
                    <th className="text-left py-2 px-4">Vencimento</th>
                    <th className="text-right py-2 px-4">Valor</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {faturas.map((f) => (
                    <tr
                      key={f.id}
                      className="border-b border-white/5 last:border-0"
                    >
                      <td className="py-3 px-4 font-mono text-xs">{f.number}</td>
                      <td className="py-3 px-4">
                        {f.competence ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {f.due_date ? formatDate(f.due_date) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatCurrency(Number(f.amount ?? 0))}
                      </td>
                      <td className="py-3 px-4">
                        <InvoiceBadge status={f.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        {f.pdf_url ? (
                          <Button asChild variant="ghost" size="sm">
                            <a
                              href={f.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Baixar PDF da fatura ${f.number}`}
                            >
                              <Download className="h-3 w-3" />
                              PDF
                            </a>
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
