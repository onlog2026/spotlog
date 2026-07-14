"use client";
import { useState, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CalendarPlus, Loader2, MessageSquare, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { marcarReuniao, dispensarResposta } from "@/lib/sdr/reuniao-actions";

export type RepliedItem = {
  enrollmentId: string;
  contactName: string;
  companyName: string | null;
  phone: string | null;
  email: string | null;
  lastMessage: string | null;
  repliedAt: string | null;
};

export function RepliedQueue({ items }: { items: RepliedItem[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!items.length) return null;

  function agendar(id: string) {
    setBusyId(id);
    startTransition(async () => {
      try {
        await marcarReuniao(id);
        toast.success("Reunião criada na agenda (amanhã 10h — ajuste o horário).");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao criar reunião");
      } finally {
        setBusyId(null);
      }
    });
  }

  function dispensar(id: string) {
    setBusyId(id);
    startTransition(async () => {
      try {
        await dispensarResposta(id);
        toast.success("Resposta dispensada.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao dispensar");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <Card className="border-emerald-500/40 bg-emerald-500/5">
      <CardContent className="p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-semibold flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-emerald-400" />
              Responderam — agende a reunião ({items.length})
            </h2>
            <p className="text-xs text-muted-foreground">
              A cadência parou automaticamente pra esses leads. Confirme o
              horário na conversa e marque a reunião.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/app/inbox">Abrir conversas</Link>
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((it) => (
            <div
              key={it.enrollmentId}
              className="flex items-center justify-between gap-3 rounded-md border border-white/10 bg-card/60 px-3 py-2 flex-wrap"
            >
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">
                  {it.contactName}
                  {it.companyName ? (
                    <span className="text-muted-foreground font-normal">
                      {" "}
                      · {it.companyName}
                    </span>
                  ) : null}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {it.phone ?? it.email ?? "sem contato"}
                  {it.lastMessage ? ` — "${it.lastMessage.slice(0, 80)}"` : ""}
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  variant="orange"
                  disabled={pending && busyId === it.enrollmentId}
                  onClick={() => agendar(it.enrollmentId)}
                >
                  {pending && busyId === it.enrollmentId ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <CalendarPlus className="h-3.5 w-3.5 mr-1" />
                  )}
                  Marcar reunião
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  disabled={pending && busyId === it.enrollmentId}
                  onClick={() => dispensar(it.enrollmentId)}
                  title="Não vira reunião"
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
