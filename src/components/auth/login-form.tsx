"use client";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
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

const schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/app";
  const [googleLoading, setGoogleLoading] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword(values);
    if (error) {
      toast.error(
        error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
      );
      return;
    }
    toast.success("Bem-vindo!");
    router.push(next);
    router.refresh();
  }

  async function signInWithGoogle() {
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/api/auth/callback?next=${next}`,
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
          variant="gradient"
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
