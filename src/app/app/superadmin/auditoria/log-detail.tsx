"use client";

import { useState } from "react";

type Log = {
  id: string;
  entity: string;
  action: string;
  organization_id: string;
  user_id: string | null;
  created_at: string;
  diff: unknown;
  entity_id?: string | null;
  ip?: string | null;
};

export function LogDetailButton({ log }: { log: Log }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-[11px] underline text-blue-300 hover:text-blue-200"
      >
        Detalhe
      </button>
      {open ? (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="max-w-2xl w-full bg-[#010f3d] border border-white/15 rounded-xl p-5 max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Evento de auditoria</h3>
              <button onClick={() => setOpen(false)} className="text-white/60 hover:text-white">
                ✕
              </button>
            </div>
            <dl className="text-sm space-y-2">
              <div className="flex gap-2">
                <dt className="w-24 text-white/60">Quando</dt>
                <dd>{new Date(log.created_at).toLocaleString("pt-BR")}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-white/60">Entidade</dt>
                <dd>{log.entity}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-white/60">Ação</dt>
                <dd>{log.action}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-white/60">Org</dt>
                <dd className="font-mono text-xs">{log.organization_id}</dd>
              </div>
              <div className="flex gap-2">
                <dt className="w-24 text-white/60">User</dt>
                <dd className="font-mono text-xs">{log.user_id ?? "—"}</dd>
              </div>
              {log.entity_id ? (
                <div className="flex gap-2">
                  <dt className="w-24 text-white/60">Entity ID</dt>
                  <dd className="font-mono text-xs">{log.entity_id}</dd>
                </div>
              ) : null}
              {log.ip ? (
                <div className="flex gap-2">
                  <dt className="w-24 text-white/60">IP</dt>
                  <dd className="font-mono text-xs">{log.ip}</dd>
                </div>
              ) : null}
            </dl>
            <div className="mt-4">
              <div className="text-xs uppercase text-white/60 mb-2">Diff</div>
              <pre className="text-[11px] bg-black/40 border border-white/10 rounded p-3 overflow-auto max-h-[300px]">
                {JSON.stringify(log.diff, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
