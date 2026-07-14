"use client";

import { useState } from "react";
import { Loader2, Mail } from "lucide-react";

export function EmailTestForm() {
  const [to, setTo] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function send() {
    if (!to.trim() || sending) return;
    setSending(true);
    setMsg(null);
    try {
      const r = await fetch("/api/admin/email-test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: to.trim() }),
      });
      const j = await r.json();
      setMsg(
        j.ok
          ? { ok: true, text: "Enviado! Veja sua caixa de entrada (e o spam)." }
          : { ok: false, text: j.error || "Falha ao enviar." },
      );
    } catch {
      setMsg({ ok: false, text: "Erro de rede." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="rounded-xl border border-white/10 p-4 bg-card/50 space-y-2">
      <div className="text-sm font-medium flex items-center gap-2">
        <Mail className="h-4 w-4" /> Enviar e-mail de teste
      </div>
      <div className="flex gap-2">
        <input
          value={to}
          onChange={(e) => setTo(e.target.value)}
          type="email"
          placeholder="seu@email.com"
          className="flex-1 rounded-lg bg-background border border-white/10 px-3 py-2 text-sm"
        />
        <button
          onClick={send}
          disabled={sending || !to.trim()}
          className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center gap-2 shrink-0"
        >
          {sending && <Loader2 className="h-4 w-4 animate-spin" />} Enviar teste
        </button>
      </div>
      {msg && (
        <div className={`text-xs ${msg.ok ? "text-emerald-400" : "text-red-400"}`}>{msg.text}</div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Precisa do domínio verificado no Resend (spotlog.com.br) pra enviar de verdade.
      </p>
    </div>
  );
}
