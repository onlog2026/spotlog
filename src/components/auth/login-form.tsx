"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/auth/google-icon";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type Values = z.infer<typeof schema>;

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "E-mail ainda não foi confirmado. Cheque sua caixa de entrada ou cadastre-se novamente.";
  if (m.includes("user not found")) return "Usuário não encontrado. Crie sua conta primeiro.";
  if (m.includes("too many requests") || m.includes("rate limit")) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  if (m.includes("network")) return "Erro de conexão. Verifique sua internet.";
  if (m.includes("invalid api key")) return "Erro de configuração do servidor. Contate o suporte.";
  return message;
}

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/app";
  const confirm = search.get("confirm");
  const emailFromQuery = search.get("email") ?? "";
  const callbackError = search.get("error");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: emailFromQuery, password: "" },
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
    toast.success("Bem-vindo!");
    // Usa navegação dura pra garantir que o middleware veja o cookie de sessão recém-setado.
    window.location.assign(next);
  }

  async function signInWithGoogle() {
    setServerError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(next)}`,
      },
    });
    if (error) {
      const friendly = translateAuthError(error.message);
      setServerError(friendly);
      toast.error(friendly);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      {confirm === "1" && (
        <div className="flex items-start gap-2 rounded-md border border-emerald-300/40 bg-emerald-50/70 p-3 text-sm text-emerald-900">
          <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" />
          <span>
            Conta criada! Enviamos um link de confirmação{emailFromQuery ? ` para ${emailFromQuery}` : ""}. Confirme e volte aqui pra entrar.
          </span>
        </div>
      )}
      {callbackError && (
        <div className="flex items-start gap-2 rounded-md border border-amber-300/40 bg-amber-50/70 p-3 text-sm text-amber-900">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>Não conseguimos completar o login pelo Google. Tente novamente ou use e-mail e senha.</span>
        </div>
      )}
      {serverError && (
        <div className="flex items-start gap-2 rounded-md border border-red-300/40 bg-red-50/70 p-3 text-sm text-red-900">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}
      <Button
        type="button"
        variant="outline"
        className="w-full"
        size="lg"
        onClick={signInWithGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Continuar com Google
      </Button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/10" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            ou com e-mail
          </span>
        </div>
      </div>

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
              href="/esqueci-senha"
              className="text-xs text-spotorange-600 font-semibold hover:underline"
            >
              Esqueci minha senha
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
          Entrar
        </Button>
      </form>
    </div>
  );
}
