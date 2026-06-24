import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { getInvoice, getInvoiceItems } from "@/lib/queries/compliance";
import { InvoiceStatusBadge } from "@/components/compliance/badges";
import {
  cancelarFaturaAction,
  marcarFaturaPagaAction,
} from "@/app/app/compliance/actions";

export const dynamic = "force-dynamic";

function formatBRL(v: number) {
  return Number(v ?? 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDate(s: string | null) {
  if (!s) return "—";
  return new Date(s).toLocaleDateString("pt-BR");
}

export default async function FaturaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { org } = await requireSession();
  const { id } = await params;
  const invoice = await getInvoice(org.id, id);
  if (!invoice) notFound();

  const items = await getInvoiceItems(invoice.id);

  const podeMarcarPaga =
    invoice.status === "pendente" || invoice.status === "vencida";
  const podeCancelar = invoice.status !== "cancelada" && invoice.status !== "paga";

  return (
    <div className="space-y-5">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/app/compliance/financeiro" aria-label="Voltar">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Link>
          </Button>
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-mono">
              {invoice.number}
            </p>
            <h2 className="text-xl font-bold">
              {invoice.companies?.name ?? "Fatura"}
            </h2>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <InvoiceStatusBadge status={invoice.status} />
          {podeMarcarPaga && (
            <form action={marcarFaturaPagaAction}>
              <input type="hidden" name="id" value={invoice.id} />
              <Button type="submit" variant="orange" size="sm">
                <CheckCircle2 className="h-4 w-4" />
                Marcar como paga
              </Button>
            </form>
          )}
          {podeCancelar && (
            <form action={cancelarFaturaAction}>
              <input type="hidden" name="id" value={invoice.id} />
              <Button type="submit" variant="outline" size="sm">
                <XCircle className="h-4 w-4" />
                Cancelar fatura
              </Button>
            </form>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-transparent bg-card/50 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Resumo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Competência</span>
              <span>{formatDate(invoice.competence)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Vencimento</span>
              <span>{formatDate(invoice.due_date)}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span className="text-muted-foreground">Paga em</span>
              <span>{formatDate(invoice.paid_at)}</span>
            </div>
            <div className="flex justify-between gap-3 pt-2 border-t border-white/10">
              <span className="text-muted-foreground">Valor total</span>
              <span className="font-bold text-base">
                {formatBRL(Number(invoice.amount ?? 0))}
              </span>
            </div>
            {invoice.notes && (
              <div className="pt-2 border-t border-white/10">
                <p className="text-muted-foreground text-xs mb-1">
                  Observações
                </p>
                <p className="whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent bg-card/50 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Itens</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {items.length === 0 ? (
              <div className="px-6 pb-6 text-sm text-muted-foreground">
                Nenhum item nesta fatura.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                    <tr>
                      <th className="text-left py-2 px-4">Descrição</th>
                      <th className="text-left py-2 px-4">Remessa</th>
                      <th className="text-right py-2 px-4">Qtde</th>
                      <th className="text-right py-2 px-4">Preço unit.</th>
                      <th className="text-right py-2 px-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it) => (
                      <tr
                        key={it.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="py-3 px-4">{it.description}</td>
                        <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                          {it.shipments?.code ?? "—"}
                        </td>
                        <td className="py-3 px-4 text-right">{it.quantity}</td>
                        <td className="py-3 px-4 text-right">
                          {formatBRL(Number(it.unit_price ?? 0))}
                        </td>
                        <td className="py-3 px-4 text-right font-semibold">
                          {formatBRL(Number(it.total ?? 0))}
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
    </div>
  );
}
