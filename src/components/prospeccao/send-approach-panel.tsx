"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Send, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { enviarTeste, enviarAbordagens } from "@/lib/prospeccao/actions";

type Lead = { id: string; name: string; phone: string; message: string };

export function SendApproachPanel({
  campaignId,
  leads,
}: {
  campaignId: string;
  leads: Lead[];
}) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [testPhone, setTestPhone] = useState("");
  const [pending, start] = useTransition();

  const toggle = (id: string) =>
    setSel((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const allSelected = leads.length > 0 && sel.size === leads.length;
  const toggleAll = () =>
    setSel(allSelected ? new Set() : new Set(leads.map((l) => l.id)));

  function sendTest() {
    start(async () => {
      try {
        await enviarTeste(testPhone, "✅ Teste do SDR Spotlog — envio pelo Comercial (97834-8288) OK.");
        toast.success("Teste enviado! Veja o WhatsApp do número informado.");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha no teste");
      }
    });
  }

  function sendSelected() {
    if (sel.size === 0) return;
    if (!window.confirm(`Enviar a abordagem por WhatsApp para ${sel.size} lead(s)? Envia pelo número Comercial (97834-8288).`))
      return;
    start(async () => {
      try {
        const r = await enviarAbordagens(campaignId, Array.from(sel));
        toast.success(
          `Enviados: ${r.sent} · pulados (sem WhatsApp/opt-out): ${r.skipped} · falhas: ${r.failed}`,
        );
        setSel(new Set());
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Falha ao enviar");
      }
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-card/50 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-emerald-400" />
        <h3 className="font-semibold">Enviar abordagem no WhatsApp (SDR · 97834-8288)</h3>
      </div>

      {/* Teste primeiro */}
      <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
        <p className="text-xs text-amber-200 mb-2">
          <strong>Teste primeiro:</strong> mande pro seu próprio número antes de disparar pros leads.
        </p>
        <div className="flex gap-2">
          <Input
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Seu número com DDD (ex.: 11 99999-9999)"
            className="h-9"
          />
          <Button size="sm" variant="outline" onClick={sendTest} disabled={pending}>
            {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
            Enviar teste
          </Button>
        </div>
      </div>

      {leads.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum lead pronto pra contatar ainda. Rode o <strong>&quot;Rodar tudo&quot;</strong> pra
          gerar telefone/WhatsApp + a mensagem da IA. Só aparecem aqui os leads com WhatsApp e
          mensagem.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} />
              Selecionar todos ({leads.length})
            </label>
            <Button
              size="sm"
              variant="orange"
              onClick={sendSelected}
              disabled={pending || sel.size === 0}
            >
              {pending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
              Aprovar e enviar ({sel.size})
            </Button>
          </div>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {leads.map((l) => (
              <label
                key={l.id}
                className="flex gap-3 rounded-md border border-white/10 bg-white/[0.02] p-2 cursor-pointer hover:bg-white/5"
              >
                <input
                  type="checkbox"
                  checked={sel.has(l.id)}
                  onChange={() => toggle(l.id)}
                  className="mt-1"
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">
                    {l.name}{" "}
                    <span className="text-[11px] text-muted-foreground">· {l.phone}</span>
                  </div>
                  <div className="text-[11px] text-sky-300/90 italic mt-0.5 line-clamp-3">
                    💬 {l.message}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground">
            Envia com intervalo de ~2,5s entre mensagens (anti-spam), até 25 por clique, e pula
            quem pediu opt-out (LGPD).
          </p>
        </>
      )}
    </div>
  );
}
