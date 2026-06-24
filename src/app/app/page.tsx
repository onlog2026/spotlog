import Link from "next/link";
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  Inbox,
  Send,
  Target,
  TrendingUp,
  Users2,
  Sparkles,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { WelcomeBanner } from "@/components/onboarding/welcome-banner";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const ctx = await requireSession();
  const supabase = await createClient();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const [leads, contacts, deals, openDeals, wonDeals, messages, pipelineRevenue] =
    await Promise.all([
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id)
        .gte("created_at", since.toISOString()),
      supabase
        .from("contacts")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id),
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id),
      supabase
        .from("deals")
        .select("amount", { count: "exact" })
        .eq("organization_id", ctx.org.id)
        .eq("status", "open"),
      supabase
        .from("deals")
        .select("amount")
        .eq("organization_id", ctx.org.id)
        .eq("status", "won")
        .gte("closed_at", since.toISOString()),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id)
        .eq("direction", "outbound")
        .gte("created_at", since.toISOString()),
      supabase
        .from("deals")
        .select("amount")
        .eq("organization_id", ctx.org.id)
        .eq("status", "open"),
    ]);

  const pipelineTotal =
    pipelineRevenue.data?.reduce(
      (acc, d) => acc + Number((d as { amount?: number }).amount ?? 0),
      0,
    ) ?? 0;
  const wonTotal =
    wonDeals.data?.reduce(
      (acc, d) => acc + Number((d as { amount?: number }).amount ?? 0),
      0,
    ) ?? 0;

  const metrics = [
    {
      label: "Leads (30d)",
      value: leads.count ?? 0,
      icon: Target,
      color: "from-blue-500 to-cyan-500",
      href: "/app/leads",
    },
    {
      label: "Contatos",
      value: contacts.count ?? 0,
      icon: Users2,
      color: "from-purple-500 to-pink-500",
      href: "/app/contatos",
    },
    {
      label: "Deals abertos",
      value: openDeals.count ?? 0,
      icon: Inbox,
      color: "from-emerald-500 to-teal-500",
      href: "/app/pipeline",
    },
    {
      label: "Mensagens enviadas",
      value: messages.count ?? 0,
      icon: Send,
      color: "from-amber-500 to-orange-500",
      href: "/app/cadencias",
    },
  ];

  const hasNoData =
    (leads.count ?? 0) === 0 &&
    (contacts.count ?? 0) === 0 &&
    (deals.count ?? 0) === 0;

  return (
    <div className="space-y-8">
      <WelcomeBanner />
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">
            Olá, {ctx.user.full_name?.split(" ")[0] ?? "vamos vender"}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Visão geral da operação dos últimos 30 dias.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href="/app/prospeccao/nova">
              <Bot className="h-4 w-4" />
              Nova campanha
            </Link>
          </Button>
          <Button variant="orange" asChild>
            <Link href="/app/leads/novo">
              <Target className="h-4 w-4" />
              Adicionar lead
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <Link key={m.label} href={m.href}>
            <Card className="border-white/10 bg-card/50 hover:bg-card/80 hover:border-white/20 transition-all group">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className={`p-2 rounded-lg bg-gradient-to-br ${m.color}`}
                  >
                    <m.icon className="h-4 w-4 text-white" />
                  </div>
                  <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-foreground transition-colors" />
                </div>
                <div className="text-3xl font-bold">{m.value}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.label}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2 border-white/10 bg-card/50">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-brand-400" />
                Receita no pipeline
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/app/pipeline">
                  Ver pipeline <ArrowRight className="h-3 w-3" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Em aberto
                </div>
                <div className="text-4xl font-bold text-gradient">
                  {formatCurrency(pipelineTotal)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {openDeals.count ?? 0} oportunidades em andamento
                </div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Ganhos nos últimos 30d
                </div>
                <div className="text-4xl font-bold text-emerald-400">
                  {formatCurrency(wonTotal)}
                </div>
                <div className="text-xs text-muted-foreground mt-2">
                  {wonDeals.data?.length ?? 0} negócios fechados
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-brand-400" />
              Próximos passos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {hasNoData ? (
              <OnboardingChecklist />
            ) : (
              <div className="space-y-2 text-sm">
                <Link
                  href="/app/inbox"
                  className="flex items-center justify-between p-2 rounded hover:bg-white/5"
                >
                  <span>Ver respostas novas</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/app/leads?status=new"
                  className="flex items-center justify-between p-2 rounded hover:bg-white/5"
                >
                  <span>Leads aguardando triagem</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
                <Link
                  href="/app/pipeline?filter=overdue"
                  className="flex items-center justify-between p-2 rounded hover:bg-white/5"
                >
                  <span>Deals com follow-up atrasado</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OnboardingChecklist() {
  const items = [
    {
      done: false,
      label: "Conectar IA (OpenAI ou Anthropic)",
      href: "/app/admin/integracoes",
    },
    {
      done: false,
      label: "Conectar WhatsApp ou e-mail",
      href: "/app/admin/integracoes",
    },
    { done: false, label: "Criar primeira campanha", href: "/app/prospeccao/nova" },
    { done: false, label: "Subir tabela de preços", href: "/app/propostas/tabelas" },
  ];
  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-2">
        Pra deixar o agente rodando 100%, complete:
      </p>
      {items.map((it) => (
        <Link
          key={it.label}
          href={it.href}
          className="flex items-center gap-2 p-2 rounded text-sm hover:bg-white/5"
        >
          <CheckCircle2
            className={`h-4 w-4 ${
              it.done ? "text-emerald-400" : "text-muted-foreground"
            }`}
          />
          <span className="flex-1">{it.label}</span>
          <ArrowRight className="h-3 w-3 text-muted-foreground" />
        </Link>
      ))}
    </div>
  );
}
