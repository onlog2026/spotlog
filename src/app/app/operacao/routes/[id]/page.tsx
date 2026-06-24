import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Truck, User, CheckCircle2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { getRouteDetail } from "@/lib/queries/operacao";
import {
  RouteBadge,
  StopBadge,
} from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { formatDateTime } from "@/lib/utils";
import { concluirRota } from "../actions";

export const dynamic = "force-dynamic";

export default async function RouteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireSession();
  const data = await getRouteDetail(ctx.org.id, id);
  if (!data) notFound();
  const { route, stops } = data;

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/app/operacao/routes">
              <ArrowLeft className="h-4 w-4" />
              Voltar para rotas
            </Link>
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold font-mono">{route.code ?? route.id.slice(0, 8)}</h2>
            <RouteBadge status={route.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {stops.length} parada(s){route.started_at ? ` · iniciada em ${formatDateTime(route.started_at)}` : ""}
          </p>
        </div>
        {route.status !== "concluida" && route.status !== "cancelada" && (
          <form action={concluirRota}>
            <input type="hidden" name="route_id" value={route.id} />
            <Button type="submit" variant="orange">
              <CheckCircle2 className="h-4 w-4" />
              Concluir rota
            </Button>
          </form>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="border-transparent bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-spotorange-500" aria-hidden />
              Motorista
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{route.driver?.full_name ?? "—"}</div>
            {route.driver?.phone && (
              <div className="text-muted-foreground">{route.driver.phone}</div>
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Truck className="h-4 w-4 text-spotorange-500" aria-hidden />
              Veículo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <div className="font-medium">{route.vehicle?.plate ?? "—"}</div>
            <div className="text-muted-foreground">
              {[route.vehicle?.model, route.vehicle?.type].filter(Boolean).join(" · ") || "—"}
            </div>
          </CardContent>
        </Card>

        <Card className="border-transparent bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Status</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Total de paradas: <span className="font-medium">{route.total_stops ?? stops.length}</span></div>
            {route.ended_at && (
              <div className="text-muted-foreground">Finalizada em {formatDateTime(route.ended_at)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="h-4 w-4 text-spotorange-500" aria-hidden />
            Paradas
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {stops.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="Nenhuma parada cadastrada"
              description="Adicione paradas a esta rota para começar."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">#</th>
                    <th className="text-left py-2 px-4">Remessa</th>
                    <th className="text-left py-2 px-4">Destinatário</th>
                    <th className="text-left py-2 px-4">Endereço</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">ETA</th>
                  </tr>
                </thead>
                <tbody>
                  {stops.map((s) => {
                    const addr = (s.shipment?.destination_address ?? {}) as {
                      street?: string;
                      number?: string;
                      city?: string;
                      uf?: string;
                      state?: string;
                    };
                    return (
                      <tr key={s.id} className="border-b border-white/5 last:border-0">
                        <td className="py-3 px-4 font-medium">{s.sequence}</td>
                        <td className="py-3 px-4 font-mono text-xs">
                          {s.shipment && (
                            <Link
                              href={`/app/operacao/shipments/${s.shipment.id}`}
                              className="underline-offset-2 hover:underline"
                            >
                              {s.shipment.code}
                            </Link>
                          )}
                        </td>
                        <td className="py-3 px-4">{s.shipment?.recipient_name ?? "—"}</td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {[
                            [addr.street, addr.number].filter(Boolean).join(", "),
                            [addr.city, addr.uf ?? addr.state].filter(Boolean).join(" - "),
                          ]
                            .filter(Boolean)
                            .join(" · ") || "—"}
                        </td>
                        <td className="py-3 px-4">
                          <StopBadge status={s.status} />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {s.eta ? formatDateTime(s.eta) : "—"}
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
