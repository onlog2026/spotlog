import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listSessions } from "@/lib/queries/chatbot";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, CheckCircle2 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChatbotSessionsPage() {
  await requireSession();
  const sessions = await listSessions(50);

  return (
    <div className="space-y-3">
      {sessions.length === 0 ? (
        <Card className="border-white/10 bg-card/40">
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma sessão registrada ainda.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <Link href={`/app/admin/chatbot/sessions/${s.id}`}>
                <Card className="border-white/10 bg-card/40 hover:bg-card/60 transition">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                    <div className="space-y-0.5 min-w-0 flex-1">
                      <p className="font-mono text-xs text-muted-foreground truncate">
                        {s.session_token.slice(0, 16)}…
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Iniciada: {new Date(s.started_at).toLocaleString("pt-BR")}
                        {" · "}
                        Última: {new Date(s.last_activity_at).toLocaleString("pt-BR")}
                      </p>
                      {s.referrer ? (
                        <p className="text-[10px] text-muted-foreground truncate">
                          {s.referrer}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      {s.converted ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Convertida
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Em conversa</span>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
