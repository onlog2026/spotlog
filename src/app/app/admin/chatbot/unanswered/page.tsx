import Link from "next/link";
import { requireSession } from "@/lib/auth";
import { listUnanswered } from "@/lib/queries/chatbot";
import { Card, CardContent } from "@/components/ui/card";
import { dismissUnansweredAction } from "../actions";
import { ArrowRight, X } from "lucide-react";
import { MarkSeenOnMount } from "@/components/notifications/mark-seen-on-mount";

export const dynamic = "force-dynamic";

export default async function UnansweredPage({
  searchParams,
}: {
  searchParams: Promise<{ resolved?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;
  const resolved = sp.resolved === "1";
  const items = await listUnanswered(resolved);

  return (
    <div className="space-y-4">
      <MarkSeenOnMount module="chatbot_unanswered" />
      <div className="flex items-center gap-3 text-sm">
        <Link
          href="/app/admin/chatbot/unanswered"
          className={`rounded-md px-3 py-1.5 ${!resolved ? "bg-white/10" : "border border-white/10 hover:bg-white/5"}`}
        >
          Abertas
        </Link>
        <Link
          href="/app/admin/chatbot/unanswered?resolved=1"
          className={`rounded-md px-3 py-1.5 ${resolved ? "bg-white/10" : "border border-white/10 hover:bg-white/5"}`}
        >
          Resolvidas
        </Link>
      </div>

      {items.length === 0 ? (
        <Card className="border-white/10 bg-card/40">
          <CardContent className="py-10 text-center text-muted-foreground">
            {resolved
              ? "Nenhuma pergunta resolvida ainda."
              : "Tudo respondido! O chatbot está cobrindo bem as perguntas."}
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {items.map((u) => (
            <li key={u.id}>
              <Card className="border-white/10 bg-card/40">
                <CardContent className="flex flex-wrap items-start justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="text-sm font-medium">{u.question}</p>
                    {u.context ? (
                      <p className="text-xs text-muted-foreground line-clamp-3 whitespace-pre-line">
                        {u.context}
                      </p>
                    ) : null}
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(u.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {!resolved ? (
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/app/admin/chatbot/knowledge/novo?from=${u.id}`}
                        className="inline-flex items-center gap-1 rounded-md bg-spotorange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-spotorange-600"
                      >
                        Criar resposta
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <form action={dismissUnansweredAction}>
                        <input type="hidden" name="id" value={u.id} />
                        <button
                          type="submit"
                          title="Descartar"
                          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1.5 text-xs hover:bg-white/5"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </div>
                  ) : (
                    <span className="text-xs text-emerald-400">Resolvida</span>
                  )}
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
