import { createAdminClient } from "@/lib/superadmin/admin-client";
import { PageHeader } from "@/components/superadmin/page-header";
import { StatCard } from "@/components/superadmin/stat-card";
import { Database, Table2, Server, GitBranch } from "lucide-react";
import { ReloadSchemaButton } from "./reload-button";

export const dynamic = "force-dynamic";

const TABLES = [
  "organizations",
  "profiles",
  "organization_members",
  "companies",
  "contacts",
  "leads",
  "deals",
  "proposals",
  "products",
  "price_tables",
  "sequences",
  "prospecting_campaigns",
  "integrations",
  "integration_api_keys",
  "integration_webhook_events",
  "audit_logs",
  "activities",
  "notifications",
  "support_tickets",
  "ticket_messages",
  "shipments",
  "tracking_events",
  "cms_posts",
  "user_module_permissions",
];

const REQUIRED_ENVS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "OPENAI_API_KEY",
  "ANTHROPIC_API_KEY",
  "RESEND_API_KEY",
  "NEXT_PUBLIC_SITE_URL",
];

export default async function SistemaPage() {
  const admin = createAdminClient();
  const startedAt = Date.now();

  // Ping Supabase
  let pingMs: number | null = null;
  let pingOk = false;
  try {
    const t0 = Date.now();
    await admin.from("organizations").select("id", { count: "exact", head: true });
    pingMs = Date.now() - t0;
    pingOk = true;
  } catch {
    pingOk = false;
  }

  // Counts por tabela
  const counts = await Promise.all(
    TABLES.map(async (t) => {
      try {
        // @ts-expect-error tabela dinâmica
        const { count } = await admin.from(t).select("*", { count: "exact", head: true });
        return { table: t, count: count ?? 0, ok: true };
      } catch {
        return { table: t, count: 0, ok: false };
      }
    }),
  );

  const totalRows = counts.reduce((s, c) => s + c.count, 0);
  const tableCount = counts.length;

  const envStatus = REQUIRED_ENVS.map((name) => ({
    name,
    set: Boolean(process.env[name]),
    optional: name === "ANTHROPIC_API_KEY" || name === "RESEND_API_KEY",
  }));

  const commitSha =
    process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ??
    "dev";
  const env = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? "local";
  const region = process.env.VERCEL_REGION ?? "—";

  const totalMs = Date.now() - startedAt;

  return (
    <div>
      <PageHeader
        title="Sistema"
        description="Estado do banco, env vars e infraestrutura. Nenhum valor secreto é exposto."
        actions={<ReloadSchemaButton />}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard
          label="Supabase ping"
          value={pingOk ? `${pingMs}ms` : "fail"}
          accent={pingOk ? "navy" : "red"}
          icon={Server}
          hint={pingOk ? "leitura organizations" : "erro de conexão"}
        />
        <StatCard label="Tabelas monitoradas" value={tableCount} icon={Table2} />
        <StatCard
          label="Total de linhas"
          value={totalRows.toLocaleString("pt-BR")}
          icon={Database}
        />
        <StatCard
          label="Build"
          value={commitSha}
          icon={GitBranch}
          hint={`${env} · ${region}`}
        />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
          <h3 className="font-semibold mb-3">Tabelas e contagens</h3>
          <ul className="space-y-1.5 text-sm max-h-[460px] overflow-auto pr-1">
            {counts.map((c) => (
              <li
                key={c.table}
                className="flex justify-between border-b border-white/5 pb-1.5 last:border-0"
              >
                <span className={c.ok ? "" : "text-white/40"}>
                  {c.table}
                  {!c.ok ? " (sem acesso)" : ""}
                </span>
                <span className="font-mono text-white/70">
                  {c.count.toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
          <div className="mt-3 text-[11px] text-white/40">
            Tempo total de coleta: {totalMs}ms
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold mb-3">Variáveis de ambiente</h3>
            <ul className="space-y-2 text-sm">
              {envStatus.map((e) => (
                <li key={e.name} className="flex items-center justify-between">
                  <span className="font-mono text-xs">
                    {e.name}
                    {e.optional ? (
                      <span className="text-white/40 ml-1">(opcional)</span>
                    ) : null}
                  </span>
                  <span
                    className="rounded px-2 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: e.set
                        ? "rgba(34,197,94,0.2)"
                        : e.optional
                          ? "rgba(255,255,255,0.1)"
                          : "rgba(186,1,2,0.2)",
                      color: e.set
                        ? "#86efac"
                        : e.optional
                          ? "white"
                          : "#ff6b6c",
                    }}
                  >
                    {e.set ? "SET" : e.optional ? "—" : "MISSING"}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-[11px] text-white/40 mt-3">
              Apenas os NOMES são exibidos — valores nunca aparecem aqui.
            </p>
          </div>

          <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-5">
            <h3 className="font-semibold mb-3 text-amber-200">Restart de servidor</h3>
            <p className="text-xs text-amber-100/80">
              O restart do PostgREST / API não pode ser disparado do app — precisa ser
              feito pelo dashboard Supabase em <strong>Settings → Restart project</strong>.
              Recarregar o schema cache <em>pode</em> ser feito acima (botão no header).
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
            <h3 className="font-semibold mb-3">Links rápidos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  className="underline hover:text-white"
                  style={{ color: "#ff6b6c" }}
                  target="_blank"
                  rel="noreferrer"
                  href="https://supabase.com/dashboard/project/lfvuwrpfdnyqfxjaicba"
                >
                  → Supabase dashboard
                </a>
              </li>
              <li>
                <a
                  className="underline hover:text-white"
                  style={{ color: "#ff6b6c" }}
                  target="_blank"
                  rel="noreferrer"
                  href="https://supabase.com/dashboard/project/lfvuwrpfdnyqfxjaicba/sql/new"
                >
                  → Supabase SQL editor
                </a>
              </li>
              <li>
                <a
                  className="underline hover:text-white"
                  style={{ color: "#ff6b6c" }}
                  target="_blank"
                  rel="noreferrer"
                  href="https://supabase.com/dashboard/project/lfvuwrpfdnyqfxjaicba/auth/users"
                >
                  → Auth dashboard
                </a>
              </li>
              <li>
                <a
                  className="underline hover:text-white"
                  style={{ color: "#ff6b6c" }}
                  target="_blank"
                  rel="noreferrer"
                  href="https://vercel.com/dashboard"
                >
                  → Vercel dashboard
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
