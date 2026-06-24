import Link from "next/link";
import {
  Users,
  Sparkles,
  Activity,
  Layers,
  Mail,
  MailCheck,
  MessageCircle,
  MessageSquare,
  Workflow,
  Bot,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

type Item = {
  title: string;
  desc: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: "Pro" | "Novo";
  external?: boolean;
};

const ITEMS: Item[] = [
  {
    title: "Base de Leads",
    desc: "Todos os leads capturados, centralizados, com filtros avançados",
    href: "/app/leads",
    icon: Users,
    external: true,
  },
  {
    title: "Lead Scoring",
    desc: "Pontua leads automaticamente segundo regras e IA",
    href: "/app/sdr",
    icon: Sparkles,
    badge: "Pro",
    external: true,
  },
  {
    title: "Leads Inteligentes",
    desc: "Detecta leads quentes via IA — high score, alto engajamento, sinais de compra",
    href: "/app/marketing/relacionar/inteligentes",
    icon: Activity,
    badge: "Pro",
  },
  {
    title: "Lead Tracking",
    desc: "Acompanha o histórico de interações de cada lead",
    href: "/app/sdr",
    icon: Activity,
    badge: "Pro",
    external: true,
  },
  {
    title: "Segmentação de Leads",
    desc: "Crie segmentos dinâmicos com filtros salvos pra usar em campanhas",
    href: "/app/marketing/relacionar/segmentos",
    icon: Layers,
    badge: "Novo",
  },
  {
    title: "E-mail",
    desc: "Cadências e disparos de e-mail marketing",
    href: "/app/cadencias",
    icon: Mail,
    external: true,
  },
  {
    title: "Validador de E-mail",
    desc: "Valide listas em massa (regex + MX + descartáveis) antes de disparar",
    href: "/app/marketing/relacionar/validador",
    icon: MailCheck,
    badge: "Novo",
  },
  {
    title: "Mensagens de WhatsApp",
    desc: "Inbox unificado de conversas WhatsApp",
    href: "/app/inbox",
    icon: MessageCircle,
    external: true,
  },
  {
    title: "Mensagens de SMS",
    desc: "Campanhas SMS em massa com segmentação",
    href: "/app/marketing/relacionar/sms",
    icon: MessageSquare,
    badge: "Novo",
  },
  {
    title: "Automação de Marketing",
    desc: "Fluxos automatizados multi-canal (e-mail + WhatsApp + tags)",
    href: "/app/cadencias",
    icon: Workflow,
    external: true,
  },
  {
    title: "Chatbot",
    desc: "Configure o chatbot IA do site",
    href: "/app/admin/chatbot",
    icon: Bot,
    external: true,
  },
];

export default function RelacionarIndex() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Relacionar</h2>
        <p className="text-sm text-muted-foreground">
          Engaje seus leads do primeiro toque até a venda. Tudo no mesmo lugar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {ITEMS.map((it) => {
          const Icon = it.icon;
          return (
            <Link key={it.href + it.title} href={it.href} className="group">
              <Card className="border-white/10 bg-card/50 hover:bg-card/80 hover:border-[#BA0102]/40 transition h-full">
                <CardContent className="p-4 flex gap-3">
                  <div className="h-10 w-10 rounded-md bg-[#011960] text-white inline-flex items-center justify-center flex-none">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm">{it.title}</h3>
                      {it.badge && (
                        <Badge
                          variant="secondary"
                          className={
                            it.badge === "Pro"
                              ? "bg-[#011960] text-white text-[10px]"
                              : "bg-[#BA0102] text-white text-[10px]"
                          }
                        >
                          {it.badge}
                        </Badge>
                      )}
                      {it.external && (
                        <ExternalLink className="h-3 w-3 text-muted-foreground" />
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
