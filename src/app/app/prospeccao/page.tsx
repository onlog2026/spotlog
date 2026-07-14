import Link from "next/link";
import {
  Bot,
  Plus,
  Play,
  Pause,
  ArrowRight,
  TrendingUp,
  Users,
  Target,
  Zap,
} from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { listCampaigns, getCampaignKpis } from "@/lib/queries/prospeccao";
import { createAdminClient } from "@/lib/supabase/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatDateTime } from "@/lib/utils";
import {
  WeeklyFunnel,
  type StalledItem,
} from "@/components/prospeccao/weekly-funnel";

export const dynamic = "force-dynamic";

/** Segunda-feira desta semana, 00:00. */
function weekStart(): string {
  const d = new Date();
  const day = (d.getDay() + 6) % 7; // 0 = segunda
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function ProspeccaoPage() {
  const ctx = await requireOrgModule("prospeccao"); // Eixo A — neutro enquanto enforcement OFF
  const admin = createAdminClient();
  const ws = weekStart();
  const [
    campaigns,
    kpis,
    { count: foundWeek },
    { count: enrolledWeek },
    { count: repliedWeek },
    { count: meetingsWeek },
    { data: finishedRows },
    { data: sdrAppts },
  ] = await Promise.all([
    listCampaigns(ctx.org.id),
    getCampaignKpis(ctx.org.id),
    admin
      .from("prospecting_results")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .gte("created_at", ws),
    admin
      .from("sequence_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .gte("enrolled_at", ws),
    admin
      .from("sequence_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("status", "replied")
      .gte("finished_at", ws),
    admin
      .from("appointments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("source", "sdr")
      .gte("created_at", ws),
    admin
      // Cadências esgotadas (sem resposta) nos últimos 30 dias → intervenção
      .from("sequence_enrollments")
      .select("id, contact_id, finished_at, contacts(full_name, companies(name))")
      .eq("organization_id", ctx.org.id)
      .eq("status", "finished")
      .gte(
        "finished_at",
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      )
      .order("finished_at", { ascending: false })
      .limit(50),
    admin
      .from("appointments")
      .select("contact_id")
      .eq("organization_id", ctx.org.id)
      .eq("source", "sdr"),
  ]);

  // Intervenção = cadência encerrada E o contato NÃO virou reunião
  const meetingContacts = new Set(
    ((sdrAppts ?? []) as Array<{ contact_id: string | null }>)
      .map((a) => a.contact_id)
      .filter(Boolean) as string[],
  );
  const stalled: StalledItem[] = (
    (finishedRows ?? []) as Array<Record<string, unknown>>
  )
    .filter((r) => !meetingContacts.has(String(r.contact_id)))
    .slice(0, 20)
    .map((r) => {
      const c = r.contacts as {
        full_name?: string;
        companies?: { name?: string } | null;
      } | null;
      return {
        enrollmentId: String(r.id),
        contactName: c?.full_name ?? "Contato",
        companyName: c?.companies?.name ?? null,
        finishedAt: (r.finished_at as string | null) ?? null,
      };
    });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Prospecção</h1>
          <p className="text-muted-foreground mt-1">
            Crie campanhas que enriquecem CNPJs via BrasilAPI ou filtram seu
            banco por segmento.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/prospeccao/nova">
              <Plus className="h-4 w-4" />
              Nova campanha
            </Link>
          </Button>
          <Button variant="orange" asChild>
            <Link href="/app/prospeccao/maquina">
              <Zap className="h-4 w-4" />
              Máquina de Leads
            </Link>
          </Button>
        </div>
      </div>

      <WeeklyFunnel
        data={{
          encontrados: foundWeek ?? 0,
          emCadencia: enrolledWeek ?? 0,
          responderam: repliedWeek ?? 0,
          reunioes: meetingsWeek ?? 0,
          meta: 40,
        }}
        stalled={stalled}
      />

      <div className="grid sm:grid-cols-3 gap-3">
        <Kpi
          icon={<Target className="h-4 w-4" />}
          label="Campanhas"
          value={kpis.totalCampaigns}
        />
        <Kpi
          icon={<Users className="h-4 w-4" />}
          label="Resultados gerados"
          value={kpis.totalResults}
        />
        <Kpi
          icon={<TrendingUp className="h-4 w-4" />}
          label="Conversão p/ lead"
          value={`${kpis.conversionRate}%`}
          hint={`${kpis.totalConverted} convertidos`}
        />
      </div>

      {campaigns.length === 0 ? (
        <EmptyCampaigns />
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((ca) => {
            const pct = Math.min(
              100,
              Math.round(
                (ca.found_count / Math.max(1, ca.total_target)) * 100,
              ),
            );
            const tipo =
              (ca.icp as { type?: string } | null)?.type ??
              ca.sources?.[0] ??
              "—";
            return (
              <Card
                key={ca.id}
                className="border-white/10 bg-card/50 hover:border-white/20 transition"
              >
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-lg bg-gradient-brand shrink-0">
                        <Bot className="h-4 w-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/app/prospeccao/${ca.id}`}
                          className="font-semibold hover:underline truncate block"
                        >
                          {ca.name}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {labelTipo(tipo)} ·{" "}
                          {formatDateTime(ca.created_at)}
                        </div>
                      </div>
                    </div>
                    <StatusBadge status={ca.status} />
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>
                        {ca.found_count} / {ca.total_target} resultados
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <Progress value={pct} />
                  </div>

                  <div className="flex items-center justify-end text-xs">
                    <Link
                      href={`/app/prospeccao/${ca.id}`}
                      className="text-brand-400 flex items-center gap-1 hover:underline"
                    >
                      Abrir <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function labelTipo(t: string): string {
  if (t === "cnpj_list") return "Lista de CNPJs";
  if (t === "segmento") return "Segmento";
  if (t === "domain_list") return "Domínios";
  return t;
}

function Kpi({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Card className="border-white/10 bg-card/50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          <span className="text-brand-400">{icon}</span>
        </div>
        <div className="text-2xl font-bold">{value}</div>
        {hint && (
          <div className="text-[11px] text-muted-foreground mt-1">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyCampaigns() {
  return (
    <div className="text-center py-16 max-w-md mx-auto">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
        <Bot className="h-7 w-7 text-brand-400" />
      </div>
      <h3 className="font-semibold text-lg">Nenhuma campanha</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Crie sua primeira campanha. Você pode colar uma lista de CNPJs e ela
        será enriquecida automaticamente via BrasilAPI — gratuito.
      </p>
      <Button variant="orange" className="mt-6" asChild>
        <Link href="/app/prospeccao/nova">Criar primeira campanha</Link>
      </Button>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  if (status === "running")
    return (
      <Badge variant="success">
        <Play className="h-2.5 w-2.5 mr-1" /> Rodando
      </Badge>
    );
  if (status === "paused")
    return (
      <Badge variant="warning">
        <Pause className="h-2.5 w-2.5 mr-1" /> Pausada
      </Badge>
    );
  if (status === "completed")
    return <Badge variant="secondary">Concluída</Badge>;
  if (status === "error") return <Badge variant="destructive">Erro</Badge>;
  return <Badge variant="outline">Rascunho</Badge>;
}
