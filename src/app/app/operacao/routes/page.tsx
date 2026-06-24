import Link from "next/link";
import { ArrowRight, Route as RouteIcon, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { requireSession } from "@/lib/auth";
import { listRoutes } from "@/lib/queries/operacao";
import { RouteBadge } from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUSES = ["planejada", "em_andamento", "concluida", "cancelada"];

export default async function RoutesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireSession();
  const sp = await searchParams;
  const status = sp.status ?? "";
  const rows = await listRoutes(ctx.org.id, { status: status || undefined });

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Rotas</h2>
          <p className="text-sm text-muted-foreground">
            {rows.length} rotas listadas
          </p>
        </div>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
            <div>
              <Label htmlFor="status" className="text-xs">Status</Label>
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
            <Button type="submit" variant="default">
              <Filter className="h-4 w-4" />
              Aplicar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-0">
          {rows.length === 0 ? (
            <EmptyState
              icon={RouteIcon}
              title="Nenhuma rota encontrada"
              description="Crie uma rota para iniciar as entregas."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Código</th>
                    <th className="text-left py-2 px-4">Motorista</th>
                    <th className="text-left py-2 px-4">Veículo</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Paradas</th>
                    <th className="text-left py-2 px-4">Iniciada em</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 px-4 font-mono text-xs">{r.code ?? r.id.slice(0, 8)}</td>
                      <td className="py-3 px-4">{r.driver?.full_name ?? "—"}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {r.vehicle?.plate ?? "—"}
                        {r.vehicle?.model ? ` · ${r.vehicle.model}` : ""}
                      </td>
                      <td className="py-3 px-4">
                        <RouteBadge status={r.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{r.total_stops ?? 0}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {r.started_at ? formatDateTime(r.started_at) : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/app/operacao/routes/${r.id}`}
                            aria-label={`Ver rota ${r.code ?? r.id}`}
                          >
                            Detalhes
                            <ArrowRight className="h-3 w-3" />
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
