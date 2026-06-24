import Link from "next/link";
import {
  Building2,
  Users,
  Target,
  FileText,
  DollarSign,
  Activity,
  Ticket,
} from "lucide-react";
import { createAdminClient } from "@/lib/superadmin/admin-client";
import { safeCount, getOrgNamesMap } from "@/lib/queries/superadmin";
import { PageHeader } from "@/components/superadmin/page-header";
import { StatCard } from "@/components/superadmin/stat-card";

export const dynamic = "force-dynamic";

export default async function SuperAdminDashboardPage() {
  const admin = createAdminClient();

  const [orgs, users, leads, proposals, deals, openTickets] = await Promise.all([
    safeCount("organizations"),
    safeCount("profiles"),
    safeCount("leads"),
    safeCount("proposals"),
    safeCount("deals"),
    // Tickets em aberto: status != 'closed' e != 'resolved'
    (async () => {
      try {
        const a = createAdminClient();
        const { count } = await a
          .from("support_tickets")
          .select("*", { count: "exact", head: true })
          .not("status", "in", "(closed,resolved)");
        return count ?? 0;
      } catch {
        return 0;
      }
    })(),
  ]);

  // MRR — sem billing real ainda, mantemos como "em implementação"
  const mrrLabel = "Em implementação";

  // Últimas 5 orgs criadas
  const { data: recentOrgs } = await admin
    .from("organizations")
    .select("id, name, slug, plan, status, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Últimos 5 usuários (profiles)
  const { data: recentUsers } = await admin
    .from("profiles")
    .select("id, email, full_name, created_at")
    .order("created_at", { ascending: false })
    .limit(5);

  // Últimos 5 tickets críticos (priority high/urgent)
  let recentTickets: Array<{
    id: string;
    subject: string;
    status: string;
    priority: string;
    organization_id: string;
    created_at: string;
  }> = [];
  try {
    const { data } = await admin
      .from("support_tickets")
      .select("id, subject, status, priority, organization_id, created_at")
      .in("priority", ["high", "urgent"])
      .order("created_at", { ascending: false })
      .limit(5);
    recentTickets = (data ?? []) as typeof recentTickets;
  } catch {
    recentTickets = [];
  }
  const ticketOrgs = await getOrgNamesMap(
    Array.from(new Set(recentTickets.map((t) => t.organization_id))),
  );

  // Atividade recente cross-org (audit_logs)
  let activities: Array<{
    id: string;
    entity: string;
    action: string;
    created_at: string;
    organization_id: string;
  }> = [];
  try {
    const { data } = await admin
      .from("audit_logs")
      .select("id, entity, action, created_at, organization_id")
      .order("created_at", { ascending: false })
      .limit(15);
    activities = (data ?? []) as typeof activities;
  } catch {
    activities = [];
  }

  return (
    <div>
      <PageHeader
        title="Dashboard Global"
        description="Visão consolidada de TODAS as organizações do Spotlog."
      />

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <StatCard label="Organizações" value={orgs} icon={Building2} />
        <StatCard label="Usuários" value={users} icon={Users} />
        <StatCard label="Leads" value={leads} icon={Target} />
        <StatCard label="Propostas" value={proposals} icon={FileText} />
        <StatCard label="Negócios" value={deals} icon={Activity} />
        <StatCard
          label="Tickets abertos"
          value={openTickets}
          icon={Ticket}
          accent="red"
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Últimas organizações</h2>
            <Link
              href="/app/superadmin/organizacoes"
              className="text-xs text-white/60 hover:text-white"
            >
              ver todas →
            </Link>
          </div>
          {!recentOrgs || recentOrgs.length === 0 ? (
            <p className="text-sm text-white/50">Nenhuma organização ainda.</p>
          ) : (
            <ul className="space-y-2">
              {recentOrgs.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 text-sm"
                >
                  <Link
                    href={`/app/superadmin/organizacoes/${o.id}`}
                    className="font-medium hover:underline truncate"
                  >
                    {o.name}
                  </Link>
                  <span className="text-xs text-white/50">
                    {new Date(o.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Últimos usuários</h2>
            <Link
              href="/app/superadmin/usuarios"
              className="text-xs text-white/60 hover:text-white"
            >
              ver todos →
            </Link>
          </div>
          {!recentUsers || recentUsers.length === 0 ? (
            <p className="text-sm text-white/50">Sem usuários cadastrados.</p>
          ) : (
            <ul className="space-y-2">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between border-b border-white/5 pb-2 last:border-0 text-sm"
                >
                  <span className="truncate">
                    <span className="text-white/70">{u.full_name ?? "—"}</span>{" "}
                    <span className="text-white/50 text-xs">{u.email}</span>
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(u.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-amber-200">Tickets críticos recentes</h2>
            <span className="text-xs text-amber-200/70">prioridade high/urgent</span>
          </div>
          {recentTickets.length === 0 ? (
            <p className="text-sm text-amber-100/60">
              Nenhum ticket crítico no momento.
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentTickets.map((t) => (
                <li
                  key={t.id}
                  className="border-b border-amber-500/15 pb-2 last:border-0"
                >
                  <div className="font-medium truncate">{t.subject}</div>
                  <div className="text-[11px] text-amber-100/60 flex gap-2 mt-0.5">
                    <span className="uppercase">{t.priority}</span>·
                    <span>{ticketOrgs.get(t.organization_id) ?? "—"}</span>·
                    <span>{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">Receita (MRR)</h2>
            <DollarSign className="h-4 w-4 text-white/40" />
          </div>
          <div className="text-2xl font-bold">{mrrLabel}</div>
          <p className="text-xs text-white/50 mt-2">
            Integração com gateway de pagamento (Asaas/Stripe) ainda não conectada.
            Será automática quando as primeiras assinaturas começarem.
          </p>
        </div>
      </div>

      {/* Atividade recente */}
      <div className="mt-6 rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="text-lg font-semibold mb-4">Atividade recente (cross-org)</h2>
        {activities.length === 0 ? (
          <p className="text-sm text-white/50">
            Nenhum evento em audit_logs. Tudo silencioso por aqui.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-white/60 text-xs uppercase">
                  <th className="py-2 pr-4">Quando</th>
                  <th className="py-2 pr-4">Entidade</th>
                  <th className="py-2 pr-4">Ação</th>
                  <th className="py-2 pr-4">Org</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-t border-white/5">
                    <td className="py-2 pr-4 text-white/70">
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-2 pr-4">{a.entity}</td>
                    <td className="py-2 pr-4">
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs">
                        {a.action}
                      </span>
                    </td>
                    <td className="py-2 pr-4 font-mono text-[11px] text-white/50">
                      {a.organization_id.slice(0, 8)}…
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
