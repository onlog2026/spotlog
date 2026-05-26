import { Suspense } from "react";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Entrar" };
export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 tracking-tight">
          Entrar
        </h1>
        <p className="text-sm text-ink-600 mt-2">
          Acesse a área do cliente da Spotlog
        </p>
      </div>
      <Suspense fallback={<div className="h-64 animate-pulse rounded-md bg-navy-50" />}>
        <LoginForm />
      </Suspense>
      <p className="text-center text-sm text-ink-600">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-spotorange-600 font-semibold">
          Criar acesso
        </Link>
      </p>
    </div>
  );
}
