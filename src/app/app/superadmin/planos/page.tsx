import { PageHeader } from "@/components/superadmin/page-header";
import { DangerButton } from "@/components/superadmin/danger-button";
import {
  listModules,
  listPlans,
  listPlanModules,
  countOrgsByPlan,
  isEnforcementOn,
} from "@/lib/superadmin/entitlements-admin";
import { PlanMatrix } from "./plan-matrix";
import { upsertPlan, deletePlan } from "./actions";

export const dynamic = "force-dynamic";

function reais(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function PlanosPage() {
  const [modules, plans, planModules, orgCounts, enforced] = await Promise.all([
    listModules(),
    listPlans(),
    listPlanModules(),
    countOrgsByPlan(),
    isEnforcementOn(),
  ]);

  const initial = planModules.map((pm) => `${pm.plan_key}::${pm.module_key}`);

  return (
    <div>
      <PageHeader
        title="Planos & Módulos"
        description="Defina os planos vendáveis e quais módulos cada um libera. É o que torna cada módulo comercializável por organização."
      />

      {/* Status do enforcement */}
      <div
        className={
          "mb-6 rounded-xl border p-4 text-sm " +
          (enforced
            ? "border-green-500/30 bg-green-500/5 text-green-200"
            : "border-amber-500/30 bg-amber-500/5 text-amber-200")
        }
      >
        <strong>Enforcement de módulos: {enforced ? "LIGADO" : "DESLIGADO"}.</strong>{" "}
        {enforced
          ? "As organizações só acessam os módulos do seu plano (+ overrides)."
          : "Estado neutro — TODAS as organizações acessam TODOS os módulos, independentemente do plano. As configurações abaixo ficam prontas, mas só passam a valer quando o enforcement for ligado (após alinhar catálogo e back-fill dos planos)."}
      </div>

      {/* Matriz plano × módulo */}
      <h2 className="text-lg font-semibold mb-3">Quais módulos cada plano inclui</h2>
      <PlanMatrix
        plans={plans.map((p) => ({ key: p.key, name: p.name }))}
        modules={modules.map((m) => ({
          key: m.key,
          label: m.label,
          module_group: m.module_group,
        }))}
        initial={initial}
      />

      {/* Lista/edição de planos */}
      <h2 className="text-lg font-semibold mt-8 mb-3">Planos</h2>
      <div className="grid gap-3 md:grid-cols-2">
        {plans.map((p) => (
          <div key={p.key} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <div className="flex items-start justify-between gap-2 mb-3">
              <div>
                <div className="font-semibold">
                  {p.name}{" "}
                  <span className="text-[10px] font-mono text-white/40">{p.key}</span>
                </div>
                <div className="text-xs text-white/60">
                  {reais(p.price_cents)} / {p.billing_period === "monthly" ? "mês" : p.billing_period}
                  {" · "}
                  {orgCounts[p.key] ?? 0} org(s)
                  {p.active ? "" : " · inativo"}
                </div>
              </div>
              <DangerButton
                label="Excluir"
                confirmText={p.key}
                onConfirm={async () => {
                  "use server";
                  await deletePlan(p.key);
                }}
              />
            </div>
            <form action={upsertPlan} className="grid grid-cols-2 gap-2 text-sm">
              <input type="hidden" name="key" value={p.key} />
              <label className="col-span-2 text-[11px] text-white/50">Nome</label>
              <input
                name="name"
                defaultValue={p.name}
                className="col-span-2 rounded bg-white/5 border border-white/10 px-2 py-1"
              />
              <label className="text-[11px] text-white/50">Preço (R$/mês)</label>
              <label className="text-[11px] text-white/50">Ordem</label>
              <input
                name="price"
                defaultValue={(p.price_cents / 100).toString()}
                inputMode="decimal"
                className="rounded bg-white/5 border border-white/10 px-2 py-1"
              />
              <input
                name="sort"
                type="number"
                defaultValue={p.sort_order}
                className="rounded bg-white/5 border border-white/10 px-2 py-1"
              />
              <label className="col-span-2 flex items-center gap-2 text-xs">
                <input type="checkbox" name="active" defaultChecked={p.active} value="on" />
                Ativo (aparece pra venda)
              </label>
              <button
                type="submit"
                className="col-span-2 rounded-md bg-[#BA0102] hover:bg-[#a10002] px-3 py-1.5 text-xs font-semibold"
              >
                Salvar
              </button>
            </form>
          </div>
        ))}

        {/* Novo plano */}
        <div className="rounded-xl border border-dashed border-white/20 bg-white/[0.02] p-4">
          <div className="font-semibold mb-3">+ Novo plano</div>
          <form action={upsertPlan} className="grid grid-cols-2 gap-2 text-sm">
            <label className="text-[11px] text-white/50">Chave (slug)</label>
            <label className="text-[11px] text-white/50">Nome</label>
            <input
              name="key"
              placeholder="ex: pro"
              className="rounded bg-white/5 border border-white/10 px-2 py-1 font-mono"
            />
            <input
              name="name"
              placeholder="ex: Profissional"
              className="rounded bg-white/5 border border-white/10 px-2 py-1"
            />
            <label className="text-[11px] text-white/50">Preço (R$/mês)</label>
            <label className="text-[11px] text-white/50">Ordem</label>
            <input
              name="price"
              placeholder="0"
              inputMode="decimal"
              className="rounded bg-white/5 border border-white/10 px-2 py-1"
            />
            <input
              name="sort"
              type="number"
              placeholder="0"
              className="rounded bg-white/5 border border-white/10 px-2 py-1"
            />
            <button
              type="submit"
              className="col-span-2 rounded-md bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-semibold"
            >
              Criar plano
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
