import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    price: "R$ 197",
    period: "/mês",
    desc: "Pra fundadores e solo SDRs que querem começar a prospectar com método.",
    features: [
      "1 usuário",
      "500 leads prospectados/mês",
      "1 caixa de e-mail conectada",
      "WhatsApp via Evolution/Z-API (você fornece)",
      "1 pipeline e 1 cadência ativa",
      "Propostas ilimitadas",
      "Suporte por chat",
    ],
    cta: "Começar agora",
    href: "/cadastro?plan=starter",
    highlight: false,
  },
  {
    name: "Pro",
    price: "R$ 497",
    period: "/mês",
    desc: "Pra times comerciais de 3 a 10 pessoas que querem previsibilidade.",
    features: [
      "Até 5 usuários",
      "3.000 leads prospectados/mês",
      "5 caixas de e-mail conectadas",
      "WhatsApp + LinkedIn outreach",
      "Pipelines e cadências ilimitadas",
      "IA personalizando mensagens",
      "Propostas com link de aceite digital",
      "Webhooks e API",
      "Suporte prioritário",
    ],
    cta: "Quero o Pro",
    href: "/cadastro?plan=pro",
    highlight: true,
  },
  {
    name: "Scale",
    price: "Sob consulta",
    period: "",
    desc: "Pra operações que querem volume, controle e SLA dedicado.",
    features: [
      "Usuários ilimitados",
      "Volume custom de prospecção",
      "Apollo e bases B2B premium",
      "SLA com suporte dedicado",
      "Onboarding 1:1 com nosso time",
      "Implementação de cadências",
      "Treinamento da IA com seus dados",
      "SSO, auditoria avançada",
    ],
    cta: "Falar com vendas",
    href: "/contato?assunto=plano-scale",
    highlight: false,
  },
];

export function Pricing() {
  return (
    <section className="py-24 md:py-32">
      <div className="container">
        <div className="max-w-2xl mx-auto text-center mb-16">
          <span className="inline-block text-sm font-medium text-brand-400 mb-3">
            Preços
          </span>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">
            Pague pelo que <span className="text-gradient">realmente roda.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            14 dias grátis em qualquer plano. Sem cartão. Cancela quando quiser.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={cn(
                "relative rounded-2xl p-8 flex flex-col",
                plan.highlight
                  ? "bg-gradient-to-br from-brand-500/20 via-purple-500/10 to-cyan-500/10 border-2 border-brand-500/40 shadow-2xl shadow-brand-500/20 scale-[1.02]"
                  : "glass-strong",
              )}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <div className="bg-gradient-brand text-white text-xs font-semibold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg shadow-brand-500/40">
                    <Sparkles className="h-3 w-3" />
                    Mais escolhido
                  </div>
                </div>
              )}

              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">{plan.desc}</p>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-4xl font-bold">{plan.price}</span>
                {plan.period && (
                  <span className="text-muted-foreground">{plan.period}</span>
                )}
              </div>

              <ul className="mt-8 space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <Button
                className="mt-8 w-full"
                variant={plan.highlight ? "gradient" : "glass"}
                size="lg"
                asChild
              >
                <Link href={plan.href}>{plan.cta}</Link>
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
