"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, UserPlus, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { inviteMemberAction } from "@/app/app/admin/equipe/actions";

const ROLE_OPTIONS = [
  { value: "owner", label: "Owner — dono, acesso total" },
  { value: "admin", label: "Admin — gestão completa" },
  { value: "manager", label: "Manager — gestor de time/dados" },
  { value: "sdr", label: "SDR — prospecção e leads" },
  { value: "closer", label: "Closer — vendas e propostas" },
  { value: "viewer", label: "Viewer — somente leitura" },
];

export function InviteForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<string>("viewer");
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<
    | { type: "success"; message: string; magic_link?: string | null }
    | { type: "error"; message: string }
    | null
  >(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    start(async () => {
      const result = await inviteMemberAction({
        email: email.trim(),
        full_name: fullName.trim() || undefined,
        role: role as "owner" | "admin" | "manager" | "sdr" | "closer" | "viewer",
      });
      if (result.ok) {
        setFeedback({
          type: "success",
          message: result.message,
          magic_link: "magic_link" in result ? result.magic_link : null,
        });
        setEmail("");
        setFullName("");
        // Força refresh do server component pra mostrar o novo membro na lista
        router.refresh();
      } else {
        setFeedback({ type: "error", message: result.error });
      }
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-navy-100 bg-white p-5 sm:p-6 shadow-soft space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-spotorange-50 text-spotorange-600">
          <UserPlus className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-navy-950">Convidar membro</h2>
          <p className="text-xs text-ink-600">
            Digite o e-mail da pessoa e escolha o nível de acesso.
          </p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="block text-xs font-bold text-navy-900 mb-1">
            E-mail <span className="text-spotorange-500">*</span>
          </span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="pessoa@empresa.com.br"
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-ink-400 focus:border-spotorange-500 focus:outline-none focus:ring-2 focus:ring-spotorange-500/20"
          />
        </label>
        <label className="block">
          <span className="block text-xs font-bold text-navy-900 mb-1">
            Nome (opcional)
          </span>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Nome completo"
            className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 placeholder:text-ink-400 focus:border-spotorange-500 focus:outline-none focus:ring-2 focus:ring-spotorange-500/20"
          />
        </label>
      </div>

      <label className="block">
        <span className="block text-xs font-bold text-navy-900 mb-1">
          Nível de acesso
        </span>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full rounded-lg border border-navy-200 bg-white px-3 py-2 text-sm text-navy-900 focus:border-spotorange-500 focus:outline-none focus:ring-2 focus:ring-spotorange-500/20"
        >
          {ROLE_OPTIONS.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>

      <div className="flex items-center gap-3">
        <Button type="submit" variant="orange" disabled={pending || !email}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          {pending ? "Enviando..." : "Convidar"}
        </Button>
        <p className="text-xs text-ink-500">
          Se a pessoa já tiver conta na plataforma, ela é adicionada na hora.
          Senão, recebe um link mágico de acesso por e-mail.
        </p>
      </div>

      {feedback && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm flex items-start gap-3 ${
            feedback.type === "success"
              ? "bg-success-50 border-success-200 text-success-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p>{feedback.message}</p>
            {"magic_link" in feedback && feedback.magic_link && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={feedback.magic_link}
                  className="flex-1 text-xs font-mono bg-white border border-navy-200 rounded px-2 py-1 text-navy-900"
                />
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(feedback.magic_link!)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-spotorange-600 hover:text-spotorange-700"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
