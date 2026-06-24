"use client";

import { useState, useTransition } from "react";

export function BulkApplyClienteExterno() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 mb-4 flex flex-wrap items-center gap-3">
      <div className="flex-1 min-w-[260px]">
        <div className="text-sm font-semibold text-amber-200">
          Bootstrap rápido — cliente externo
        </div>
        <div className="text-xs text-amber-100/80">
          Aplica o preset <strong>cliente_externo</strong> (remessas, chamados, financeiro
          em modo leitura) a TODOS os usuários de TODAS as orgs que ainda não têm permissão
          configurada. Não sobrescreve permissões existentes.
        </div>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (
            !confirm(
              "Aplicar preset cliente_externo a TODOS os users sem permissão atual? Operação idempotente.",
            )
          )
            return;
          start(async () => {
            setMsg(null);
            try {
              const res = await fetch("/app/superadmin/permissoes/api", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ bulk: "cliente_externo_missing" }),
              });
              const j = await res.json();
              if (!res.ok) {
                setMsg(`✗ ${j.error ?? res.statusText}`);
                return;
              }
              setMsg(`✓ ${j.applied} linha(s) de permissão criada(s). ${j.message ?? ""}`);
            } catch (e) {
              setMsg(`✗ ${e instanceof Error ? e.message : "Erro"}`);
            }
          });
        }}
        className="rounded-md px-3 py-2 text-xs font-semibold border border-amber-400/40 text-amber-100 hover:bg-amber-400/10 disabled:opacity-40"
      >
        {pending ? "Aplicando..." : "Aplicar bulk"}
      </button>
      {msg ? (
        <div className="basis-full text-xs text-amber-100">{msg}</div>
      ) : null}
    </div>
  );
}
