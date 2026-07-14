"use client";

import { useState, useTransition } from "react";
import { setOrgPlan, setOrgModuleOverride } from "./actions";

type Plan = { key: string; name: string };
type Row = {
  key: string;
  label: string;
  group: string;
  inPlan: boolean;
  override: boolean | null; // null = segue o plano
  effective: boolean;
};

export function OrgEntitlements({
  orgId,
  plan,
  plans,
  rows,
  enforced,
}: {
  orgId: string;
  plan: string;
  plans: Plan[];
  rows: Row[];
  enforced: boolean;
}) {
  const [currentPlan, setCurrentPlan] = useState(plan);
  const [state, setState] = useState<Record<string, boolean | null>>(
    Object.fromEntries(rows.map((r) => [r.key, r.override])),
  );
  const [pending, startTransition] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);

  function changePlan(next: string) {
    const prev = currentPlan;
    setCurrentPlan(next);
    setBusy("__plan__");
    startTransition(async () => {
      try {
        await setOrgPlan(orgId, next);
      } catch (e) {
        setCurrentPlan(prev);
        alert((e as Error).message);
      } finally {
        setBusy(null);
      }
    });
  }

  function setOverride(moduleKey: string, mode: "plan" | "on" | "off") {
    const prev = state[moduleKey];
    const nextVal = mode === "plan" ? null : mode === "on";
    setState((s) => ({ ...s, [moduleKey]: nextVal }));
    setBusy(moduleKey);
    startTransition(async () => {
      try {
        await setOrgModuleOverride(orgId, moduleKey, mode);
      } catch (e) {
        setState((s) => ({ ...s, [moduleKey]: prev }));
        alert((e as Error).message);
      } finally {
        setBusy(null);
      }
    });
  }

  // Agrupa por grupo
  const groups: Array<{ group: string; items: Row[] }> = [];
  for (const r of rows) {
    let b = groups.find((x) => x.group === r.group);
    if (!b) {
      b = { group: r.group, items: [] };
      groups.push(b);
    }
    b.items.push(r);
  }

  const modes: Array<{ v: "plan" | "on" | "off"; label: string }> = [
    { v: "plan", label: "Segue plano" },
    { v: "on", label: "Ligado" },
    { v: "off", label: "Desligado" },
  ];

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 md:col-span-2">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h3 className="font-semibold">Plano &amp; Módulos (Eixo A — venda)</h3>
        <label className="flex items-center gap-2 text-sm">
          <span className="text-white/60">Plano:</span>
          <select
            value={currentPlan}
            onChange={(e) => changePlan(e.target.value)}
            disabled={pending && busy === "__plan__"}
            className="rounded bg-[#010f3d] border border-white/15 px-2 py-1 text-sm"
          >
            {plans.map((p) => (
              <option key={p.key} value={p.key}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </label>
      </div>

      {!enforced && (
        <div className="mb-4 rounded-md border border-amber-500/30 bg-amber-500/5 p-2.5 text-xs text-amber-200">
          Enforcement DESLIGADO — estas escolhas ficam salvas mas ainda não bloqueiam nada.
        </div>
      )}

      <div className="space-y-4">
        {groups.map((g) => (
          <div key={g.group}>
            <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold mb-1.5">
              {g.group}
            </div>
            <div className="space-y-1.5">
              {g.items.map((r) => {
                const ov = state[r.key];
                const effective = ov !== null ? ov : r.inPlan;
                const activeMode: "plan" | "on" | "off" =
                  ov === null ? "plan" : ov ? "on" : "off";
                return (
                  <div
                    key={r.key}
                    className="flex items-center justify-between gap-3 rounded-md bg-white/[0.02] px-3 py-1.5"
                  >
                    <div className="min-w-0">
                      <span className="text-sm">{r.label}</span>{" "}
                      <span className="text-[10px] font-mono text-white/40">{r.key}</span>
                      <span className="ml-2 text-[10px] text-white/40">
                        {r.inPlan ? "no plano" : "fora do plano"}
                        {" · "}
                        <span className={effective ? "text-green-300" : "text-white/40"}>
                          {effective ? "acesso" : "sem acesso"}
                        </span>
                      </span>
                    </div>
                    <div className="flex rounded-md overflow-hidden border border-white/10 shrink-0">
                      {modes.map((m) => (
                        <button
                          key={m.v}
                          type="button"
                          disabled={pending && busy === r.key}
                          onClick={() => setOverride(r.key, m.v)}
                          className={
                            "px-2 py-1 text-[11px] transition " +
                            (activeMode === m.v
                              ? m.v === "off"
                                ? "bg-[#BA0102] text-white"
                                : m.v === "on"
                                  ? "bg-green-600 text-white"
                                  : "bg-white/20 text-white"
                              : "text-white/60 hover:bg-white/10") +
                            (busy === r.key ? " opacity-50" : "")
                          }
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
