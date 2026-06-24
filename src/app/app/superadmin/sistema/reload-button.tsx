"use client";

import { useState, useTransition } from "react";
import { reloadPostgrestSchema } from "./actions";

export function ReloadSchemaButton() {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Recarregar o schema cache do PostgREST? Pode causar 0.5s de latência extra na próxima request.")) return;
          start(async () => {
            const res = await reloadPostgrestSchema();
            if (res.ok) {
              setMsg("✓ Schema recarregado.");
            } else {
              setMsg(`✗ ${res.message ?? "Erro"}`);
            }
            setTimeout(() => setMsg(null), 6000);
          });
        }}
        className="rounded-md px-3 py-1.5 text-xs font-semibold border border-white/20 hover:bg-white/10 disabled:opacity-40"
      >
        {pending ? "Recarregando..." : "Limpar cache PostgREST"}
      </button>
      {msg ? <div className="mt-2 text-xs text-white/80">{msg}</div> : null}
    </div>
  );
}
