import Link from "next/link";
import { ArrowRight, CheckCircle2, Clock, DollarSign, TrendingDown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import {
  getFinanceiroKpis,
  listCompaniesForSelect,
  listInvoices,
  listShipmentsForSelect,
} from "@/lib/queries/compliance";
import {
  InvoiceStatusBadge,
  INVOICE_STATUS_OPTIONS,
} from "@/components/compliance/badges";
import { NovaFaturaForm } from "@/components/compliance/nova-fatura-form";
import type { InvoiceStatus } from "@/lib/types/operacao";

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

export default async function FinanceiroPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; desde?: string; ate?: string }>;
}) {
  const { org } = await requireSession();
  const params = await searchParams;
  const status = (params.status ?? "todas") as InvoiceStatus | "todas";
  const desde = params.desde ?? null;
  const ate = params.ate ?? null;

  const [kpis, invoices, companies, shipments] = await Promise.all([
    getFinanceiroKpis(org.id),
    listInvoices(org.id, { status, desde, ate }),
    listCompaniesForSelect(org.id),
    listShipmentsForSelect(org.id),
  ]);

  const cards = [
    {
      label: "Faturado no mês",
      value: formatBRL(kpis.faturadoMes),
      icon: DollarSign,
      tint: "bg-navy-900/10 text-navy-900 dark:text-white",
    },
    {
      label: "Recebido no mês",
      value: formatBRL(kpis.recebidoMes),
      icon: CheckCircle2,
      tint: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Em aberto",
      value: formatBRL(kpis.emAberto),
      icon: Clock,
      tint: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
    },
    {
      label: "Vencido",
      value: formatBRL(kpis.vencido),
      icon: TrendingDown,
      tint: "bg-red-500/15 text-red-700 dark:text-red-300",
    },
  ];

  return (
    <div className="space-y-5">
      <section
        aria-label="Indicadores financeiros"
        className="grid grid-cols-2 lg:grid-cols-4 gap-3"
      >
        {cards.map((c) => (
          <Card
            key={c.label}
            className="border-transparent bg-card/50 hover:border-spotorange-500 transition"
          >
            <CardContent className="p-4">
              <div
                className={`inline-flex h-9 w-9 items-center justify-center rounded-lg mb-3 ${c.tint}`}
              >
                <c.icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <div className="text-xl font-bold leading-tight">{c.value}</div>
              <div className="text-[11px] text-muted-foreground mt-1">
                {c.label}
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Faturas</h2>
        <NovaFaturaForm companies={companies} shipments={shipments} />
      </div>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form
            method="get"
            className="grid grid-cols-1 md:grid-cols-4 gap-3"
            aria-label="Filtros de faturas"
          >
            <div>
              <label htmlFor="status" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="todas">Todas</option>
                {INVOICE_STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="desde" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Vencimento de
              </label>
              <input
                id="desde"
                name="desde"
                type="date"
                defaultValue={desde ?? ""}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div>
              <label htmlFor="ate" className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                Vencimento até
              </label>
              <input
                id="ate"
                name="ate"
                type="date"
                defaultValue={ate ?? ""}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              />
            </div>
            <div className="flex items-end">
              <Button type="submit" variant="orange" size="sm">
                Aplicar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhuma fatura encontrada.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Número</th>
                    <th className="text-left py-2 px-4">Empresa</th>
                    <th className="text-left py-2 px-4">Competência</th>
                    <th className="text-left py-2 px-4">Vencimento</th>
                    <th className="text-right py-2 px-4">Valor</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr
                      key={inv.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                    >
                      <td className="py-3 px-4 font-mono text-xs">
                        {inv.number}
                      </td>
                      <td className="py-3 px-4">
                        {inv.companies?.name ?? "—"}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(inv.competence)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDate(inv.due_date)}
                      </td>
                      <td className="py-3 px-4 text-right font-semibold">
                        {formatBRL(Number(inv.amount ?? 0))}
                      </td>
                      <td className="py-3 px-4">
                        <InvoiceStatusBadge status={inv.status} />
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/app/compliance/financeiro/${inv.id}`}
                            aria-label={`Ver fatura ${inv.number}`}
                          >
                            Ver <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
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
