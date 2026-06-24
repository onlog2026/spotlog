import Link from "next/link";
import {
  Users,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getSdrClient } from "@/lib/sdr/db";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function SdrDashboardPage() {
  const ctx = await requireSession();
  const supabase = await getSdrClient();

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  const [
    { count: totalSdrLeads },
    { count: qualified },
    { count: inSequence },
    { count: openConversations },
    { count: optOutsThisMonth },
    { count: pendingQueue },
    { count: enriched },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .in("source", ["enrichment", "sdr_outbound", "prospecting"]),
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .gte("score", 60)
      .in("source", ["enrichment", "sdr_outbound", "prospecting"]),
    supabase
      .from("sequence_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("status", "active"),
    supabase
      .from("conversations")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id),
    supabase
      .from("lead_consents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("consent_type", "opt_out")
      .gte("recorded_at", startOfMonth),
    supabase
      .from("outbound_queue")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("status", "pendente"),
    supabase
      .from("company_enrichment")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id),
  ]);

  const kpis = [
    {
      label: "Leads na fila",
      value: totalSdrLeads ?? 0,
      icon: Users,
      tone: "from-spotnavy-700 to-spotnavy-900",
    },
    {
      label: "Qualificados (score ≥ 60)",
      value: qualified ?? 0,
      icon: TrendingUp,
      tone: "from-emerald-700 to-emerald-900",
    },
    {
      label: "Em sequência",
      value: inSequence ?? 0,
      icon: Sparkles,
      tone: "from-spotorange-500 to-spotred-600",
    },
    {
      label: "Conversas abertas",
      value: openConversations ?? 0,
      icon: MessageSquare,
      tone: "from-blue-700 to-blue-900",
    },
    {
      label: "Opt-outs no mês",
      value: optOutsThisMonth ?? 0,
      icon: ShieldCheck,
      tone: "from-amber-600 to-amber-800",
    },
    {
      label: "Empresas enriquecidas",
      value: enriched ?? 0,
      icon: Sparkles,
      tone: "from-purple-700 to-purple-900",
    },
  ];

  // Funil: criados → enriquecidos → qualificados → em sequência → respondidos
  const funnel = [
    { label: "Criados", value: totalSdrLeads ?? 0 },
    { label: "Enriquecidos", value: enriched ?? 0 },
    { label: "Qualificados", value: qualified ?? 0 },
    { label: "Em sequência", value: inSequence ?? 0 },
    { label: "Conversando", value: openConversations ?? 0 },
  ];
  const max = Math.max(1, ...funnel.map((s) => s.value));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {kpis.map((k) => (
          <Card
            key={k.label}
            className="border-white/10 bg-card/50 hover:border-spotorange-500/40 transition"
          >
            <CardContent className="p-4 flex items-start gap-3">
              <div
                className={`p-2 rounded-lg bg-gradient-to-br ${k.tone} shrink-0`}
              >
                <k.icon className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-2xl font-bold leading-none">{k.value}</div>
                <div className="text-xs text-muted-foreground mt-1">
                  {k.label}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="font-semibold">Funil SDR</h2>
              <p className="text-xs text-muted-foreground">
                Conversão do agente de prospecção (todos os tempos).
              </p>
            </div>
            <div className="text-xs text-muted-foreground">
              {pendingQueue ?? 0} mensagens pendentes na fila de envio
            </div>
          </div>
          <div className="space-y-2">
            {funnel.map((s) => {
              const pct = Math.round((s.value / max) * 100);
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground">{s.value}</span>
                  </div>
                  <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-spotorange-500 to-spotred-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-6 space-y-3">
            <Sparkles className="h-5 w-5 text-spotorange-500" />
            <h3 className="font-semibold">Enriquecer empresas</h3>
            <p className="text-sm text-muted-foreground">
              Cole uma lista de CNPJs (ou CSV) e o agente busca razão social,
              CNAE, sócios, porte, capital e cria leads automaticamente.
            </p>
            <Button variant="orange" asChild>
              <Link href="/app/sdr/enriquecer">
                Começar enrichment <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-6 space-y-3">
            <ShieldCheck className="h-5 w-5 text-emerald-400" />
            <h3 className="font-semibold">Conformidade LGPD</h3>
            <p className="text-sm text-muted-foreground">
              Veja consentimentos, suppression list, opt-outs e estatísticas
              regulatórias. Toda mensagem outbound passa por checagem aqui.
            </p>
            <Button variant="outline" asChild>
              <Link href="/app/sdr/lgpd">
                Abrir painel LGPD <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <p className="text-[11px] text-muted-foreground text-center">
        Dados de contato tratados sob base legal de <strong>interesse legítimo</strong>{" "}
        ou <strong>consentimento</strong> (LGPD, Lei 13.709/2018). Opt-out
        1-clique em todas comunicações.
      </p>
    </div>
  );
}
