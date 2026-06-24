import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Package,
  User,
  Truck,
  AlertTriangle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSession } from "@/lib/auth";
import {
  getShipmentDetail,
  getShipmentOccurrences,
  getShipmentTrackingEvents,
} from "@/lib/queries/operacao";
import {
  ShipmentBadge,
  SeverityBadge,
  OccurrenceStatusBadge,
  CategoryBadge,
} from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { formatDateTime } from "@/lib/utils";
import { addTrackingEvent, markShipmentDelivered } from "../actions";

export const dynamic = "force-dynamic";

export default async function ShipmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireSession();
  const shipment = await getShipmentDetail(ctx.org.id, id);
  if (!shipment) notFound();

  const [events, occurrences] = await Promise.all([
    getShipmentTrackingEvents(shipment.id),
    getShipmentOccurrences(shipment.id),
  ]);

  const addr = (shipment.destination_address ?? {}) as {
    street?: string;
    number?: string;
    district?: string;
    city?: string;
    uf?: string;
    state?: string;
    cep?: string;
  };
  const cidade = `${addr.city ?? ""}${addr.uf || addr.state ? ` - ${addr.uf ?? addr.state}` : ""}`;
  const isDelivered = shipment.status === "entregue";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/app/operacao/shipments">
              <ArrowLeft className="h-4 w-4" />
              Voltar para remessas
            </Link>
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold font-mono">{shipment.code}</h2>
            <ShipmentBadge status={shipment.status} />
          </div>
          {cidade.trim() && (
            <p className="text-sm text-muted-foreground">Destino: {cidade}</p>
          )}
        </div>
        {!isDelivered && (
          <form action={markShipmentDelivered}>
            <input type="hidden" name="shipment_id" value={shipment.id} />
            <Button type="submit" variant="orange">
              <CheckCircle2 className="h-4 w-4" />
              Marcar como entregue
            </Button>
          </form>
        )}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-transparent bg-card/50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
              Linha do tempo
            </CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="Sem eventos registrados"
                description="Adicione o primeiro evento de rastreio abaixo."
              />
            ) : (
              <ol className="space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <CheckCircle2
                      className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {e.event_type}
                      </div>
                      {e.description && (
                        <div className="text-sm text-muted-foreground">
                          {e.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatDateTime(e.occurred_at)}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}

            <form
              action={addTrackingEvent}
              className="mt-6 space-y-3 border-t border-white/5 pt-4"
              aria-label="Adicionar evento de rastreio"
            >
              <input type="hidden" name="shipment_id" value={shipment.id} />
              <div className="grid md:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="event_type">Tipo do evento</Label>
                  <Input
                    id="event_type"
                    name="event_type"
                    placeholder="em_rota, triagem, tentativa..."
                    required
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="city">Cidade (opcional)</Label>
                  <Input
                    id="city"
                    name="city"
                    placeholder="São Paulo"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  name="description"
                  rows={2}
                  placeholder="Observações sobre o evento"
                />
              </div>
              <div className="flex justify-end">
                <Button type="submit" variant="default" size="sm">
                  Adicionar evento
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="border-transparent bg-card/50">
            <CardHeader>
              <CardTitle className="text-base">Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Info icon={Package} label="Destinatário" value={shipment.recipient_name ?? "—"} />
              <Info
                icon={Package}
                label="Endereço"
                value={
                  [
                    [addr.street, addr.number].filter(Boolean).join(", "),
                    addr.district,
                    cidade,
                    addr.cep,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"
                }
              />
              <Info
                icon={Package}
                label="Peso / valor"
                value={`${shipment.weight_kg ?? 0} kg · R$ ${(shipment.declared_value ?? 0).toFixed(2)}`}
              />
              {shipment.sla_deadline && (
                <Info
                  icon={Clock}
                  label="Prazo SLA"
                  value={formatDateTime(shipment.sla_deadline)}
                />
              )}
              {shipment.delivered_at && (
                <Info
                  icon={CheckCircle2}
                  label="Entregue em"
                  value={formatDateTime(shipment.delivered_at)}
                />
              )}
            </CardContent>
          </Card>

          {(shipment.driver || shipment.route) && (
            <Card className="border-transparent bg-card/50">
              <CardHeader>
                <CardTitle className="text-base">Atribuição</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {shipment.driver && (
                  <Info
                    icon={User}
                    label="Motorista"
                    value={`${shipment.driver.full_name}${shipment.driver.phone ? ` · ${shipment.driver.phone}` : ""}`}
                  />
                )}
                {shipment.route && (
                  <div className="flex items-start gap-3">
                    <Truck className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden />
                    <div className="flex-1">
                      <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        Rota
                      </div>
                      <Link
                        href={`/app/operacao/routes/${shipment.route.id}`}
                        className="text-sm font-medium underline-offset-2 hover:underline"
                      >
                        {shipment.route.code ?? shipment.route.id.slice(0, 8)}
                      </Link>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
            Ocorrências
          </CardTitle>
        </CardHeader>
        <CardContent>
          {occurrences.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma ocorrência registrada nesta remessa.
            </p>
          ) : (
            <ul className="space-y-3">
              {occurrences.map((o) => (
                <li
                  key={o.id}
                  className="rounded-lg border border-spotorange-500/30 bg-spotorange-500/5 p-3"
                >
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={o.category} />
                      <SeverityBadge severity={o.severity} />
                      <OccurrenceStatusBadge status={o.status} />
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {formatDateTime(o.opened_at)}
                    </span>
                  </div>
                  <p className="text-sm mt-2">{o.description ?? "(sem descrição)"}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden />
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-medium break-words">{value}</div>
      </div>
    </div>
  );
}
