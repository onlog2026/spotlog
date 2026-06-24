"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Mail, CheckCircle2, AlertCircle, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { requestPasswordResetAction } from "@/app/(auth)/esqueci-senha/actions";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<
    | { type: "success"; message: string; magic_link?: string | null }
    | { type: "error"; message: string }
    | null
  >(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const r = await requestPasswordResetAction({ email: email.trim() });
      if (r.ok) {
        setResult({
          type: "success",
          message: r.message,
          magic_link: "magic_link" in r ? r.magic_link : null,
        });
      } else {
        setResult({ type: "error", message: r.error });
      }
    } catch (err) {
      setResult({
        type: "error",
        message: err instanceof Error ? err.message : "Erro inesperado",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white border border-navy-100 shadow-card p-6 sm:p-8">
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="block text-sm font-semibold text-navy-900 mb-1.5">
            E-mail cadastrado
          </span>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@empresa.com.br"
              className="w-full rounded-xl border border-navy-200 bg-white pl-10 pr-4 py-3 text-navy-900 placeholder:text-ink-400 focus:border-spotorange-500 focus:outline-none focus:ring-2 focus:ring-spotorange-500/20"
            />
          </div>
        </label>

        <Button
          type="submit"
          variant="orange"
          size="xl"
          className="w-full"
          disabled={loading || !email}
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando...
            </>
          ) : (
            "Enviar link de acesso"
          )}
        </Button>
      </form>

      {result && (
        <div
          className={`mt-5 rounded-xl border p-4 text-sm flex items-start gap-3 ${
            result.type === "success"
              ? "bg-success-50 border-success-200 text-success-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {result.type === "success" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          )}
          <div className="flex-1 min-w-0">
            <p>{result.message}</p>
            {"magic_link" in result && result.magic_link && (
              <div className="mt-3 flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={result.magic_link}
                  className="flex-1 text-xs font-mono bg-white border border-navy-200 rounded px-2 py-1.5 text-navy-900"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(result.magic_link!);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-spotorange-600 hover:text-spotorange-700"
                  title="Copiar link"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="mt-6 pt-5 border-t border-navy-100">
        <p className="text-xs text-ink-500 text-center">
          Lembrou a senha?{" "}
          <a
            href="/login"
            className="text-spotorange-600 font-semibold hover:underline"
          >
            Entrar com senha
          </a>
        </p>
      </div>
    </div>
  );
}
