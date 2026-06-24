"use client";
import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface GeneratedStep {
  subject: string;
  body: string;
  days_after_previous: number;
}

export function GenerateSequenceButton({ leadId }: { leadId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sequence, setSequence] = useState<GeneratedStep[] | null>(null);
  const [fallback, setFallback] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setSequence(null);
    try {
      const res = await fetch("/api/sdr/generate-sequence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao gerar.");
        return;
      }
      setSequence(data.sequence);
      setFallback(Boolean(data.fallback));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <Button
        variant="orange"
        onClick={handleGenerate}
        disabled={loading}
        className="w-full md:w-auto"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4 mr-2" />
        )}
        {loading ? "Gerando sequência..." : "Gerar sequência IA (3 e-mails)"}
      </Button>

      {error && (
        <p className="text-sm text-red-500" role="alert">
          {error}
        </p>
      )}

      {fallback && (
        <p className="text-xs text-amber-500">
          Usando template padrão (OpenAI indisponível ou rate limit).
        </p>
      )}

      {sequence && (
        <div className="space-y-3">
          {sequence.map((s, i) => (
            <Card key={i} className="border-white/10 bg-card/50">
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between flex-wrap gap-2">
                  <div>
                    <div className="text-[11px] uppercase tracking-wider text-spotorange-500 font-semibold">
                      E-mail {i + 1} · {s.days_after_previous === 0
                        ? "Dia 0"
                        : `+${s.days_after_previous} dias`}
                    </div>
                    <div className="font-semibold mt-1">{s.subject}</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {s.body}
                </p>
              </CardContent>
            </Card>
          ))}
          <p className="text-[11px] text-muted-foreground">
            Pré-visualização. Pra enfileirar e enviar, adicione à cadência em{" "}
            <a className="underline" href="/app/cadencias">
              /app/cadencias
            </a>
            . Toda mensagem passa pela checagem LGPD antes do envio.
          </p>
        </div>
      )}
    </div>
  );
}
