import { createAdminClient } from "@/lib/superadmin/admin-client";
import { getOrgNamesMap, getUserEmailsMap } from "@/lib/queries/superadmin";
import { PageHeader } from "@/components/superadmin/page-header";
import { LogDetailButton } from "./log-detail";

export const dynamic = "force-dynamic";

export default async function AuditoriaPage({
  searchParams,
}: {
  searchParams: Promise<{
    org?: string;
    action?: string;
    entity?: string;
    user?: string;
    period?: string;
  }>;
}) {
  const sp = await searchParams;
  const admin = createAdminClient();

  let q = admin
    .from("audit_logs")
    .select("id, entity, entity_id, action, organization_id, user_id, created_at, diff, ip")
    .order("created_at", { ascending: false });

  if (sp.org) q = q.eq("organization_id", sp.org);
  if (sp.user) q = q.eq("user_id", sp.user);
  if (sp.action) q = q.eq("action", sp.action);
  if (sp.entity) q = q.eq("entity", sp.entity);

  if (sp.period) {
    const now = Date.now();
    const map: Record<string, number> = {
      "1h": 60 * 60 * 1000,
      "24h": 24 * 60 * 60 * 1000,
      "7d": 7 * 24 * 60 * 60 * 1000,
      "30d": 30 * 24 * 60 * 60 * 1000,
    };
    const ms = map[sp.period];
    if (ms) {
      q = q.gte("created_at", new Date(now - ms).toISOString());
    }
  }

  const { data: logs } = await q.limit(300);
  const list = (logs ?? []) as Array<{
    id: string;
    entity: string;
    entity_id: string | null;
    action: string;
    organization_id: string;
    user_id: string | null;
    created_at: string;
    diff: unknown;
    ip: string | null;
  }>;

  // Distinct entities/actions pra filtros
  const entities = Array.from(new Set(list.map((l) => l.entity))).sort();
  const actions = Array.from(new Set(list.map((l) => l.action))).sort();
  const orgIds = Array.from(new Set(list.map((l) => l.organization_id)));
  const userIds = Array.from(
    new Set(list.map((l) => l.user_id).filter((x): x is string => !!x)),
  );
  const [orgMap, userMap] = await Promise.all([
    getOrgNamesMap(orgIds),
    getUserEmailsMap(userIds),
  ]);

  return (
    <div>
      <PageHeader
        title="Auditoria global"
        description={`${list.length} evento${list.length !== 1 ? "s" : ""} (últimos 300).`}
      />

      <form className="mb-4 flex flex-wrap gap-2" action="" method="get">
        <input
          name="org"
          defaultValue={sp.org ?? ""}
          placeholder="UUID da org"
          className="flex-1 min-w-[180px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono"
        />
        <input
          name="user"
          defaultValue={sp.user ?? ""}
          placeholder="UUID do user"
          className="flex-1 min-w-[180px] rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-mono"
        />
        <select
          name="entity"
          defaultValue={sp.entity ?? ""}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="">Toda entidade</option>
          {entities.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
        <select
          name="action"
          defaultValue={sp.action ?? ""}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="">Toda ação</option>
          {actions.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <select
          name="period"
          defaultValue={sp.period ?? ""}
          className="rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm"
        >
          <option value="">Qualquer período</option>
          <option value="1h">Última hora</option>
          <option value="24h">Últimas 24h</option>
          <option value="7d">Últimos 7 dias</option>
          <option value="30d">Últimos 30 dias</option>
        </select>
        <button
          type="submit"
          className="rounded-md px-4 py-2 text-sm font-semibold"
          style={{ background: "#BA0102" }}
        >
          Filtrar
        </button>
      </form>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-white/60 text-xs uppercase">
              <th className="py-3 px-4">Quando</th>
              <th className="py-3 px-4">Entidade</th>
              <th className="py-3 px-4">Ação</th>
              <th className="py-3 px-4">Org</th>
              <th className="py-3 px-4">Usuário</th>
              <th className="py-3 px-4 text-right">Detalhe</th>
            </tr>
          </thead>
          <tbody>
            {list.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 px-4 text-center text-white/50">
                  Nenhum evento encontrado.
                </td>
              </tr>
            ) : (
              list.map((l) => (
                <tr key={l.id} className="border-t border-white/5 hover:bg-white/5">
                  <td className="py-3 px-4 text-white/70 text-xs whitespace-nowrap">
                    {new Date(l.created_at).toLocaleString("pt-BR")}
                  </td>
                  <td className="py-3 px-4">{l.entity}</td>
                  <td className="py-3 px-4">
                    <span className="rounded bg-white/10 px-2 py-0.5 text-xs">
                      {l.action}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs text-white/70">
                    {orgMap.get(l.organization_id) ?? l.organization_id.slice(0, 8) + "…"}
                  </td>
                  <td className="py-3 px-4 text-xs text-white/70">
                    {l.user_id
                      ? (userMap.get(l.user_id) ?? l.user_id.slice(0, 8) + "…")
                      : "—"}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <LogDetailButton log={l} />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
