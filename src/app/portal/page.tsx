import Link from "next/link";
import {
  Truck,
  CheckCircle2,
  Clock,
  Headphones,
  ArrowRight,
  PackagePlus,
  Megaphone,
} from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Shipment = {
  id: string;
  code: string | null;
  recipient_name: string | null;
  status: string | null;
  created_at: string | null;
  sla_deadline: string | null;
};

type Broadcast = {
  id: string;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
};

export default async function PortalDashboardPage() {
  const ctx = await requireClientSession();
  const supabase = await createClient();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const lastMonthStart = new Date();
  lastMonthStart.setMonth(lastMonthStart.getMonth() - 1);

  const [
    { count: shipmentsToday },
    { count: inRoute },
    { count: deliveredLastMonth },
    { count: openTickets },
    { data: lastShipments },
  ] = await Promise.all([
    supabase
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .gte("created_at", todayStart.toISOString()),
    supabase
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .in("status", ["in_transit", "out_for_delivery", "picked_up"]),
    supabase
      .from("shipments")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .eq("status", "delivered")
      .gte("delivered_at", lastMonthStart.toISOString()),
    supabase
      .from("support_tickets")
      .select("id", { count: "exact", head: true })
      .eq("company_id", ctx.company.id)
      .in("status", ["open", "in_progress", "waiting_customer"]),
    supabase
      .from("shipments")
      .select("id, code, recipient_name, status, created_at, sla_deadline")
      .eq("company_id", ctx.company.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  // @ts-expect-error rpc dinâmico
  const { data: broadcastsRaw } = await supabase.rpc("portal_list_broadcasts", {
    p_user: ctx.user.id,
  });
  const unreadBroadcasts = (((broadcastsRaw ?? []) as Broadcast[]) || [])
    .filter((b) => !b.read_at)
    .slice(0, 3);

  const shipments = (lastShipments ?? []) as Shipment[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Olá, {ctx.user.full_name?.split(" ")[0] ?? "tudo bem"}!
        </h1>
        <p className="text-muted-foreground">
          Visão geral das suas remessas e atendimento — {ctx.company.name}
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={PackagePlus}
          label="Remessas hoje"
          value={shipmentsToday ?? 0}
          accent="bg-blue-500/10 text-blue-600"
        />
        <KpiCard
          icon={Truck}
          label="Em rota"
          value={inRoute ?? 0}
          accent="bg-amber-500/10 text-amber-600"
        />
        <KpiCard
          icon={CheckCircle2}
          label="Entregues (últ. 30 dias)"
          value={deliveredLastMonth ?? 0}
          accent="bg-emerald-500/10 text-emerald-600"
        />
        <KpiCard
          icon={Headphones}
          label="Chamados abertos"
          value={openTickets ?? 0}
          accent="bg-red-500/10 text-red-600"
        />
      </div>

      {/* CTAs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Button asChild variant="orange" size="lg" className="h-14">
          <Link href="/portal/coletas/nova">
            <PackagePlus className="h-5 w-5 mr-2" />
            Solicitar nova coleta
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="h-14">
          <Link href="/portal/chamados/novo">
            <Headphones className="h-5 w-5 mr-2" />
            Abrir chamado
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Últimas remessas */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              Últimas remessas
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/remessas">
                Ver todas <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipments.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">
                Nenhuma remessa ainda. Solicite sua primeira coleta!
              </p>
            ) : (
              shipments.map((s) => (
                <Link
                  key={s.id}
                  href={`/portal/remessas/${s.code ?? s.id}`}
                  className="flex items-center justify-between p-3 rounded-md border border-white/5 hover:bg-white/5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid h-10 w-10 place-items-center rounded-md bg-navy-50">
                      <Truck className="h-4 w-4 text-navy-900" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium truncate">
                        {s.code ?? "Sem código"}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {s.recipient_name ?? "—"}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline">{s.status ?? "—"}</Badge>
                </Link>
              ))
            )}
          </CardContent>
        </Card>

        {/* Broadcasts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Megaphone className="h-4 w-4" />
              Avisos
            </CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link href="/portal/avisos">
                Ver todos <ArrowRight className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {unreadBroadcasts.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                Nenhum aviso novo.
              </p>
            ) : (
              unreadBroadcasts.map((b) => (
                <Link
                  key={b.id}
                  href="/portal/avisos"
                  className="block p-3 rounded-md border border-spotorange-500/30 bg-spotorange-50/60 hover:bg-spotorange-50"
                >
                  <div className="flex items-start gap-2">
                    <Clock className="h-3 w-3 mt-1 text-spotorange-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-semibold text-sm truncate text-navy-900">
                        {b.title}
                      </div>
                      <div className="text-xs text-ink-700 line-clamp-2 mt-0.5">
                        {b.body}
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">
              {label}
            </p>
            <p className="text-3xl font-bold mt-1">{value}</p>
          </div>
          <div className={`grid h-12 w-12 place-items-center rounded-lg ${accent}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
