import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getChatbotMetrics, listUnanswered } from "@/lib/queries/chatbot";
import {
  Bot,
  MessageSquare,
  Target,
  HelpCircle,
  BookOpen,
  TrendingUp,
} from "lucide-react";

export const dynamic = "force-dynamic";

const INTENT_LABEL: Record<string, string> = {
  cotacao: "Cotação",
  rastreio: "Rastreio",
  suporte: "Suporte",
  info_produto: "Info produto",
  contratar: "Contratar",
  saudacao: "Saudação",
  outro: "Outro",
};

export default async function ChatbotDashboardPage() {
  await requireSession();
  const [metrics, recentUnanswered] = await Promise.all([
    getChatbotMetrics(),
    listUnanswered(false),
  ]);

  const stats = [
    {
      icon: MessageSquare,
      label: "Sessões (30d)",
      value: metrics.totalSessions30d.toLocaleString("pt-BR"),
    },
    {
      icon: Target,
      label: "Convertidos (30d)",
      value: metrics.convertedSessions30d.toLocaleString("pt-BR"),
    },
    {
      icon: TrendingUp,
      label: "Taxa de conversão",
      value: `${metrics.conversionRate.toFixed(1)}%`,
    },
    {
      icon: BookOpen,
      label: "KB ativos",
      value: metrics.kbActive.toLocaleString("pt-BR"),
    },
    {
      icon: HelpCircle,
      label: "Não respondidas",
      value: metrics.unansweredOpen.toLocaleString("pt-BR"),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <Card key={s.label} className="border-white/10 bg-card/50">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                <s.icon className="h-4 w-4 text-brand-400" />
                {s.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-card/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Bot className="h-4 w-4 text-brand-400" />
              Top intenções (30d)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {metrics.topIntents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Ainda não temos conversas suficientes pra análise.
              </p>
            ) : (
              metrics.topIntents.map((it) => {
                const max = metrics.topIntents[0].count;
                const pct = Math.max(8, Math.round((it.count / max) * 100));
                return (
                  <div key={it.intent} className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="font-medium">
                        {INTENT_LABEL[it.intent] ?? it.intent}
                      </span>
                      <span className="text-muted-foreground">
                        {it.count} msg
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-spotorange-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-card/50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <HelpCircle className="h-4 w-4 text-brand-400" />
              Últimas perguntas sem resposta
            </CardTitle>
            <Link
              href="/app/admin/chatbot/unanswered"
              className="text-xs text-spotorange-400 hover:underline"
            >
              Ver todas
            </Link>
          </CardHeader>
          <CardContent>
            {recentUnanswered.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Tudo respondido por enquanto.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {recentUnanswered.slice(0, 6).map((u) => (
                  <li
                    key={u.id}
                    className="rounded border border-white/5 bg-white/[0.02] p-2"
                  >
                    <p className="line-clamp-2">{u.question}</p>
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      {new Date(u.created_at).toLocaleString("pt-BR")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
