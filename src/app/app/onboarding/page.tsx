"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, Building2, ArrowRight } from "lucide-react";
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
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
  });

  async function onSubmit({ org_name }: z.infer<typeof schema>) {
    setLoading(true);
    const supabase = createClient();
    const slug = `${slugify(org_name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.rpc("create_organization", {
      org_name,
      org_slug: slug,
    });
    if (error) {
      toast.error(error.message);
      setLoading(false);
      return;
    }
    toast.success("Organização criada!");
    router.push("/app");
    router.refresh();
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
        </div>

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
            variant="gradient"
            size="lg"
            className="w-full"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Criar e continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
