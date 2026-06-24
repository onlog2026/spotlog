"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Building2, ArrowRight, AlertCircle, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { slugify } from "@/lib/utils";

const schema = z.object({
  org_name: z.string().min(2, "Informe o nome da empresa"),
});

export default function OnboardingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  // Guarda: se não estiver logado, manda pra login. Se já tem org, manda pra /app.
  useEffect(() => {
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        window.location.assign("/login?next=/onboarding");
        return;
      }
      setUserEmail(user.email ?? null);
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("organization_id")
        .eq("user_id", user.id)
        .limit(1);
      if (memberships && memberships.length > 0) {
        window.location.assign("/app");
        return;
      }
      setChecking(false);
    })();
  }, []);

  async function onSubmit({ org_name }: z.infer<typeof schema>) {
    setServerError(null);
    setLoading(true);
    const supabase = createClient();
    const slug = `${slugify(org_name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.rpc("create_organization", {
      org_name,
      org_slug: slug,
    });
    if (error) {
      setServerError(error.message);
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Organização criada!");
    // Navegação dura pra garantir que o middleware veja a nova membership
    window.location.assign("/app");
  }

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/login");
  }

  if (checking) {
    return (
      <div className="min-h-screen grid place-items-center p-6 bg-gradient-hero">
        <div className="flex items-center gap-2 text-white">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Carregando...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen grid place-items-center p-6 bg-gradient-hero">
      <div className="max-w-md w-full glass-strong rounded-2xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-xl bg-gradient-brand shadow-lg shadow-brand-500/30">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Vamos criar sua organização</h1>
          <p className="text-sm text-muted-foreground">
            Em segundos. Dá pra convidar o time depois.
          </p>
          {userEmail && (
            <p className="text-xs text-muted-foreground/70">Logado como {userEmail}</p>
          )}
        </div>

        {serverError && (
          <div className="flex items-start gap-2 rounded-md border border-red-300/40 bg-red-50/70 p-3 text-sm text-red-900">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Nome da empresa</Label>
            <Input
              {...form.register("org_name")}
              placeholder="Acme Ltda"
              autoFocus
            />
            {form.formState.errors.org_name && (
              <p className="text-xs text-destructive">
                {form.formState.errors.org_name.message}
              </p>
            )}
          </div>
          <Button
            type="submit"
            variant="orange"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar e continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>

        <button
          type="button"
          onClick={logout}
          className="w-full text-xs text-muted-foreground hover:text-foreground flex items-center justify-center gap-1"
        >
          <LogOut className="h-3 w-3" />
          Sair e usar outra conta
        </button>
      </div>
    </div>
  );
}
