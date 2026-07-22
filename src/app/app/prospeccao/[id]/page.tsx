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
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DeleteCampaignButton,
  RerunCampaignButton,
  EnrichCampaignButton,
  RunAllButton,
  DeepSearchButton,
  AutoCollect,
  PauseResumeCampaignButton,
} from "@/components/prospeccao/campaign-actions";
import {
  ConvertOneButton,
  ConvertAllButton,
  DiscardOneButton,
  InformarCnpjButton,
} from "@/components/prospeccao/result-row-actions";
import { SendApproachPanel } from "@/components/prospeccao/send-approach-panel";

export const dynamic = "force-dynamic";
// Dá tempo pro enriquecimento (crawl dos sites) rodar sem cortar.
export const maxDuration = 60;

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

  // Raspagem (Apify) em andamento? → AutoCollect coleta e enriquece sozinho.
  const { data: runningJob } = await createAdminClient()
    .from("prospecting_jobs")
    .select("id")
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", id)
    .eq("source", "apify")
    .eq("status", "running")
    .limit(1)
    .maybeSingle();

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

  // Funil de prospecção
  const totalRes = results.length;
  const comContato = results.filter((r) => {
    const cd = (r.company_data ?? {}) as Record<string, string>;
    const pd = (r.contact_data ?? {}) as Record<string, string>;
    return Boolean(cd.phone || pd.email);
  }).length;
  const qualificados = results.filter(
    (r) => Number(r.match_score ?? 0) >= 50,
  ).length;
  const convertidos = results.filter((r) => r.status === "converted").length;

  // Leads prontos pra contatar: têm WhatsApp/telefone + mensagem da IA + não contatados.
  const contactable = results
    .filter((r) => r.status !== "contacted")
    .map((r) => {
      const cd = (r.company_data ?? {}) as Record<string, string>;
      const pd = (r.contact_data ?? {}) as Record<string, string>;
      const phone = pd?.phone || cd?.phone;
      const pitch = (r.company_data as { pitch?: string } | null)?.pitch;
      return phone && pitch
        ? { id: r.id, name: cd?.name ?? "Lead", phone, message: pitch }
        : null;
    })
    .filter(Boolean) as { id: string; name: string; phone: string; message: string }[];

  return (
    <div className="space-y-6">
      {runningJob && <AutoCollect id={campaign.id} />}
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
            <PauseResumeCampaignButton id={campaign.id} status={campaign.status} />
            <RunAllButton id={campaign.id} />
            {tipo === "internet" && <DeepSearchButton id={campaign.id} />}
            <EnrichCampaignButton id={campaign.id} />
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

      {/* Funil de prospecção */}
      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-sm">Funil</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <FunnelStep label="Encontrados" value={totalRes} tone="slate" />
            <FunnelStep label="Com contato" value={comContato} tone="sky" />
            <FunnelStep label="Qualificados (≥50)" value={qualificados} tone="amber" />
            <FunnelStep label="Convertidos" value={convertidos} tone="emerald" />
          </div>
        </CardContent>
      </Card>

      <SendApproachPanel campaignId={id} leads={contactable} />

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
                    const dores =
                      ((r.company_data as { dores?: string[] } | null)?.dores) ?? [];
                    const pitch =
                      (r.company_data as { pitch?: string } | null)?.pitch ?? "";
                    const socios =
                      ((r.company_data as {
                        socios?: Array<{ nome?: string; qualificacao?: string }>;
                      } | null)?.socios) ?? [];
                    const decisor =
                      pd?.full_name ||
                      (socios[0]?.nome
                        ? `${socios[0].nome}${socios[0].qualificacao ? ` (${socios[0].qualificacao})` : ""}`
                        : null);
                    const site = cd?.website
                      ? cd.website.startsWith("http")
                        ? cd.website
                        : `https://${cd.website}`
                      : null;
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
                          <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                            {cd?.industry ?? ""}
                          </div>
                          {(cd?.phone || pd?.email || site) && (
                            <div className="text-[11px] text-muted-foreground mt-0.5 flex gap-2 flex-wrap">
                              {cd?.phone && <span>📞 {cd.phone}</span>}
                              {pd?.email && <span>✉️ {pd.email}</span>}
                              {site && (
                                <a
                                  href={site}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline"
                                >
                                  site
                                </a>
                              )}
                              {(((r.company_data as { socials?: string[] } | null)
                                ?.socials) ?? []).map((s) => (
                                <a
                                  key={s}
                                  href={s}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline text-sky-300/90"
                                >
                                  {s.includes("instagram")
                                    ? "instagram"
                                    : s.includes("facebook")
                                      ? "facebook"
                                      : "linkedin"}
                                </a>
                              ))}
                            </div>
                          )}
                          {decisor && (
                            <div className="text-[11px] mt-0.5 text-emerald-300">
                              👤 Decisor: {decisor}
                            </div>
                          )}
                          {dores.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1 max-w-[260px]">
                              {dores.slice(0, 4).map((d, i) => (
                                <span
                                  key={i}
                                  className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
                                  title="Oportunidade encontrada no site do lead"
                                >
                                  {d}
                                </span>
                              ))}
                            </div>
                          )}
                          {pitch && (
                            <div className="mt-1.5 text-[11px] italic text-sky-300/90 bg-sky-500/10 rounded p-1.5 max-w-[280px]">
                              💬 {pitch}
                            </div>
                          )}
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
                                {!cd?.cnpj && (
                                  <InformarCnpjButton resultId={r.id} />
                                )}
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

function FunnelStep({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "slate" | "sky" | "amber" | "emerald";
}) {
  const color: Record<string, string> = {
    slate: "text-slate-300",
    sky: "text-sky-300",
    amber: "text-amber-300",
    emerald: "text-emerald-300",
  };
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-center">
      <div className={`text-2xl font-bold ${color[tone]}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground mt-1">
        {label}
      </div>
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
