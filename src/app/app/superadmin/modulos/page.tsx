import { PageHeader } from "@/components/superadmin/page-header";
import { DangerButton } from "@/components/superadmin/danger-button";
import { listModules, isEnforcementOn } from "@/lib/superadmin/entitlements-admin";
import { upsertModule, deleteModule } from "./actions";
import { ActiveToggle } from "./active-toggle";
import { EnforcementToggle } from "./enforcement-toggle";

export const dynamic = "force-dynamic";

export default async function ModulosPage() {
  const modules = await listModules();
  const enforced = await isEnforcementOn();

  // Agrupa por module_group preservando ordem
  const groups: Array<{ group: string; items: typeof modules }> = [];
  for (const m of modules) {
    const g = m.module_group ?? "Outros";
    let bucket = groups.find((x) => x.group === g);
    if (!bucket) {
      bucket = { group: g, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(m);
  }

  const inputCls =
    "w-full rounded bg-white/5 border border-white/10 px-2 py-1 text-sm";

  return (
    <div>
      <PageHeader
        title="Catálogo de Módulos"
        description="A fonte da verdade dos módulos vendáveis. Inclua, altere ou exclua qualquer módulo. Desativar bloqueia o módulo em TODAS as orgs (quando o enforcement estiver ligado)."
      />

      <div className="mb-6">
        <EnforcementToggle enabled={enforced} />
      </div>

      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold mb-2">
              {g.group}
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {g.items.map((m) => (
                <div
                  key={m.key}
                  className="rounded-xl border border-white/10 bg-white/[0.03] p-4"
                >
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="min-w-0">
                      <div className="font-semibold truncate">
                        {m.label}{" "}
                        <span className="text-[10px] font-mono text-white/40">{m.key}</span>
                      </div>
                      <div className="text-xs text-white/50">
                        {m.is_addon ? "add-on (avulso)" : "core"} · ordem {m.sort_order}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <ActiveToggle moduleKey={m.key} initial={m.active} />
                      <DangerButton
                        label="Excluir"
                        confirmText={m.key}
                        onConfirm={async () => {
                          "use server";
                          await deleteModule(m.key);
                        }}
                      />
                    </div>
                  </div>
                  <form action={upsertModule} className="grid grid-cols-2 gap-2">
                    <input type="hidden" name="key" value={m.key} />
                    <div className="col-span-2">
                      <label className="text-[11px] text-white/50 block mb-1">Rótulo</label>
                      <input name="label" defaultValue={m.label} className={inputCls} />
                    </div>
                    <div className="col-span-2">
                      <label className="text-[11px] text-white/50 block mb-1">Descrição</label>
                      <input
                        name="description"
                        defaultValue={m.description ?? ""}
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/50 block mb-1">Grupo</label>
                      <input name="group" defaultValue={m.module_group ?? ""} className={inputCls} />
                    </div>
                    <div>
                      <label className="text-[11px] text-white/50 block mb-1">Ordem</label>
                      <input
                        name="sort"
                        type="number"
                        defaultValue={m.sort_order}
                        className={inputCls}
                      />
                    </div>
                    <label className="col-span-2 flex items-center gap-2 text-xs">
                      <input type="checkbox" name="is_addon" value="on" defaultChecked={m.is_addon} />
                      É add-on (candidato a venda avulsa)
                    </label>
                    <button
                      type="submit"
                      className="col-span-2 rounded-md bg-[#BA0102] hover:bg-[#a10002] px-3 py-1.5 text-xs font-semibold"
                    >
                      Salvar alterações
                    </button>
                  </form>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Novo módulo */}
      <h2 className="text-lg font-semibold mt-8 mb-2">+ Adicionar módulo</h2>
      <p className="text-xs text-white/50 mb-3">
        ⚠️ A chave deve casar com a usada no código (nav + <code>requireOrgModule</code>) —
        ver <code>MANAGED_MODULE_KEYS</code> em <code>src/lib/entitlements.ts</code>.
      </p>
      <form
        action={upsertModule}
        className="grid gap-2 sm:grid-cols-2 md:grid-cols-4 rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4"
      >
        <div>
          <label className="text-[11px] text-white/50 block mb-1">Chave (slug)</label>
          <input name="key" placeholder="ex: flow_builder" className={inputCls + " font-mono"} />
        </div>
        <div>
          <label className="text-[11px] text-white/50 block mb-1">Rótulo</label>
          <input name="label" placeholder="ex: Construtor de Fluxos" className={inputCls} />
        </div>
        <div>
          <label className="text-[11px] text-white/50 block mb-1">Grupo</label>
          <input name="group" placeholder="ex: Atendimento" className={inputCls} />
        </div>
        <div>
          <label className="text-[11px] text-white/50 block mb-1">Ordem</label>
          <input name="sort" type="number" placeholder="0" className={inputCls} />
        </div>
        <div className="sm:col-span-2 md:col-span-4">
          <label className="text-[11px] text-white/50 block mb-1">Descrição</label>
          <input name="description" placeholder="Opcional" className={inputCls} />
        </div>
        <label className="flex items-center gap-2 text-xs sm:col-span-2 md:col-span-3">
          <input type="checkbox" name="is_addon" value="on" />
          É add-on (candidato a venda avulsa)
        </label>
        <button
          type="submit"
          className="rounded-md bg-[#BA0102] hover:bg-[#a10002] px-3 py-1.5 text-xs font-semibold"
        >
          Criar módulo
        </button>
      </form>
    </div>
  );
}
