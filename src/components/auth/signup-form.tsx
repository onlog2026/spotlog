"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

export function SignupForm() {
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
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
      toast.error(error.message);
      return;
    }

    // Se confirmação por e-mail está ativada, a sessão pode estar null.
    if (data.session) {
      // já logado: cria org
      const slug = `${slugify(values.org_name)}-${Math.random()
        .toString(36)
        .slice(2, 6)}`;
      const { error: rpcError } = await supabase.rpc("create_organization", {
        org_name: values.org_name,
        org_slug: slug,
      });
      if (rpcError) {
        toast.error("Conta criada mas houve erro ao criar a organização.");
      } else {
        toast.success("Tudo certo. Bora começar!");
      }
      router.push("/app/onboarding");
      router.refresh();
      return;
    }

    toast.success(
      "Conta criada! Verifique seu e-mail pra confirmar e entrar.",
    );
    router.push(`/login?confirm=1&email=${encodeURIComponent(values.email)}`);
  }

  async function signupWithGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=/app/onboarding`,
      },
    });
    if (error) {
      toast.error(error.message);
      setGoogleLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="glass"
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
          variant="gradient"
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
