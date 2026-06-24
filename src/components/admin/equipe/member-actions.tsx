"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Trash2, Loader2 } from "lucide-react";
import { changeRoleAction, removeMemberAction } from "@/app/app/admin/equipe/actions";

const ROLES = ["owner", "admin", "manager", "sdr", "closer", "viewer"] as const;
type Role = (typeof ROLES)[number];

export function MemberActions({
  userId,
  currentRole,
  isSelf,
}: {
  userId: string;
  currentRole: Role;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleChangeRole(newRole: Role) {
    setError(null);
    start(async () => {
      const r = await changeRoleAction({ user_id: userId, role: newRole });
      if (!r.ok) setError(r.error);
      else router.refresh();
      setOpen(false);
    });
  }

  function handleRemove() {
    if (!confirm("Remover este membro da organização? Ele perde acesso imediatamente.")) return;
    setError(null);
    start(async () => {
      const r = await removeMemberAction({ user_id: userId });
      if (!r.ok) setError(r.error);
      else router.refresh();
    });
  }

  if (isSelf) return null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-1.5 rounded-lg hover:bg-navy-50 text-ink-500"
        aria-label="Ações"
        disabled={pending}
      >
        {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 top-8 z-20 w-56 rounded-xl bg-white border border-navy-100 shadow-card p-2">
            <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500 px-2 py-1">
              Mudar role
            </div>
            {ROLES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleChangeRole(r)}
                disabled={r === currentRole}
                className={`w-full text-left px-2 py-1.5 rounded-md text-sm hover:bg-navy-50 ${
                  r === currentRole ? "font-bold text-spotorange-600" : "text-navy-900"
                } disabled:cursor-default`}
              >
                {r}
                {r === currentRole && <span className="ml-2 text-xs">(atual)</span>}
              </button>
            ))}
            <div className="border-t border-navy-100 my-1" />
            <button
              type="button"
              onClick={handleRemove}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remover da equipe
            </button>
          </div>
        </>
      )}
      {error && (
        <div className="absolute right-0 top-12 z-20 w-64 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs p-2">
          {error}
        </div>
      )}
    </div>
  );
}
