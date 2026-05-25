import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Entrar na Spotlog</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Bem-vindo de volta. Acesse sua conta pra continuar.
        </p>
      </div>
      <LoginForm />
      <p className="text-center text-sm text-muted-foreground">
        Ainda não tem conta?{" "}
        <Link href="/cadastro" className="text-brand-400 font-medium">
          Cadastre-se grátis
        </Link>
      </p>
    </div>
  );
}
