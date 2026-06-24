import Link from "next/link";
import {
  Radio,
  BarChart3,
  Eye,
  TrendingUp,
  Filter,
  FileText,
  LayoutDashboard,
  Megaphone,
  ChevronRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

const ITEMS = [
  {
    title: "Análise de Canais",
    desc: "De onde vêm seus leads: tráfego direto, orgânico, pago, etc",
    href: "/app/marketing/analisar/canais",
    icon: Radio,
  },
  {
    title: "Análise de Mídias e Vendas",
    desc: "Cruzamento entre canal de origem e receita gerada",
    href: "/app/marketing/analisar/midias",
    icon: BarChart3,
  },
  {
    title: "Alcance",
    desc: "Impressões, alcance único e CTR das suas campanhas",
    href: "/app/marketing/analisar/alcance",
    icon: Eye,
  },
  {
    title: "Performance de Canais",
    desc: "Comparativo de desempenho entre canais ao longo do tempo",
    href: "/app/marketing/analisar/performance",
    icon: TrendingUp,
  },
  {
    title: "Funil de Conversão",
    desc: "Visitantes → Leads → Qualificados → Oportunidades → Vendas",
    href: "/app/marketing/analisar/funil",
    icon: Filter,
    badge: "Beta",
  },
  {
    title: "Relatórios",
    desc: "Crie, agende e envie relatórios por e-mail automaticamente",
    href: "/app/marketing/analisar/relatorios",
    icon: FileText,
  },
  {
    title: "Dashboards Personalizados",
    desc: "Monte seus próprios painéis com widgets KPI, gráficos e tabelas",
    href: "/app/marketing/analisar/dashboards",
    icon: LayoutDashboard,
  },
  {
    title: "Gerenciador de Campanhas",
    desc: "Todas suas campanhas (SMS + e-mail + push + ads) num lugar só",
    href: "/app/marketing/analisar/campanhas",
    icon: Megaphone,
  },
];

export default function AnalisarIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Analisar</h2>
        <p className="text-sm text-muted-foreground">
          O que está funcionando? O que precisa de ajuste? Aqui você descobre.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.href} href={it.href} className="group">
              <Card className="border-white/10 bg-card/50 hover:bg-card/80 hover:border-[#BA0102]/40 transition h-full">
                <CardContent className="p-4 flex gap-3">
                  <div className="h-10 w-10 rounded-md bg-[#BA0102] text-white inline-flex items-center justify-center flex-none">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{it.title}</h3>
                      {"badge" in it && it.badge && (
                        <Badge className="bg-[#011960] text-white text-[10px]">{it.badge}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{it.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground self-center group-hover:text-[#BA0102]" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
