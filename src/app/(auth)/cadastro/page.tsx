import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata = { title: "Criar conta" };

export default function CadastroPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comece grátis</h1>
        <p className="text-sm text-muted-foreground mt-1">
          14 dias grátis. Sem cartão. Crie sua organização em 30 segundos.
        </p>
      </div>
      <SignupForm />
      <p className="text-center text-sm text-muted-foreground">
        Já tem conta?{" "}
        <Link href="/login" className="text-brand-400 font-medium">
          Entrar
        </Link>
      </p>
    </div>
  );
}
