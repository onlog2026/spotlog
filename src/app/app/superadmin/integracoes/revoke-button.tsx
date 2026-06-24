"use client";

import { useTransition } from "react";
import { revokeApiKey, toggleIntegration } from "./actions";

export function RevokeKeyButton({ keyId }: { keyId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm("Revogar essa API key? A integração que usa essa chave parará de funcionar.")) return;
        start(async () => {
          try {
            await revokeApiKey(keyId);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        });
      }}
      className="text-[11px] px-2 py-1 rounded border border-red-400/30 text-red-200 hover:bg-red-400/10 disabled:opacity-40"
    >
      {pending ? "Revogando..." : "Revogar"}
    </button>
  );
}

export function ToggleIntegrationButton({
  integId,
  isActive,
}: {
  integId: string;
  isActive: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        const next = !isActive;
        const msg = next ? "Reativar essa integração?" : "Desativar essa integração?";
        if (!confirm(msg)) return;
        start(async () => {
          try {
            await toggleIntegration(integId, next);
          } catch (e) {
            alert(e instanceof Error ? e.message : "Erro");
          }
        });
      }}
      className={`text-[11px] px-2 py-1 rounded border disabled:opacity-40 ${
        isActive
          ? "border-amber-400/30 text-amber-200 hover:bg-amber-400/10"
          : "border-green-400/30 text-green-200 hover:bg-green-400/10"
      }`}
    >
      {pending ? "..." : isActive ? "Desativar" : "Ativar"}
    </button>
  );
}
