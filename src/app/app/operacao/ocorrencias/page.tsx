import Link from "next/link";
import { AlertTriangle, Filter, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { requireSession } from "@/lib/auth";
import { listOccurrences } from "@/lib/queries/operacao";
import {
  CategoryBadge,
  OccurrenceStatusBadge,
  SeverityBadge,
} from "@/components/operacao/status-badges";
import { EmptyState } from "@/components/operacao/empty-state";
import { formatDateTime } from "@/lib/utils";
import type {
  OccurrenceSeverity,
  OccurrenceStatus,
} from "@/lib/types/operacao";
import { OcorrenciaResolver } from "@/components/operacao/ocorrencia-resolver";
import { criarOcorrencia } from "./actions";

export const dynamic = "force-dynamic";

const STATUSES: OccurrenceStatus[] = ["aberta", "em_analise", "resolvida", "cancelada"];
const SEVERITIES: OccurrenceSeverity[] = ["baixa", "media", "alta", "critica"];

export default async function OcorrenciasPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; severity?: string; ok?: string }>;
}) {
  const ctx = await requireSession();
  const sp = await searchParams;
  const status = (sp.status ?? "") as OccurrenceStatus | "";
  const severity = (sp.severity ?? "") as OccurrenceSeverity | "";
  const rows = await listOccurrences(ctx.org.id, { status, severity });

  return (
    <div className="space-y-5">
      {sp.ok === "created" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Ocorrência registrada com sucesso.
        </div>
      )}
      <div>
        <h2 className="text-xl font-bold">Ocorrências</h2>
        <p className="text-sm text-muted-foreground">
          {rows.length} ocorrências encontradas
        </p>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form
            action={criarOcorrencia}
            className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end"
            aria-label="Registrar nova ocorrência"
          >
            <div>
              <Label htmlFor="shipment_id" className="text-xs">Remessa (ID, opcional)</Label>
              <Input id="shipment_id" name="shipment_id" placeholder="UUID da remessa" />
            </div>
            <div>
              <Label htmlFor="category" className="text-xs">Categoria</Label>
              <select
                id="category"
                name="category"
                defaultValue="atraso"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="atraso">Atraso</option>
                <option value="extravio">Extravio</option>
                <option value="avaria">Avaria</option>
                <option value="endereco_invalido">Endereço inválido</option>
                <option value="recusa">Recusa</option>
                <option value="outro">Outro</option>
              </select>
            </div>
            <div>
              <Label htmlFor="severity_new" className="text-xs">Severidade</Label>
              <select
                id="severity_new"
                name="severity"
                defaultValue="media"
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <Label htmlFor="description" className="text-xs">Descrição</Label>
              <Textarea id="description" name="description" rows={2} placeholder="O que aconteceu?" required />
            </div>
            <Button type="submit" variant="orange" className="md:col-span-4 md:max-w-[220px]">
              <Plus className="h-4 w-4" />
              Registrar ocorrência
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
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
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="severity" className="text-xs">Severidade</Label>
              <select
                id="severity"
                name="severity"
                defaultValue={severity}
                className="flex h-11 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="">Todas</option>
                {SEVERITIES.map((s) => (
                  <option key={s} value={s}>{s}</option>
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
              icon={AlertTriangle}
              title="Nenhuma ocorrência encontrada"
              description="Quando surgir algum problema com remessas, ele aparece aqui."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Remessa</th>
                    <th className="text-left py-2 px-4">Categoria</th>
                    <th className="text-left py-2 px-4">Severidade</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Aberta em</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => (
                    <tr key={o.id} className="border-b border-white/5 last:border-0">
                      <td className="py-3 px-4 font-mono text-xs">
                        {o.shipment ? (
                          <Link
                            href={`/app/operacao/shipments/${o.shipment.id}`}
                            className="underline-offset-2 hover:underline"
                          >
                            {o.shipment.code}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <CategoryBadge category={o.category} />
                      </td>
                      <td className="py-3 px-4">
                        <SeverityBadge severity={o.severity} />
                      </td>
                      <td className="py-3 px-4">
                        <OccurrenceStatusBadge status={o.status} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDateTime(o.opened_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <OcorrenciaResolver
                          id={o.id}
                          shipmentCode={o.shipment?.code ?? null}
                          category={o.category}
                          description={o.description}
                          status={o.status}
                        />
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
