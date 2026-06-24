import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export const metadata = {
  title: "Esqueci minha senha · Spotlog",
};

export default function EsqueciSenhaPage() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-soft">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <div className="text-2xl font-black tracking-tight">
              <span className="text-navy-900">SPOT</span>
              <span className="text-spotorange-500">LOG</span>
            </div>
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-navy-950 mt-4">
            Esqueci minha senha
          </h1>
          <p className="text-ink-600 text-sm mt-2">
            Digite seu e-mail. Vamos enviar um link mágico de acesso — você nem
            precisa criar senha nova.
          </p>
        </div>

        <ForgotPasswordForm />

        <div className="text-center mt-6">
          <Link
            href="/login"
            className="text-sm text-navy-700 hover:text-spotorange-600 font-semibold"
          >
            ← Voltar pro login
          </Link>
        </div>
      </div>
    </div>
  );
}
