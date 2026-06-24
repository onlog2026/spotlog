"use client";

import { useState, useTransition } from "react";
import {
  promoteToSuperAdmin,
  demoteFromSuperAdmin,
  banUser,
  unbanUser,
  resetPasswordEmail,
  generateImpersonateLink,
} from "./actions";

export function UserActions({
  userId,
  email,
  isSuper,
  isBanned,
}: {
  userId: string;
  email: string;
  isSuper: boolean;
  isBanned: boolean;
}) {
  const [pending, start] = useTransition();
  const [link, setLink] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const wrap = (fn: () => Promise<unknown>, label: string) =>
    start(async () => {
      setMsg(null);
      try {
        await fn();
        setMsg(`✓ ${label}`);
        setTimeout(() => setMsg(null), 3500);
      } catch (e) {
        setMsg(`✗ ${e instanceof Error ? e.message : "Erro"}`);
      }
    });

  const handlePromote = () => {
    if (!confirm(`Promover ${email} a SUPER ADMIN GLOBAL? Essa pessoa terá acesso total.`)) return;
    wrap(() => promoteToSuperAdmin(userId), "Promovido a super admin");
  };

  const handleDemote = () => {
    if (!confirm(`Remover super admin de ${email}?`)) return;
    wrap(() => demoteFromSuperAdmin(userId), "Super admin removido");
  };

  const handleBan = () => {
    if (!confirm(`Banir ${email}? O usuário NÃO poderá mais fazer login.`)) return;
    wrap(() => banUser(userId), "Usuário banido");
  };

  const handleUnban = () => {
    if (!confirm(`Desbanir ${email}?`)) return;
    wrap(() => unbanUser(userId), "Usuário desbanido");
  };

  const handleReset = () => {
    if (!email) return alert("Usuário sem email.");
    if (!confirm(`Enviar email de reset de senha pra ${email}?`)) return;
    wrap(() => resetPasswordEmail(email), `Email de reset enviado pra ${email}`);
  };

  const handleImpersonate = () => {
    if (!email) return alert("Usuário sem email.");
    if (
      !confirm(
        `Gerar magic link pra ${email}? Use só pra DEBUG — você verá o link na tela e poderá copiar.`,
      )
    )
      return;
    start(async () => {
      setMsg(null);
      try {
        const { link } = await generateImpersonateLink(email);
        setLink(link);
      } catch (e) {
        setMsg(`✗ ${e instanceof Error ? e.message : "Erro"}`);
      }
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap gap-1 justify-end">
        {isSuper ? (
          <button
            onClick={handleDemote}
            disabled={pending}
            className="text-[11px] px-2 py-1 rounded border border-amber-400/30 text-amber-200 hover:bg-amber-400/10 disabled:opacity-40"
          >
            Remover super
          </button>
        ) : (
          <button
            onClick={handlePromote}
            disabled={pending}
            className="text-[11px] px-2 py-1 rounded border border-white/20 hover:bg-white/10 disabled:opacity-40"
          >
            Promover
          </button>
        )}
        {isBanned ? (
          <button
            onClick={handleUnban}
            disabled={pending}
            className="text-[11px] px-2 py-1 rounded border border-green-400/30 text-green-200 hover:bg-green-400/10 disabled:opacity-40"
          >
            Desbanir
          </button>
        ) : (
          <button
            onClick={handleBan}
            disabled={pending}
            className="text-[11px] px-2 py-1 rounded border border-red-400/30 text-red-200 hover:bg-red-400/10 disabled:opacity-40"
          >
            Banir
          </button>
        )}
        <button
          onClick={handleReset}
          disabled={pending}
          className="text-[11px] px-2 py-1 rounded border border-white/20 hover:bg-white/10 disabled:opacity-40"
        >
          Reset senha
        </button>
        <button
          onClick={handleImpersonate}
          disabled={pending}
          className="text-[11px] px-2 py-1 rounded border border-white/20 hover:bg-white/10 disabled:opacity-40"
        >
          Magic link
        </button>
      </div>
      {msg ? (
        <div className="text-[10px] text-white/70 max-w-[260px] truncate" title={msg}>
          {msg}
        </div>
      ) : null}
      {link ? (
        <div className="mt-1 w-full max-w-[300px]">
          <input
            readOnly
            value={link}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="text-[10px] w-full font-mono px-2 py-1 rounded bg-black/40 border border-white/15"
          />
          <button
            onClick={() => {
              void navigator.clipboard.writeText(link);
              setMsg("✓ Link copiado");
              setTimeout(() => setMsg(null), 2000);
            }}
            className="text-[10px] mt-1 text-blue-300 underline"
          >
            Copiar
          </button>
        </div>
      ) : null}
    </div>
  );
}
