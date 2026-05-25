import Link from "next/link";
import { ArrowLeft, Bot, Sparkles, ArrowRight } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ConvertResultsButton } from "@/components/prospecting/convert-results-button";
import { notFound } from "next/navigation";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: campaign } = await supabase
    .from("prospecting_campaigns")
    .select("*")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();

  if (!campaign) notFound();

  const ca = campaign as unknown as {
    id: string;
    name: string;
    status: string;
    icp: Record<string, string[]>;
    sources: string[];
    daily_limit: number;
    total_target: number;
    found_count: number;
    ai_persona: string | null;
    auto_enroll: boolean;
    created_at: string;
  };

  const { data: results } = await supabase
    .from("prospecting_results")
    .select(
      "id, source, company_data, contact_data, match_score, status, created_at",
    )
    .eq("campaign_id", id)
    .order("match_score", { ascending: false })
    .limit(50);

  const pct = Math.min(
    100,
    Math.round((ca.found_count / Math.max(1, ca.total_target)) * 100),
  );

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/prospeccao"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Campanhas
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-gradient-brand">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{ca.name}</h1>
              <p className="text-xs text-muted-foreground">
                Criada em {formatDateTime(ca.created_at)}
              </p>
            </div>
          </div>
          <Badge variant={ca.status === "running" ? "success" : "outline"}>
            {ca.status}
          </Badge>
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
                {ca.found_count}
              </span>
              <span className="text-sm text-muted-foreground">
                de {ca.total_target} alvo · {pct}%
              </span>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="grid grid-cols-2 gap-4 mt-6">
              <Stat label="Fontes" value={ca.sources.join(", ")} />
              <Stat label="Limite diário" value={`${ca.daily_limit}/dia`} />
              <Stat
                label="Auto-inscrever na cadência"
                value={ca.auto_enroll ? "Sim" : "Não"}
              />
              <Stat label="Status" value={ca.status} />
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
          <CardContent>
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">
              {ca.ai_persona || "Sem persona definida."}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Resultados ({results?.length ?? 0})</CardTitle>
            <ConvertResultsButton campaignId={ca.id} />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {!results || results.length === 0 ? (
            <div className="text-center py-12 text-sm text-muted-foreground">
              Ainda sem resultados. Aguarde alguns minutos ou ative as fontes.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-3">Match</th>
                    <th className="text-left p-3">Empresa</th>
                    <th className="text-left p-3">Decisor</th>
                    <th className="text-left p-3 hidden md:table-cell">Cargo</th>
                    <th className="text-left p-3 hidden lg:table-cell">E-mail</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r) => {
                    const re = r as unknown as {
                      id: string;
                      company_data: { name?: string; industry?: string };
                      contact_data: {
                        full_name?: string;
                        job_title?: string;
                        email?: string;
                      } | null;
                      match_score: number;
                      status: string;
                    };
                    return (
                      <tr
                        key={re.id}
                        className="border-b border-white/5 hover:bg-white/5"
                      >
                        <td className="p-3">
                          <div className="text-xs font-semibold text-emerald-400">
                            {re.match_score}%
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="font-medium">
                            {re.company_data?.name ?? "—"}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {re.company_data?.industry}
                          </div>
                        </td>
                        <td className="p-3 text-sm">
                          {re.contact_data?.full_name ?? "—"}
                        </td>
                        <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">
                          {re.contact_data?.job_title ?? "—"}
                        </td>
                        <td className="p-3 hidden lg:table-cell text-xs text-muted-foreground">
                          {re.contact_data?.email ?? "—"}
                        </td>
                        <td className="p-3">
                          <Badge
                            variant={
                              re.status === "converted" ? "success" : "outline"
                            }
                            className="text-[10px]"
                          >
                            {re.status}
                          </Badge>
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
      <div className="text-sm font-medium mt-0.5">{value}</div>
    </div>
  );
}
