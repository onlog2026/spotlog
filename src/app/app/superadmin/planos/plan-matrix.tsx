"use client";

import { Fragment, useState, useTransition } from "react";
import { togglePlanModule } from "./actions";

type Plan = { key: string; name: string };
type Module = { key: string; label: string; module_group: string | null };

export function PlanMatrix({
  plans,
  modules,
  initial,
}: {
  plans: Plan[];
  modules: Module[];
  /** Set de "planKey::moduleKey" habilitados. */
  initial: string[];
}) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(initial));
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  const key = (p: string, m: string) => `${p}::${m}`;

  function toggle(planKey: string, moduleKey: string) {
    const k = key(planKey, moduleKey);
    const next = new Set(enabled);
    const willEnable = !next.has(k);
    if (willEnable) next.add(k);
    else next.delete(k);
    setEnabled(next); // otimista
    setBusy(k);
    startTransition(async () => {
      try {
        await togglePlanModule(planKey, moduleKey, willEnable);
      } catch (e) {
        // reverte em erro
        setEnabled((cur) => {
          const rb = new Set(cur);
          if (willEnable) rb.delete(k);
          else rb.add(k);
          return rb;
        });
        alert((e as Error).message);
      } finally {
        setBusy(null);
      }
    });
  }

  // Agrupa módulos por module_group preservando ordem
  const groups: Array<{ group: string; items: Module[] }> = [];
  for (const m of modules) {
    const g = m.module_group ?? "Outros";
    let bucket = groups.find((x) => x.group === g);
    if (!bucket) {
      bucket = { group: g, items: [] };
      groups.push(bucket);
    }
    bucket.items.push(m);
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10 bg-white/[0.03]">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left px-4 py-3 font-semibold sticky left-0 bg-[#010f3d] z-10">
              Módulo
            </th>
            {plans.map((p) => (
              <th key={p.key} className="px-3 py-3 text-center font-semibold whitespace-nowrap">
                {p.name}
                <div className="text-[10px] font-normal text-white/40 font-mono">{p.key}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {groups.map((g) => (
            <Fragment key={g.group}>
              <tr className="bg-white/[0.02]">
                <td
                  colSpan={plans.length + 1}
                  className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-white/50 font-semibold"
                >
                  {g.group}
                </td>
              </tr>
              {g.items.map((m) => (
                <tr key={m.key} className="border-b border-white/5 hover:bg-white/[0.02]">
                  <td className="px-4 py-2 sticky left-0 bg-[#011960] z-10">
                    <div>{m.label}</div>
                    <div className="text-[10px] text-white/40 font-mono">{m.key}</div>
                  </td>
                  {plans.map((p) => {
                    const k = key(p.key, m.key);
                    const on = enabled.has(k);
                    return (
                      <td key={p.key} className="px-3 py-2 text-center">
                        <button
                          type="button"
                          disabled={pending && busy === k}
                          onClick={() => toggle(p.key, m.key)}
                          aria-pressed={on}
                          className={
                            "inline-flex h-6 w-11 items-center rounded-full transition " +
                            (on ? "bg-green-500/80" : "bg-white/15") +
                            (busy === k ? " opacity-50" : "")
                          }
                          title={on ? "Incluído no plano" : "Fora do plano"}
                        >
                          <span
                            className={
                              "h-5 w-5 rounded-full bg-white transition-transform " +
                              (on ? "translate-x-5" : "translate-x-0.5")
                            }
                          />
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
