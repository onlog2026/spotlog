"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Bot, Hand, Loader2, CalendarCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { assumirConversa, devolverConversa } from "@/lib/sdr/convo-actions";

/** Fila "Conversas da IA" — o agente SDR conversando com leads em tempo real. */
export type AiConvoItem = {
  leadId: string;
  name: string;
  company: string | null;
  phone: string | null;
  mode: "ai" | "human";
  closed: boolean;
  intent: string | null;
  prob: number | null;
  bant: {
    dor?: string;
    orcamento?: string;
    autoridade?: string;
    timing?: string;
  };
  briefing: string | null;
  meetingAt: string | null;
  lastMessages: { role: "lead" | "ia"; text: string }[];
  updatedAt: string | null;
};

const INTENT_LABEL: Record<string, string> = {
  interesse: "😀 Interessado",
  objecao: "🤔 Objeção",
  sem_autoridade: "👥 Sem autoridade",
  timing: "⏳ Timing",
  pedir_proposta: "📄 Pediu proposta",
  duvida: "❓ Dúvida",
  optout: "🚫 Opt-out",
  outro: "💬 Conversando",
};

export function AiConvos({ items }: { items: AiConvoItem[] }) {
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!items.length) return null;

  function toggle(item: AiConvoItem) {
    setBusyId(item.leadId);
    startTransition(async () => {
      try {
        if (item.mode === "ai") {
          await assumirConversa(item.leadId);
          toast.success("Você assumiu a conversa — a IA está muda até você devolver.");
        } else {
          await devolverConversa(item.leadId);
          toast.success("Conversa devolvida pra IA.");
        }
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao alternar.");
      } finally {
        setBusyId(null);
      }
    });
  }

  return (
    <Card className="border-brand-500/40 bg-brand-500/5">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-brand-400" />
          Conversas da IA ({items.length})
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          O agente SDR está conduzindo estas conversas no WhatsApp. Ele qualifica
          (dor, orçamento, autoridade, timing) e marca a reunião sozinho. Você pode
          assumir a qualquer momento — a IA para na hora.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((it) => (
          <div
            key={it.leadId}
            className="rounded-lg border border-white/10 bg-background/60 p-3 space-y-2"
          >
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">
                  {it.name}
                  {it.company ? (
                    <span className="text-muted-foreground"> · {it.company}</span>
                  ) : null}
                </div>
                <div className="text-[11px] text-muted-foreground flex items-center gap-2 flex-wrap mt-0.5">
                  <span>{INTENT_LABEL[it.intent ?? "outro"] ?? it.intent}</span>
                  {typeof it.prob === "number" && (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                      {it.prob}% de chance
                    </span>
                  )}
                  {it.meetingAt && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-brand-500/15 text-brand-400 border border-brand-500/30">
                      <CalendarCheck className="h-3 w-3" /> Reunião marcada
                    </span>
                  )}
                  {it.mode === "human" && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                      Você está no comando
                    </span>
                  )}
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant={it.mode === "ai" ? "outline" : "orange"}
                disabled={pending && busyId === it.leadId}
                onClick={() => toggle(it)}
              >
                {pending && busyId === it.leadId ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : it.mode === "ai" ? (
                  <>
                    <Hand className="h-3.5 w-3.5 mr-1" /> Assumir conversa
                  </>
                ) : (
                  <>
                    <Bot className="h-3.5 w-3.5 mr-1" /> Devolver pra IA
                  </>
                )}
              </Button>
            </div>

            {/* BANT */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-[11px]">
              {(
                [
                  ["Dor", it.bant.dor],
                  ["Orçamento", it.bant.orcamento],
                  ["Autoridade", it.bant.autoridade],
                  ["Timing", it.bant.timing],
                ] as const
              ).map(([k, v]) => (
                <div
                  key={k}
                  className={`rounded border px-2 py-1 truncate ${
                    v
                      ? "border-emerald-500/30 bg-emerald-500/10"
                      : "border-white/10 bg-white/5 text-muted-foreground"
                  }`}
                  title={v || `${k}: ainda não descoberto`}
                >
                  <span className="font-semibold">{k}:</span> {v || "—"}
                </div>
              ))}
            </div>

            {/* Últimas mensagens */}
            {it.lastMessages.length > 0 && (
              <div className="space-y-1">
                {it.lastMessages.map((mm, i) => (
                  <div
                    key={i}
                    className={`text-xs rounded-md px-2 py-1 max-w-[92%] ${
                      mm.role === "lead"
                        ? "bg-white/5 border border-white/10"
                        : "bg-brand-500/10 border border-brand-500/25 ml-auto"
                    }`}
                  >
                    <span className="font-semibold">
                      {mm.role === "lead" ? "Lead: " : "IA: "}
                    </span>
                    {mm.text}
                  </div>
                ))}
              </div>
            )}

            {/* Briefing do vendedor */}
            {it.briefing && (
              <details className="text-xs">
                <summary className="cursor-pointer font-semibold text-brand-400">
                  📋 Briefing do vendedor
                </summary>
                <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                  {it.briefing}
                </p>
              </details>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
