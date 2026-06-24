"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

/**
 * Error boundary do app autenticado.
 * Captura erros em qualquer página /app/* e mostra UI amigável
 * em vez do "Application error: client-side exception" genérico.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log pra Vercel + console
    console.error("[/app] runtime error", error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-navy-50 to-white">
      <div className="max-w-xl w-full rounded-3xl bg-white border border-navy-100 shadow-card p-8 md:p-10 text-center">
        <div className="inline-grid h-16 w-16 place-items-center rounded-2xl bg-spotorange-50 text-spotorange-600 mb-5">
          <AlertTriangle className="h-8 w-8" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-navy-950 mb-2">
          Opa, algo deu errado nessa tela
        </h1>
        <p className="text-ink-600 mb-2">
          Tivemos um problema técnico carregando essa página. As outras telas do
          painel devem estar funcionando normalmente.
        </p>
        {error?.digest && (
          <p className="text-xs text-ink-400 font-mono mb-6">
            Código do erro: <span className="bg-navy-50 px-2 py-0.5 rounded">{error.digest}</span>
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
          <button
            onClick={() => reset()}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-spotorange-500 text-white font-semibold px-5 py-3 hover:bg-spotorange-600 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Tentar de novo
          </button>
          <Link
            href="/app"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-navy-200 text-navy-900 font-semibold px-5 py-3 hover:bg-navy-50 transition-colors"
          >
            <Home className="h-4 w-4" />
            Voltar pro dashboard
          </Link>
        </div>

        <div className="mt-6 pt-6 border-t border-navy-100">
          <p className="text-xs text-ink-500">
            Se persistir, fala com o suporte pelo WhatsApp{" "}
            <a
              href="https://wa.me/5511914791442"
              className="text-spotorange-600 font-semibold underline"
            >
              (11) 91479-1442
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
