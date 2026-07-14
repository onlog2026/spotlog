"use client";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { colocarLeadsNaCadencia } from "@/app/app/leads/actions";

/**
 * "Colocar na cadência" — em massa, sem jargão: escolhe a cadência e a
 * máquina inscreve todos os leads novos/contactados que têm WhatsApp ou
 * e-mail. O disparo real acontece sozinho pelo cron.
 */
export function EnrollCadencePanel({
  sequences,
}: {
  sequences: { id: string; name: string }[];
}) {
  const [pending, start] = useTransition();
  const [seq, setSeq] = useState(sequences[0]?.id ?? "");

  if (sequences.length === 0) return null;

  function onClick() {
    if (!seq) return;
    if (
      !window.confirm(
        "Colocar TODOS os leads novos (com WhatsApp ou e-mail) nessa cadência? Os envios começam automaticamente.",
      )
    )
      return;
    start(async () => {
      try {
        const r = await colocarLeadsNaCadencia(seq);
        toast.success(
          `${r.enrolled} lead(s) entraram na cadência. ${r.skipped} pulado(s) (sem contato, opt-out ou já inscritos).`,
        );
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Falha");
      }
    });
  }

  return (
    <div className="flex items-center gap-2 flex-wrap rounded-xl border border-white/10 bg-card/50 px-3 py-2">
      <span className="text-xs font-semibold text-muted-foreground">
        Disparo automático:
      </span>
      <select
        value={seq}
        onChange={(e) => setSeq(e.target.value)}
        className="rounded-lg border border-white/10 bg-background px-2 py-1.5 text-xs focus:outline-none"
      >
        {sequences.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>
      <Button size="sm" variant="orange" onClick={onClick} disabled={pending || !seq}>
        {pending ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <Send className="h-3 w-3" />
        )}
        Colocar na cadência
      </Button>
    </div>
  );
}
