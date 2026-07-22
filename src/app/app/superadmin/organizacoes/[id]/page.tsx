import Link from "next/link";
import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/superadmin/admin-client";
import { getUserEmailsMap } from "@/lib/queries/superadmin";
import { PageHeader } from "@/components/superadmin/page-header";
import { StatCard } from "@/components/superadmin/stat-card";
import { DangerButton } from "@/components/superadmin/danger-button";
import {
  suspendOrganization,
  reactivateOrganization,
  deleteOrganization,
  promoteOwnerToSuperAdmin,
} from "./actions";
import { OrgEntitlements } from "./org-entitlements";
import {
  listPlans,
  getOrgModuleMatrix,
  isEnforcementOn,
} from "@/lib/superadmin/entitlements-admin";
import { Users, Plug, Target, FileText, Ticket } from "lucide-react";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

type OrgRow = {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  domain: string | null;
  created_at: string;
  trial_ends_at: string | null;
};

export default async function OrgDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  const admin = createAdminClient();

  const { data: orgData } = await admin
    .from("organizations")
    .select("id, name, slug, plan, status, domain, created_at, trial_ends_at")
    .eq("id", id)
    .maybeSingle();

  if (!orgData) notFound();
  const org = orgData as unknown as OrgRow;

  // Entitlements (Eixo A): plano, matriz de módulos e status do enforcement
  const [plans, moduleMatrix, enforced] = await Promise.all([
    listPlans(),
    getOrgModuleMatrix(org.id, org.plan),
    isEnforcementOn(),
  ]);

  const [
    { data: members },
    { data: integs },
    { data: recentLeads },
    { data: openTickets },
    { data: logs },
    leadsCount,
    propCount,
    ticketsCount,
    { data: permissions },
  ] = await Promise.all([
    admin
      .from("organization_members")
      .select("id, role, user_id, joined_at")
      .eq("organization_id", id),
    admin
      .from("integrations")
      .select("id, provider, display_name, is_active, updated_at")
      .eq("organization_id", id),
    admin
      .from("leads")
      .select("id, name, created_at")
      .eq("organization_id", id)
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("support_tickets")
      .select("id, subject, status, priority, created_at")
      .eq("organization_id", id)
      .not("status", "in", "(closed,resolved)")
      .order("created_at", { ascending: false })
      .limit(10),
    admin
      .from("audit_logs")
      .select("id, entity, action, created_at")
      .eq("organization_id", id)
      .order("created_at", { ascending: false })
      .limit(15),
    admin.from("leads").select("*", { count: "exact", head: true }).eq("organization_id", id),
    admin.from("proposals").select("*", { count: "exact", head: true }).eq("organization_id", id),
    admin
      .from("support_tickets")
      .select("*", { count: "exact", head: true })
      .eq("organization_id", id),
    admin
      // @ts-expect-error tabela nova fora dos types
      .from("user_module_permissions")
      .select("module, user_id, can_read, can_write")
      .eq("organization_id", id),
  ]);

  const memberList = (members ?? []) as Array<{
    id: string;
    role: string;
    user_id: string;
    joined_at: string;
  }>;

  // Emails dos membros
  const memberEmails = await getUserEmailsMap(memberList.map((m) => m.user_id));

  // Módulos liberados agregados (módulos distintos com qualquer permissão)
  const permList = (permissions ?? []) as Array<{
    module: string;
    user_id: string;
    can_read: boolean;
    can_write: boolean;
  }>;
  const modulesGranted = Array.from(
    new Map(
      permList
        .filter((p) => p.can_read || p.can_write)
        .map((p) => [
          p.module,
          {
            module: p.module,
            users: permList.filter((x) => x.module === p.module).length,
            writeUsers: permList.filter((x) => x.module === p.module && x.can_write).length,
          },
        ]),
    ).values(),
  );

  return (
    <div>
      <div className="mb-2">
        <Link
          href="/app/superadmin/organizacoes"
          className="text-xs text-white/60 hover:text-white"
        >
          ← Voltar pra todas as orgs
        </Link>
      </div>
      <PageHeader
        title={org.name}
        description={`Slug: ${org.slug} · Plano: ${org.plan} · Status: ${org.status} · Criada em ${new Date(org.created_at).toLocaleDateString("pt-BR")}`}
        actions={
          <>
            {org.status === "suspended" ? (
              <form
                action={async () => {
                  "use server";
                  await reactivateOrganization(org.id);
                }}
              >
                <button
                  type="submit"
                  className="rounded-md px-3 py-1.5 text-xs font-semibold border border-green-500/40 text-green-300 hover:bg-green-500/10"
                >
                  Reativar organização
                </button>
              </form>
            ) : (
              <DangerButton
                label="Suspender organização"
                confirmText={org.slug}
                onConfirm={async () => {
                  await suspendOrganization(org.id);
                }}
              />
            )}
            <DangerButton
              label="Promover dono → super admin (ACESSO GLOBAL, não só desta org)"
              confirmText="ACESSO GLOBAL"
              onConfirm={async () => {
                await promoteOwnerToSuperAdmin(org.id);
              }}
            />
            <DangerButton
              label="Excluir organização"
              confirmText={`EXCLUIR ${org.slug}`}
              onConfirm={async () => {
                await deleteOrganization(org.id);
              }}
            />
          </>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <StatCard label="Membros" value={memberList.length} icon={Users} />
        <StatCard label="Integrações" value={integs?.length ?? 0} icon={Plug} />
        <StatCard label="Leads" value={leadsCount.count ?? 0} icon={Target} />
        <StatCard label="Propostas" value={propCount.count ?? 0} icon={FileText} />
        <StatCard label="Tickets" value={ticketsCount.count ?? 0} icon={Ticket} accent="red" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <OrgEntitlements
          orgId={org.id}
          plan={org.plan}
          plans={plans.map((p) => ({ key: p.key, name: p.name }))}
          enforced={enforced}
          rows={moduleMatrix.map((r) => ({
            key: r.module.key,
            label: r.module.label,
            group: r.module.module_group ?? "Outros",
            inPlan: r.inPlan,
            override: r.override,
            effective: r.effective,
          }))}
        />

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold mb-3">Membros</h3>
          {memberList.length === 0 ? (
            <p className="text-sm text-white/50">Sem membros.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {memberList.map((m) => (
                <li key={m.id} className="flex justify-between items-center">
                  <span className="truncate">
                    {memberEmails.get(m.user_id) ?? `${m.user_id.slice(0, 8)}…`}
                  </span>
                  <span className="rounded bg-white/10 px-2 py-0.5 text-xs">{m.role}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold mb-3">Integrações</h3>
          {!integs || integs.length === 0 ? (
            <p className="text-sm text-white/50">Nenhuma integração configurada.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {integs.map((i) => (
                <li key={i.id} className="flex justify-between items-center">
                  <span>
                    {i.provider}
                    {i.display_name ? (
                      <span className="text-white/50 text-xs"> · {i.display_name}</span>
                    ) : null}
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-xs"
                    style={{
                      background: i.is_active
                        ? "rgba(34,197,94,0.2)"
                        : "rgba(255,255,255,0.1)",
                      color: i.is_active ? "#86efac" : "white",
                    }}
                  >
                    {i.is_active ? "ativa" : "inativa"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold mb-3">Últimos leads</h3>
          {!recentLeads || recentLeads.length === 0 ? (
            <p className="text-sm text-white/50">Nenhum lead ainda.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {recentLeads.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <span className="truncate">{l.name}</span>
                  <span className="text-xs text-white/50">
                    {new Date(l.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold mb-3">Tickets abertos</h3>
          {!openTickets || openTickets.length === 0 ? (
            <p className="text-sm text-white/50">Nenhum ticket aberto.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {openTickets.map((t) => (
                <li key={t.id} className="flex justify-between gap-2">
                  <span className="truncate">{t.subject}</span>
                  <span className="text-[10px] uppercase rounded bg-white/10 px-1.5 py-0.5">
                    {t.priority}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold mb-3">Módulos liberados</h3>
          {modulesGranted.length === 0 ? (
            <p className="text-sm text-white/50">
              Nenhuma permissão por módulo definida.{" "}
              <Link href="/app/superadmin/permissoes" className="underline">
                Configurar
              </Link>
            </p>
          ) : (
            <ul className="space-y-2 text-sm">
              {modulesGranted.map((m) => (
                <li key={m.module} className="flex justify-between">
                  <span className="font-mono text-xs">{m.module}</span>
                  <span className="text-xs text-white/60">
                    {m.users} user{m.users !== 1 ? "s" : ""} · {m.writeUsers} escrita
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold mb-3">Audit logs</h3>
          {!logs || logs.length === 0 ? (
            <p className="text-sm text-white/50">Sem eventos.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {logs.map((l) => (
                <li key={l.id} className="flex justify-between">
                  <span>
                    <span className="text-white/70">{l.entity}</span>{" "}
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[10px]">
                      {l.action}
                    </span>
                  </span>
                  <span className="text-xs text-white/50">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-xs text-amber-200">
        <strong>Billing:</strong> integração com Asaas/Stripe ainda não conectada — MRR
        desta org não disponível.
      </div>
    </div>
  );
}
