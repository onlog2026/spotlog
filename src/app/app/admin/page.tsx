import Link from "next/link";
import { Plug, Users2, Building2, Webhook, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const items = [
  {
    href: "/app/admin/integracoes",
    icon: Plug,
    title: "Integrações",
    desc: "IA, e-mail, WhatsApp, Apollo, Google Places.",
  },
  {
    href: "/app/admin/equipe",
    icon: Users2,
    title: "Equipe",
    desc: "Convidar usuários, gerir papéis e permissões.",
  },
  {
    href: "/app/admin/organizacao",
    icon: Building2,
    title: "Organização",
    desc: "Dados da empresa, marca, slug, domínio.",
  },
  {
    href: "/app/admin/webhooks",
    icon: Webhook,
    title: "Webhooks",
    desc: "Eventos do sistema enviados pra outros serviços.",
  },
  {
    href: "/app/admin/billing",
    icon: Sparkles,
    title: "Plano e faturamento",
    desc: "Trial, plano atual, upgrade.",
  },
];

export default async function AdminPage() {
  const ctx = await requireSession();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Admin</h1>
        <p className="text-muted-foreground mt-1">
          Configurações de {ctx.org.name}
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((i) => (
          <Link key={i.href} href={i.href}>
            <Card className="border-white/10 bg-card/50 hover:border-white/20 transition h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <i.icon className="h-5 w-5 text-brand-400" />
                  {i.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{i.desc}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
