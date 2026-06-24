import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  MapPin,
  Package,
  Ruler,
  Weight,
  Calendar,
  MessageSquarePlus,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShipmentBadge } from "@/components/operacao/status-badges";
import { requireSession } from "@/lib/auth";
import { getClienteShipmentDetail } from "@/lib/queries/cliente";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RemessaDetalhePage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  const ctx = await requireSession();
  const data = await getClienteShipmentDetail(ctx.org.id, codigo);
  if (!data) notFound();
  const { shipment: remessa, events, occurrences } = data;

  const addr = (remessa.destination_address ?? {}) as {
    street?: string;
    number?: string;
    city?: string;
    uf?: string;
    state?: string;
    cep?: string;
  };
  const cidade = `${addr.city ?? "—"}${addr.uf || addr.state ? ` - ${addr.uf ?? addr.state}` : ""}`;
  const dims = (remessa.dimensions_json ?? {}) as {
    length?: number;
    width?: number;
    height?: number;
    volumes?: number;
  };
  const dimsLabel =
    dims.length || dims.width || dims.height
      ? `${dims.length ?? "?"}x${dims.width ?? "?"}x${dims.height ?? "?"} cm`
      : "—";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <Button asChild variant="ghost" size="sm" className="-ml-3">
            <Link href="/app/cliente/remessas">
              <ArrowLeft className="h-4 w-4" />
              Voltar para remessas
            </Link>
          </Button>
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-xl font-bold font-mono">{remessa.code}</h2>
            <ShipmentBadge status={remessa.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Destino: {cidade}
            {addr.cep ? ` · CEP ${addr.cep}` : ""}
          </p>
        </div>
        <Button asChild variant="orange">
          <Link
            href={`/app/cliente/chamados/novo?remessa=${remessa.code}`}
            aria-label={`Abrir chamado sobre a remessa ${remessa.code}`}
          >
            <MessageSquarePlus className="h-4 w-4" />
            Abrir chamado sobre esta entrega
          </Link>
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-transparent bg-card/50 overflow-hidden">
          <div
            role="img"
            aria-label="Mapa de rastreamento da entrega"
            className="h-56 md:h-72 w-full bg-gradient-to-br from-navy-900 via-navy-800 to-spotorange-500/40 relative"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center text-white">
              <MapPin className="h-10 w-10 mb-2" aria-hidden="true" />
              <p className="text-sm font-semibold">
                Rastreamento ao vivo em breve
              </p>
              <p className="text-xs text-white/80">
                Última localização: {cidade}
              </p>
            </div>
          </div>
          <CardHeader>
            <CardTitle className="text-base">Linha do tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não há eventos de rastreio registrados.
              </p>
            ) : (
              <ol className="space-y-3">
                {events.map((e) => (
                  <li key={e.id} className="flex items-start gap-3">
                    <CheckCircle2
                      className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium">{e.event_type}</div>
                      {e.description && (
                        <div className="text-sm text-muted-foreground">
                          {e.description}
                        </div>
                      )}
                      <div className="text-xs text-muted-foreground">
                        {formatDateTime(e.occurred_at)}
                      </div>
                    </div>
                  </li>
                ))}
                {remessa.status !== "entregue" &&
                  remessa.status !== "devolvida" &&
                  remessa.status !== "extraviada" && (
                    <li className="flex items-start gap-3">
                      <Circle
                        className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0"
                        aria-hidden="true"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Entregue</div>
                        <div className="text-xs text-muted-foreground">Pendente</div>
                      </div>
                    </li>
                  )}
              </ol>
            )}
          </CardContent>
        </Card>

        <Card className="border-transparent bg-card/50">
          <CardHeader>
            <CardTitle className="text-base">Dados da remessa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Info icon={Package} label="Destinatário" value={remessa.recipient_name ?? "—"} />
            <Info
              icon={MapPin}
              label="Endereço"
              value={`${cidade}${addr.cep ? ` (${addr.cep})` : ""}`}
            />
            <Info
              icon={Weight}
              label="Peso"
              value={`${(remessa.weight_kg ?? 0).toFixed(2)} kg`}
            />
            <Info
              icon={Ruler}
              label="Dimensões / volumes"
              value={`${dimsLabel}${dims.volumes ? ` · ${dims.volumes} volume(s)` : ""}`}
            />
            <Info
              icon={Calendar}
              label="Criada em"
              value={formatDateTime(remessa.created_at)}
            />
            {remessa.sla_deadline && (
              <Info
                icon={Calendar}
                label="Previsão de entrega"
                value={formatDateTime(remessa.sla_deadline)}
              />
            )}
            {remessa.delivered_at && (
              <Info
                icon={CheckCircle2}
                label="Entregue em"
                value={formatDateTime(remessa.delivered_at)}
              />
            )}
            {remessa.driver?.full_name && (
              <div className="pt-2 border-t border-white/5">
                <div className="text-xs text-muted-foreground mb-1">Motorista</div>
                <p className="text-sm">{remessa.driver.full_name}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-spotorange-500" aria-hidden="true" />
            Histórico de ocorrências
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
                  <div className="text-xs text-muted-foreground">
                    {formatDateTime(o.opened_at)}
                  </div>
                  <div className="text-sm mt-1">
                    {o.description ?? "(sem descrição)"}
                  </div>
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
        <div className="text-sm font-medium">{value}</div>
      </div>
    </div>
  );
}
