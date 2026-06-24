import { notFound } from "next/navigation";
import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { getSessionWithMessages } from "@/lib/queries/chatbot";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChatbotSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const { session, messages } = await getSessionWithMessages(id);
  if (!session) notFound();

  return (
    <div className="space-y-4">
      <Link
        href="/app/admin/chatbot/sessions"
        className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Voltar para sessões
      </Link>

      <Card className="border-white/10 bg-card/40">
        <CardContent className="py-3 text-sm space-y-1">
          <div className="flex items-center justify-between">
            <p className="font-mono text-xs text-muted-foreground">
              {session.session_token}
            </p>
            {session.converted ? (
              <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Convertida em lead
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">
            Iniciada: {new Date(session.started_at).toLocaleString("pt-BR")}
          </p>
          {session.referrer ? (
            <p className="text-xs text-muted-foreground">
              Origem: {session.referrer}
            </p>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">Sem mensagens.</p>
        ) : (
          messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-spotorange-500/20 text-foreground border border-spotorange-500/30"
                    : m.role === "system"
                      ? "bg-emerald-500/10 text-emerald-200 border border-emerald-500/30 text-xs"
                      : "bg-white/5 text-foreground border border-white/10"
                }`}
              >
                {m.role === "system" ? (
                  <p className="text-[10px] uppercase font-semibold tracking-wide mb-1 opacity-70">
                    Sistema
                  </p>
                ) : null}
                <p>{m.content}</p>
                {m.intent ? (
                  <p className="mt-1 text-[10px] opacity-60">intent: {m.intent}</p>
                ) : null}
                <p className="mt-1 text-[10px] opacity-60">
                  {new Date(m.created_at).toLocaleTimeString("pt-BR")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
