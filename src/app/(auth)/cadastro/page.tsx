import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Criar acesso" };

export default function CadastroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-navy-900 tracking-tight">
          Criar acesso Spotlog
        </h1>
        <p className="text-sm text-ink-600 mt-2">
          Cadastre sua empresa pra acompanhar entregas, abrir chamados e ver
          relatórios da operação.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-ink-600">
        Já tem conta?{" "}
        <Link href="/login" className="text-spotorange-600 font-semibold">
          Entrar
        </Link>
      </p>
    </div>
  );
}
