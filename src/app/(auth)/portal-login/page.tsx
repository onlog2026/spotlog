import { Suspense } from "react";
import Link from "next/link";
import { PortalLoginForm } from "@/components/auth/portal-login-form";

export const metadata = { title: "Portal do Cliente - Entrar" };
export const dynamic = "force-dynamic";

export default function PortalLoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 tracking-tight">
          Portal do Cliente
        </h1>
        <p className="text-sm text-ink-600 mt-2">
          Acompanhe suas remessas, chamados e documentos da sua transportadora Spotlog
        </p>
      </div>
      <Suspense
        fallback={<div className="h-64 animate-pulse rounded-md bg-navy-50" />}
      >
        <PortalLoginForm />
      </Suspense>
      <div className="rounded-lg border border-navy-200 bg-navy-50/60 p-4 text-sm text-navy-900">
        <p className="font-semibold mb-1">Não tem acesso ainda?</p>
        <p className="text-ink-700">
          Se você é cliente de uma transportadora Spotlog, peça pro seu gerente
          comercial cadastrar você. Ele vai criar seu acesso em poucos cliques.
        </p>
      </div>
      <p className="text-center text-xs text-ink-500">
        É colaborador de uma transportadora?{" "}
        <Link href="/login" className="text-spotorange-600 font-semibold">
          Use o login interno
        </Link>
      </p>
    </div>
  );
}
