"use client";

import { useState, useTransition } from "react";
import { ChevronDown, ChevronUp, Sparkles } from "lucide-react";
import type { ModuleDef, ModuleKey } from "@/lib/permissions";

type Membership = {
  organization_id: string;
  org_name: string;
  role: string;
};

type Permission = {
  organization_id: string;
  module: ModuleKey;
  can_read: boolean;
  can_write: boolean;
};

type Props = {
  userId: string;
  email: string;
  fullName: string | null;
  memberships: Membership[];
  modules: ModuleDef[];
  permissions: Permission[];
};

const PRESETS = [
  { key: "cliente_externo", label: "Cliente Externo" },
  { key: "operador_sac", label: "Operador SAC" },
  { key: "comercial", label: "Comercial" },
  { key: "financeiro", label: "Financeiro" },
  { key: "operacoes", label: "Operações" },
  { key: "admin_completo", label: "Admin Completo" },
];

export function PermissionsManager(props: Props) {
  const [open, setOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(
    props.memberships[0]?.organization_id ?? "",
  );
  const [perms, setPerms] = useState<Permission[]>(props.permissions);
  const [pending, startTransition] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  const groups = Array.from(new Set(props.modules.map((m) => m.group)));

  function findPerm(orgId: string, module: ModuleKey): Permission | undefined {
    return perms.find((p) => p.organization_id === orgId && p.module === module);
  }

  async function updatePerm(
    module: ModuleKey,
    can_read: boolean,
    can_write: boolean,
  ) {
    if (!selectedOrg) return;
    setMsg(null);
    startTransition(async () => {
      const res = await fetch("/app/superadmin/permissoes/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: props.userId,
          organization_id: selectedOrg,
          module,
          can_read,
          can_write,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(`Erro: ${j.error ?? res.statusText}`);
        return;
      }
      // Atualiza estado local
      setPerms((prev) => {
        const filtered = prev.filter(
          (p) => !(p.organization_id === selectedOrg && p.module === module),
        );
        if (can_read || can_write) {
          filtered.push({ organization_id: selectedOrg, module, can_read, can_write });
        }
        return filtered;
      });
      setMsg("Permissão atualizada.");
    });
  }

  async function applyPreset(preset: string) {
    if (!selectedOrg) return;
    setMsg(null);
    startTransition(async () => {
      const res = await fetch("/app/superadmin/permissoes/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: props.userId,
          organization_id: selectedOrg,
          preset,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setMsg(`Erro: ${j.error ?? res.statusText}`);
        return;
      }
      const j = await res.json();
      setMsg(`Preset aplicado (${j.applied} módulos). Recarregue para ver.`);
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-white/5 transition text-left"
      >
        <div>
          <div className="font-semibold">
            {props.fullName ?? "(sem nome)"}{" "}
            <span className="text-white/50 font-normal">· {props.email}</span>
          </div>
          <div className="text-xs text-white/50 mt-1">
            {props.memberships.length} organização(ões) · {perms.length} permissão(ões) ativa(s)
          </div>
        </div>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {open && (
        <div className="border-t border-white/10 p-4 space-y-4">
          {props.memberships.length === 0 ? (
            <div className="text-sm text-white/60">
              Usuário sem organização. Adicione em /superadmin/usuarios.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-3">
                <label className="text-xs uppercase tracking-wider text-white/60 font-semibold">
                  Organização
                </label>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="rounded-md border border-white/10 bg-white/5 px-3 py-1.5 text-sm focus:outline-none focus:border-white/30"
                >
                  {props.memberships.map((m) => (
                    <option key={m.organization_id} value={m.organization_id}>
                      {m.org_name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-wrap items-center gap-2 p-3 rounded-lg bg-white/5 border border-white/10">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span className="text-xs font-semibold text-white/80">Presets:</span>
                {PRESETS.map((p) => (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => applyPreset(p.key)}
                    disabled={pending}
                    className="text-xs rounded-md border border-white/15 px-2 py-1 hover:bg-white/10 transition disabled:opacity-50"
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              {msg && (
                <div className="text-xs px-3 py-2 rounded-md bg-white/10 border border-white/15">
                  {msg}
                </div>
              )}

              {groups.map((group) => (
                <div key={group}>
                  <div className="text-xs uppercase tracking-wider text-white/50 font-semibold mb-2">
                    {group}
                  </div>
                  <div className="space-y-1">
                    {props.modules
                      .filter((m) => m.group === group)
                      .map((m) => {
                        const cur = findPerm(selectedOrg, m.key);
                        const r = cur?.can_read ?? false;
                        const w = cur?.can_write ?? false;
                        return (
                          <div
                            key={m.key}
                            className="flex items-center justify-between gap-3 p-2 rounded-md hover:bg-white/5"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium">{m.label}</div>
                              <div className="text-[10px] text-white/40 font-mono">{m.key}</div>
                            </div>
                            <div className="flex items-center gap-3 text-xs">
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={r}
                                  disabled={pending}
                                  onChange={(e) =>
                                    updatePerm(m.key, e.target.checked, w && e.target.checked)
                                  }
                                  className="accent-[#BA0102]"
                                />
                                Ler
                              </label>
                              <label className="flex items-center gap-1 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={w}
                                  disabled={pending}
                                  onChange={(e) =>
                                    updatePerm(m.key, e.target.checked ? true : r, e.target.checked)
                                  }
                                  className="accent-[#BA0102]"
                                />
                                Escrever
                              </label>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
