import Link from "next/link";
import { ArrowRight, Filter, Plus, Search, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShipmentBadge } from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { requireOrgModule } from "@/lib/entitlements";
import { getClienteShipments } from "@/lib/queries/cliente";
import { formatDate } from "@/lib/utils";
import type { ShipmentStatus } from "@/lib/types/operacao";

export const dynamic = "force-dynamic";

const STATUSES: ShipmentStatus[] = [
  "criada",
  "coletada",
  "triagem",
  "em_rota",
  "saiu_entrega",
  "entregue",
  "devolvida",
  "extraviada",
];

export default async function RemessasListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const ctx = await requireOrgModule("cliente_remessas"); // Eixo A — neutro enquanto enforcement OFF
  const sp = await searchParams;
  const status = (sp.status ?? "") as ShipmentStatus | "";
  const q = sp.q ?? "";
  const remessas = await getClienteShipments(ctx.org.id, { status, q });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Remessas</h2>
          <p className="text-sm text-muted-foreground">
            {remessas.length} remessas encontradas
          </p>
        </div>
        <Button asChild variant="orange">
          <Link href="/app/cliente/coleta/nova">
            <Plus className="h-4 w-4" />
            Nova remessa
          </Link>
        </Button>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form
            className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end"
            aria-label="Filtros de remessas"
          >
            <div className="md:col-span-2">
              <Label htmlFor="busca" className="text-xs">
                Código ou destinatário
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="busca"
                  name="q"
                  defaultValue={q}
                  placeholder="SPL00012845..."
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="status" className="text-xs">
                Status
              </Label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="default" className="md:col-span-2">
              <Filter className="h-4 w-4" />
              Aplicar filtros
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-0">
          {remessas.length === 0 ? (
            <EmptyState
              icon={Package}
              title="Nenhuma remessa encontrada"
              description="Tente ajustar os filtros ou solicite uma coleta para começar."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Código</th>
                    <th className="text-left py-2 px-4">Destinatário</th>
                    <th className="text-left py-2 px-4">Cidade/UF</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Criada em</th>
                    <th className="text-left py-2 px-4">Prazo</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {remessas.map((r) => {
                    const addr = (r.destination_address ?? {}) as {
                      city?: string;
                      uf?: string;
                      state?: string;
                    };
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="py-3 px-4 font-mono text-xs">{r.code}</td>
                        <td className="py-3 px-4">{r.recipient_name ?? "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {addr.city ?? "—"}
                          {addr.uf || addr.state ? ` - ${addr.uf ?? addr.state}` : ""}
                        </td>
                        <td className="py-3 px-4">
                          <ShipmentBadge status={r.status} />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {formatDate(r.created_at)}
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {r.sla_deadline ? formatDate(r.sla_deadline) : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/app/cliente/remessas/${r.code}`}
                              aria-label={`Ver detalhes da remessa ${r.code}`}
                            >
                              Detalhes
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
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
