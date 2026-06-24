"use client";

import { useState } from "react";

/**
 * Botão com dupla confirmação para ações destrutivas.
 * O onConfirm só dispara após 2 cliques + prompt do nome.
 */
export function DangerButton({
  label,
  confirmText,
  onConfirm,
  size = "sm",
}: {
  label: string;
  confirmText: string;
  onConfirm: () => void | Promise<void>;
  size?: "sm" | "md";
}) {
  const [armed, setArmed] = useState(false);
  const [busy, setBusy] = useState(false);

  const fire = async () => {
    if (!armed) {
      setArmed(true);
      setTimeout(() => setArmed(false), 4000);
      return;
    }
    const typed = window.prompt(
      `Digite "${confirmText}" para confirmar essa ação destrutiva:`,
    );
    if (typed?.trim() !== confirmText) {
      window.alert("Confirmação não bateu. Ação cancelada.");
      setArmed(false);
      return;
    }
    setBusy(true);
    try {
      await onConfirm();
    } finally {
      setBusy(false);
      setArmed(false);
    }
  };

  const base =
    size === "md"
      ? "px-4 py-2 text-sm"
      : "px-3 py-1.5 text-xs";

  return (
    <button
      type="button"
      onClick={fire}
      disabled={busy}
      className={`${base} rounded-md font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed`}
      style={{
        background: armed ? "#BA0102" : "rgba(186,1,2,0.15)",
        color: armed ? "white" : "#ff6b6c",
        border: "1px solid rgba(186,1,2,0.5)",
      }}
    >
      {busy ? "Executando..." : armed ? `Clique para confirmar: ${label}` : label}
    </button>
  );
}
