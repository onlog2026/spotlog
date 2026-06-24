import Link from "next/link";
import { ArrowLeft, Bot, Sparkles, ExternalLink } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/utils";
import { getCampaign, listResults } from "@/lib/queries/prospeccao";
import {
  DeleteCampaignButton,
  RerunCampaignButton,
} from "@/components/prospeccao/campaign-actions";
import {
  ConvertOneButton,
  ConvertAllButton,
  DiscardOneButton,
} from "@/components/prospeccao/result-row-actions";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const campaign = await getCampaign(ctx.org.id, id);
  if (!campaign) notFound();
  const results = await listResults(ctx.org.id, id);

  const icp = (campaign.icp as Record<string, unknown> | null) ?? {};
  const tipo =
    ((icp as { type?: string }).type ?? campaign.sources?.[0] ?? "—") as string;

  const pct = Math.min(
    100,
    Math.round(
      (campaign.found_count / Math.max(1, campaign.total_target)) * 100,
    ),
  );

  // CNPJs pra continuar no SDR (apenas pra cnpj_list)
  const cnpjList: string[] = Array.isArray(
    (icp as { cnpjs?: unknown }).cnpjs,
  )
    ? ((icp as { cnpjs: unknown[] }).cnpjs as string[])
    : [];
  const sdrUrl =
    tipo === "cnpj_list" && cnpjList.length > 0
      ? `/app/sdr/enriquecer?cnpjs=${encodeURIComponent(cnpjList.join(","))}`
      : "/app/sdr/enriquecer";

  const newCount = results.filter((r) => r.status === "new").length;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/prospeccao"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Campanhas
        </Link>
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-lg bg-gradient-brand">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold truncate">
                {campaign.name}
              </h1>
              <p className="text-xs text-muted-foreground">
                {labelTipo(tipo)} · criada em{" "}
                {formatDateTime(campaign.created_at)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={campaign.status} />
            <RerunCampaignButton id={campaign.id} />
            <DeleteCampaignButton id={campaign.id} />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle>Progresso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end justify-between mb-2">
              <span className="text-3xl font-bold text-gradient">
                {campaign.found_count}
              </span>
              <span className="text-sm text-muted-foreground">
                de {campaign.total_target} alvo · {pct}%
              </span>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Stat label="Tipo" value={labelTipo(tipo)} />
              <Stat label="Status" value={campaign.status} />
              <Stat
                label="Resultados novos"
                value={`${newCount}`}
              />
              <Stat
                label="Convertidos"
                value={`${
                  results.filter((r) => r.status === "converted").length
                }`}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-brand-400" />
              Persona do agente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap min-h-[60px]">
              {campaign.ai_persona || "Sem persona definida."}
            </p>
            <Button variant="outline" size="sm" asChild className="w-full">
              <Link href={sdrUrl}>
                <ExternalLink className="h-3 w-3" />
                Continuar no enriquecimento SDR
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle>Resultados ({results.length})</CardTitle>
            {newCount > 0 && <ConvertAllButton campaignId={campaign.id} />}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {results.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              {campaign.status === "running"
                ? "Em processamento… atualize em alguns segundos."
                : "Nenhum resultado. Verifique os dados de entrada e reexecute."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Match</th>
                    <th className="text-left p-3">Empresa</th>
                    <th className="text-left p-3 hidden md:table-cell">CNPJ</th>
                    <th className="text-left p-3 hidden lg:table-cell">
                      Cidade/UF
                    </th>
                    <th className="text-left p-3 hidden lg:table-cell">
                      Contato
                    </th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-right p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const cd = (r.company_data ?? {}) as Record<string, string>;
                    const pd = (r.contact_data ?? null) as Record<
                      string,
                      string
                    > | null;
                    return (
                      <tr
                        key={r.id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="p-3">
                          <div className="text-xs font-semibold text-emerald-400">
                            {r.match_score ?? 0}%
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {cd?.name ?? "—"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {cd?.industry ?? ""}
                          </div>
                        </td>
                        <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">
                          {cd?.cnpj ?? "—"}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {[cd?.city, cd?.state].filter(Boolean).join(" / ") ||
                            "—"}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {pd?.full_name ?? pd?.email ?? "—"}
                        </td>
                        <td className="p-3">
                          <ResultStatusBadge status={r.status} />
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {r.status === "new" && (
                              <>
                                <ConvertOneButton resultId={r.id} />
                                <DiscardOneButton resultId={r.id} />
                              </>
                            )}
                          </div>
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase text-muted-foreground tracking-wide">
        {label}
      </div>
      <div className="text-sm font-medium mt-0.5 truncate">{value}</div>
    </div>
  );
}

function labelTipo(t: string): string {
  if (t === "cnpj_list") return "Lista de CNPJs";
  if (t === "segmento") return "Segmento";
  if (t === "domain_list") return "Domínios";
  return t;
}

function StatusBadge({ status }: { status: string }) {
  if (status === "running") return <Badge variant="success">Rodando</Badge>;
  if (status === "completed")
    return <Badge variant="secondary">Concluída</Badge>;
  if (status === "error") return <Badge variant="destructive">Erro</Badge>;
  if (status === "paused") return <Badge variant="warning">Pausada</Badge>;
  return <Badge variant="outline">Rascunho</Badge>;
}

function ResultStatusBadge({ status }: { status: string }) {
  if (status === "converted")
    return (
      <Badge variant="success" className="text-[10px]">
        Convertido
      </Badge>
    );
  if (status === "discarded")
    return (
      <Badge variant="outline" className="text-[10px]">
        Descartado
      </Badge>
    );
  return (
    <Badge variant="secondary" className="text-[10px]">
      Novo
    </Badge>
  );
}
