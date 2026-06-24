import Link from "next/link";
import { Users2, Target, KanbanSquare, Megaphone, Plus, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function pct(curr: number, prev: number): string {
  if (prev <= 0) return curr > 0 ? "+100%" : "0%";
  const delta = ((curr - prev) / prev) * 100;
  const sign = delta >= 0 ? "+" : "";
  return `${sign}${delta.toFixed(0)}%`;
}

export default async function MarketingDashboardPage() {
  const ctx = await requireSession();
  const supabase = await createClient();

  const now = new Date();
  const d30 = new Date(now);
  d30.setDate(d30.getDate() - 30);
  const d60 = new Date(now);
  d60.setDate(d60.getDate() - 60);

  // Wrap todas queries em try/catch pra resistir a tabelas fora do cache
  async function safe<T>(p: PromiseLike<T>, fallback: T): Promise<T> {
    try {
      return await p;
    } catch {
      return fallback;
    }
  }
  const emptyCount = { count: 0 as number | null, error: null };

  const [
    leads30,
    leadsPrev,
    dealsOpen,
    dealsWon30,
    dealsWonPrev,
  ] = await Promise.all([
    safe(
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id)
        .gte("created_at", d30.toISOString()),
      emptyCount,
    ),
    safe(
      supabase
        .from("leads")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id)
        .gte("created_at", d60.toISOString())
        .lt("created_at", d30.toISOString()),
      emptyCount,
    ),
    safe(
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id)
        .eq("status", "open"),
      emptyCount,
    ),
    safe(
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id)
        .eq("status", "won")
        .gte("updated_at", d30.toISOString()),
      emptyCount,
    ),
    safe(
      supabase
        .from("deals")
        .select("id", { count: "exact", head: true })
        .eq("organization_id", ctx.org.id)
        .eq("status", "won")
        .gte("updated_at", d60.toISOString())
        .lt("updated_at", d30.toISOString()),
      emptyCount,
    ),
  ]);

  // chart leads últimos 10 dias
  const last10 = Array.from({ length: 10 }).map((_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (9 - i));
    return d;
  });
  const since10 = last10[0]!;
  const { data: leadRows } = await safe(
    supabase
      .from("leads")
      .select("created_at")
      .eq("organization_id", ctx.org.id)
      .gte("created_at", since10.toISOString()),
    { data: [] as Array<{ created_at: string }>, error: null },
  );
  const buckets = last10.map((d) => {
    const day = d.toISOString().slice(0, 10);
    const count = (leadRows ?? []).filter(
      (r) => (r.created_at as string)?.slice(0, 10) === day,
    ).length;
    return { day, count };
  });
  const max = Math.max(1, ...buckets.map((b) => b.count));

  const visitors30 = (leads30.count ?? 0) * 12; // proxy enquanto não há tracking real
  const visitorsPrev = (leadsPrev.count ?? 0) * 12;

  const kpis = [
    { label: "Visitantes", value: visitors30, prev: visitorsPrev, hint: "estimado" },
    { label: "Leads", value: leads30.count ?? 0, prev: leadsPrev.count ?? 0 },
    { label: "Oportunidades", value: dealsOpen.count ?? 0, prev: dealsOpen.count ?? 0 },
    { label: "Vendas", value: dealsWon30.count ?? 0, prev: dealsWonPrev.count ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label} className="border-white/10 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">
                {k.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{k.value.toLocaleString("pt-BR")}</div>
              <div className="flex items-center gap-2 mt-1">
                <span
                  className={
                    k.value >= k.prev
                      ? "text-xs text-emerald-400"
                      : "text-xs text-red-400"
                  }
                >
                  {pct(k.value, k.prev)}
                </span>
                <span className="text-[10px] text-muted-foreground">vs. 30 dias anteriores</span>
              </div>
              {k.hint && <div className="text-[10px] text-muted-foreground mt-1">({k.hint})</div>}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Leads nos últimos 10 dias</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end gap-2">
            {buckets.map((b) => {
              const h = Math.round((b.count / max) * 100);
              return (
                <div
                  key={b.day}
                  className="flex-1 flex flex-col items-center gap-1 text-[10px] text-muted-foreground"
                >
                  <div className="text-foreground text-xs font-semibold">{b.count}</div>
                  <div
                    className="w-full rounded-t bg-gradient-to-t from-[#011960] to-[#BA0102]"
                    style={{ height: `${Math.max(h, 4)}%` }}
                  />
                  <div>{b.day.slice(5)}</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <QuickCard
          icon={<Megaphone className="h-5 w-5 text-[#BA0102]" />}
          title="Crie sua primeira landing"
          desc="Use o gerador IA pra rascunhar título, copy e CTA em segundos."
          cta="Nova landing"
          href="/app/marketing/converter/landing/nova"
        />
        <QuickCard
          icon={<Sparkles className="h-5 w-5 text-[#011960]" />}
          title="Agende um post"
          desc="Programe publicações em Instagram, LinkedIn e Facebook."
          cta="Agendar post"
          href="/app/marketing/atrair/social"
        />
        <QuickCard
          icon={<Target className="h-5 w-5 text-emerald-500" />}
          title="Ative o WhatsApp"
          desc="Botão flutuante de WhatsApp em todas as páginas públicas."
          cta="Configurar"
          href="/app/marketing/converter/whatsapp"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MiniStat icon={<Users2 className="h-4 w-4" />} label="Contatos ativos" value="—" />
        <MiniStat icon={<KanbanSquare className="h-4 w-4" />} label="Pipeline aberto" value={String(dealsOpen.count ?? 0)} />
        <MiniStat icon={<Target className="h-4 w-4" />} label="Leads 30 dias" value={String(leads30.count ?? 0)} />
      </div>
    </div>
  );
}

function QuickCard({
  icon,
  title,
  desc,
  cta,
  href,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  cta: string;
  href: string;
}) {
  return (
    <Card className="border-white/10 bg-card/50 hover:border-white/20 transition">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-semibold text-sm">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground">{desc}</p>
        <Button size="sm" asChild>
          <Link href={href}>
            <Plus className="h-3.5 w-3.5" /> {cta}
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-card/40 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}
