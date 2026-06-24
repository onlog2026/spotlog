"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { GoogleIcon } from "@/components/auth/google-icon";
import { slugify } from "@/lib/utils";

const schema = z.object({
  full_name: z.string().min(2, "Informe seu nome"),
  org_name: z.string().min(2, "Informe o nome da empresa"),
  email: z.string().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo 8 caracteres"),
});
type Values = z.infer<typeof schema>;

function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("user already registered") || m.includes("already been registered")) {
    return "Este e-mail já tem cadastro. Tente entrar.";
  }
  if (m.includes("password should be") || m.includes("weak password")) {
    return "Senha muito fraca. Use ao menos 8 caracteres com letras e números.";
  }
  if (m.includes("rate limit") || m.includes("too many requests")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  if (m.includes("invalid email")) return "E-mail inválido.";
  return message;
}

export function SignupForm() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    setServerError(null);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: {
        data: { full_name: values.full_name },
        emailRedirectTo: `${window.location.origin}/api/auth/callback`,
      },
    });

    if (error) {
      const friendly = translateAuthError(error.message);
      setServerError(friendly);
      toast.error(friendly);
      return;
    }

    // Se confirmação por e-mail está ativada, a sessão pode estar null.
    if (data.session) {
      // Já logado: cria org E redireciona pro app (não onboarding pois acabou de criar org)
      const slug = `${slugify(values.org_name)}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const { error: rpcError } = await supabase.rpc("create_organization", {
        org_name: values.org_name,
        org_slug: slug,
      });
      if (rpcError) {
        setServerError("Conta criada, mas houve erro ao criar a organização: " + rpcError.message);
        toast.error("Erro ao criar organização. Vamos pra tela de onboarding pra tentar de novo.");
        window.location.assign("/onboarding");
        return;
      }
      toast.success("Tudo certo. Bora começar!");
      window.location.assign("/app");
      return;
    }

    toast.success("Conta criada! Verifique seu e-mail pra confirmar e entrar.");
    router.push(`/login?confirm=1&email=${encodeURIComponent(values.email)}`);
  }

  async function signupWithGoogle() {
    setServerError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent("/onboarding")}`,
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
        onClick={signupWithGoogle}
        disabled={googleLoading}
      >
        {googleLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <GoogleIcon />
        )}
        Cadastrar com Google
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
        <Field label="Seu nome" error={form.formState.errors.full_name?.message}>
          <Input {...form.register("full_name")} placeholder="Maria Silva" />
        </Field>
        <Field
          label="Nome da empresa"
          error={form.formState.errors.org_name?.message}
        >
          <Input {...form.register("org_name")} placeholder="Acme Ltda" />
        </Field>
        <Field label="E-mail" error={form.formState.errors.email?.message}>
          <Input
            type="email"
            {...form.register("email")}
            placeholder="voce@empresa.com.br"
          />
        </Field>
        <Field label="Senha" error={form.formState.errors.password?.message}>
          <Input
            type="password"
            {...form.register("password")}
            placeholder="Mínimo 8 caracteres"
          />
        </Field>
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
          Criar minha conta
        </Button>
      </form>

      <p className="text-xs text-muted-foreground text-center">
        Ao continuar, você concorda com os{" "}
        <a href="/termos" className="text-brand-400">
          Termos
        </a>{" "}
        e a{" "}
        <a href="/privacidade" className="text-brand-400">
          Política de Privacidade
        </a>
        .
      </p>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
