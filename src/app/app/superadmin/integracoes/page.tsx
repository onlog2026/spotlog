import { createAdminClient } from "@/lib/superadmin/admin-client";
import { getOrgNamesMap } from "@/lib/queries/superadmin";
import { PageHeader } from "@/components/superadmin/page-header";
import { RevokeKeyButton, ToggleIntegrationButton } from "./revoke-button";

export const dynamic = "force-dynamic";

export default async function IntegracoesPage() {
  const admin = createAdminClient();

  const [{ data: integs }, { data: apiKeys }, { data: webhookEvents }] =
    await Promise.all([
      admin
        .from("integrations")
        .select(
          "id, provider, display_name, is_active, organization_id, updated_at, last_test_ok, last_test_at",
        )
        .order("updated_at", { ascending: false })
        .limit(500),
      admin
        .from("integration_api_keys")
        .select(
          "id, name, token_prefix, scopes, active, organization_id, last_used_at, created_at, expires_at",
        )
        .order("created_at", { ascending: false })
        .limit(200),
      admin
        .from("integration_webhook_events")
        .select(
          "id, source, event_type, organization_id, processed, error_message, received_at",
        )
        .order("received_at", { ascending: false })
        .limit(50),
    ]);

  const integList = (integs ?? []) as Array<{
    id: string;
    provider: string;
    display_name: string | null;
    is_active: boolean;
    organization_id: string;
    updated_at: string | null;
    last_test_ok: boolean | null;
    last_test_at: string | null;
  }>;
  const keyList = (apiKeys ?? []) as Array<{
    id: string;
    name: string;
    token_prefix: string;
    scopes: string[] | null;
    active: boolean;
    organization_id: string;
    last_used_at: string | null;
    created_at: string;
    expires_at: string | null;
  }>;
  const eventList = (webhookEvents ?? []) as Array<{
    id: string;
    source: string;
    event_type: string;
    organization_id: string;
    processed: boolean;
    error_message: string | null;
    received_at: string;
  }>;

  // Map orgs
  const orgIds = new Set<string>([
    ...integList.map((i) => i.organization_id),
    ...keyList.map((k) => k.organization_id),
    ...eventList.map((e) => e.organization_id),
  ]);
  const orgMap = await getOrgNamesMap(Array.from(orgIds));

  // Resumo por provider
  const byProvider = new Map<string, { total: number; active: number }>();
  integList.forEach((i) => {
    const cur = byProvider.get(i.provider) ?? { total: 0, active: 0 };
    cur.total += 1;
    if (i.is_active) cur.active += 1;
    byProvider.set(i.provider, cur);
  });

  return (
    <div>
      <PageHeader
        title="Integrações"
        description={`${integList.length} integraç${integList.length !== 1 ? "ões" : "ão"}, ${keyList.length} API key${keyList.length !== 1 ? "s" : ""}, ${eventList.length} webhook event${eventList.length !== 1 ? "s" : ""} recente${eventList.length !== 1 ? "s" : ""}.`}
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {Array.from(byProvider.entries()).map(([provider, stats]) => (
          <div
            key={provider}
            className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
          >
            <div className="text-xs uppercase tracking-wide text-white/60">{provider}</div>
            <div className="mt-1 text-2xl font-bold">{stats.total}</div>
            <div className="mt-1 text-[11px] text-white/50">{stats.active} ativa(s)</div>
          </div>
        ))}
        {byProvider.size === 0 ? (
          <div className="col-span-full rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-white/50">
            Nenhuma integração configurada ainda.
          </div>
        ) : null}
      </div>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">Integrações configuradas</h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 text-xs uppercase">
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Organização</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Último teste</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {integList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-white/50">
                    Nenhuma integração ainda.
                  </td>
                </tr>
              ) : (
                integList.map((i) => (
                  <tr key={i.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 font-medium">{i.provider}</td>
                    <td className="py-3 px-4 text-white/70">{i.display_name ?? "—"}</td>
                    <td className="py-3 px-4 text-white/70">
                      {orgMap.get(i.organization_id) ?? "—"}
                    </td>
                    <td className="py-3 px-4">
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
                    </td>
                    <td className="py-3 px-4 text-white/60 text-xs">
                      {i.last_test_at ? (
                        <>
                          {new Date(i.last_test_at).toLocaleString("pt-BR")}{" "}
                          {i.last_test_ok === false ? (
                            <span className="text-red-300">(falhou)</span>
                          ) : i.last_test_ok ? (
                            <span className="text-green-300">(ok)</span>
                          ) : null}
                        </>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <ToggleIntegrationButton integId={i.id} isActive={i.is_active} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mb-6">
        <h2 className="text-lg font-semibold mb-3">API Keys</h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 text-xs uppercase">
                <th className="py-3 px-4">Nome</th>
                <th className="py-3 px-4">Prefix</th>
                <th className="py-3 px-4">Organização</th>
                <th className="py-3 px-4">Scopes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Último uso</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {keyList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 px-4 text-center text-white/50">
                    Nenhuma API key gerada.
                  </td>
                </tr>
              ) : (
                keyList.map((k) => (
                  <tr key={k.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 font-medium">{k.name}</td>
                    <td className="py-3 px-4 font-mono text-xs text-white/60">
                      {k.token_prefix}…
                    </td>
                    <td className="py-3 px-4 text-white/70">
                      {orgMap.get(k.organization_id) ?? "—"}
                    </td>
                    <td className="py-3 px-4 text-xs text-white/60">
                      {k.scopes?.join(", ") ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="rounded px-2 py-0.5 text-xs"
                        style={{
                          background: k.active
                            ? "rgba(34,197,94,0.2)"
                            : "rgba(186,1,2,0.2)",
                          color: k.active ? "#86efac" : "#ff6b6c",
                        }}
                      >
                        {k.active ? "ativa" : "revogada"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-white/60 text-xs">
                      {k.last_used_at
                        ? new Date(k.last_used_at).toLocaleDateString("pt-BR")
                        : "nunca"}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {k.active ? <RevokeKeyButton keyId={k.id} /> : <span className="text-xs text-white/40">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Webhook events recentes</h2>
        <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/60 text-xs uppercase">
                <th className="py-3 px-4">Quando</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Organização</th>
                <th className="py-3 px-4">Processado</th>
                <th className="py-3 px-4">Erro</th>
              </tr>
            </thead>
            <tbody>
              {eventList.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-white/50">
                    Nenhum webhook recebido nas últimas execuções.
                  </td>
                </tr>
              ) : (
                eventList.map((e) => (
                  <tr key={e.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="py-3 px-4 text-white/70 text-xs whitespace-nowrap">
                      {new Date(e.received_at).toLocaleString("pt-BR")}
                    </td>
                    <td className="py-3 px-4">{e.source}</td>
                    <td className="py-3 px-4 font-mono text-xs">{e.event_type}</td>
                    <td className="py-3 px-4 text-white/70">
                      {orgMap.get(e.organization_id) ?? "—"}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className="rounded px-2 py-0.5 text-xs"
                        style={{
                          background: e.processed
                            ? "rgba(34,197,94,0.2)"
                            : "rgba(255,255,255,0.1)",
                          color: e.processed ? "#86efac" : "white",
                        }}
                      >
                        {e.processed ? "ok" : "pendente"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-xs text-red-300 max-w-[220px] truncate" title={e.error_message ?? ""}>
                      {e.error_message ?? "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
