import { CheckCircle2, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listPlans } from "@/lib/superadmin/entitlements-admin";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

function reais(cents: number) {
  return (cents / 100).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default async function BillingPage() {
  const ctx = await requireSession();
  const plans = (await listPlans()).filter((p) => p.active);
  const currentPlan = ctx.org.plan;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Plano & Upgrade</h1>
        <p className="text-muted-foreground mt-1">
          Sua organização está no plano{" "}
          <span className="font-semibold text-foreground">{currentPlan}</span>.
          {ctx.org.trial_ends_at && (
            <>
              {" "}
              Trial até{" "}
              {new Date(ctx.org.trial_ends_at).toLocaleDateString("pt-BR")}.
            </>
          )}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          const isCurrent = p.key === currentPlan;
          return (
            <Card
              key={p.key}
              className={
                isCurrent
                  ? "border-primary/60 bg-primary/5"
                  : "border-white/10 bg-card/50"
              }
            >
              <CardContent className="p-6 space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-lg">{p.name}</h2>
                  {isCurrent && (
                    <Badge variant="default" className="text-[10px]">
                      Seu plano
                    </Badge>
                  )}
                </div>
                <div className="text-2xl font-bold">
                  {reais(p.price_cents)}
                  <span className="text-xs font-normal text-muted-foreground">
                    {" "}
                    /{p.billing_period === "monthly" ? "mês" : p.billing_period}
                  </span>
                </div>
                {!isCurrent && (
                  <Button asChild size="sm" className="w-full mt-2">
                    <a
                      href="https://wa.me/5511978348288"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                      Falar sobre upgrade
                    </a>
                  </Button>
                )}
                {isCurrent && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-2">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Plano ativo
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        A troca de plano ainda é feita manualmente com o time Spotlog — o
        pagamento automático (cartão/PIX) ainda não está conectado a esta tela.
      </p>
    </div>
  );
}
