"use client";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type Values = z.infer<typeof schema>;

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials"))
    return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed"))
    return "E-mail ainda não foi confirmado. Cheque sua caixa de entrada.";
  if (m.includes("user not found"))
    return "Usuário não encontrado. Peça pro seu gerente cadastrar você.";
  if (m.includes("too many requests") || m.includes("rate limit"))
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  return message;
}

export function PortalLoginForm() {
  const search = useSearchParams();
  const next = search.get("next") ?? "/portal";
  const errorParam = search.get("error");
  const [serverError, setServerError] = useState<string | null>(
    errorParam === "no_client"
      ? "Seu e-mail está logado mas não está vinculado a nenhum cliente. Peça pro gerente da transportadora reenviar o convite."
      : null,
  );
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: Values) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      const friendly = translateAuthError(error.message);
      setServerError(friendly);
      toast.error(friendly);
      return;
    }
    toast.success("Entrando...");
    window.location.assign(next);
  }

  return (
    <div className="space-y-4">
      {serverError && (
        <div className="flex items-start gap-2 rounded-md border border-red-300/40 bg-red-50/70 p-3 text-sm text-red-900">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <div className="space-y-1.5">
          <Label>E-mail</Label>
          <Input
            type="email"
            {...form.register("email")}
            placeholder="voce@empresa.com.br"
          />
          {form.formState.errors.email && (
            <p className="text-xs text-destructive">
              {form.formState.errors.email.message}
            </p>
          )}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>Senha</Label>
            <Link
              href="/recuperar-senha"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Esqueci
            </Link>
          </div>
          <Input
            type="password"
            {...form.register("password")}
            placeholder="••••••••"
          />
          {form.formState.errors.password && (
            <p className="text-xs text-destructive">
              {form.formState.errors.password.message}
            </p>
          )}
        </div>
        <Button
          type="submit"
          variant="orange"
          size="lg"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting && (
            <Loader2 className="h-4 w-4 animate-spin" />
          )}
          Entrar no portal
        </Button>
      </form>
    </div>
  );
}
