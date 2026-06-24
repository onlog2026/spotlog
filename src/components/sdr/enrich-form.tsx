"use client";
import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Result {
  enriched: number;
  hits: number;
  createdLeadIds: string[];
  failed: ({ cnpj: string; reason: string } | string)[];
}

export function EnrichForm() {
  const [raw, setRaw] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  function extractCnpjs(input: string): string[] {
    return Array.from(
      new Set(
        input
          .split(/[\s,;\n]+/)
          .map((s) => s.replace(/\D/g, ""))
          .filter((s) => s.length === 14),
      ),
    );
  }

  async function handleSubmit() {
    setError(null);
    setResult(null);
    const cnpjs = extractCnpjs(raw);
    if (cnpjs.length === 0) {
      setError("Cole pelo menos um CNPJ válido (14 dígitos).");
      return;
    }
    if (cnpjs.length > 50) {
      setError("Máximo 50 CNPJs por lote. Faça em batches.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sdr/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cnpjs, createLeads: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Falha ao enriquecer.");
        return;
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  const detectedCount = extractCnpjs(raw).length;

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6 space-y-3">
          <label className="text-sm font-medium">
            CNPJs (um por linha, ou separados por vírgula)
          </label>
          <Textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={8}
            placeholder="33.000.167/0001-01&#10;00.000.000/0001-91&#10;..."
            className="font-mono text-sm"
          />
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground">
              {detectedCount > 0 ? (
                <>
                  <span className="text-spotorange-500 font-semibold">
                    {detectedCount}
                  </span>{" "}
                  CNPJ{detectedCount === 1 ? "" : "s"} válido
                  {detectedCount === 1 ? "" : "s"} detectado
                  {detectedCount === 1 ? "" : "s"}
                </>
              ) : (
                "Cole CNPJs no campo acima"
              )}
            </p>
            <Button
              variant="orange"
              onClick={handleSubmit}
              disabled={loading || detectedCount === 0}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-2" />
              )}
              {loading
                ? "Enriquecendo via BrasilAPI..."
                : `Enriquecer ${detectedCount || ""} CNPJ${detectedCount === 1 ? "" : "s"}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="p-4 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-sm text-red-200">{error}</p>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card className="border-emerald-500/30 bg-emerald-500/5">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              <h3 className="font-semibold">Enrichment concluído</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div>
                <div className="text-2xl font-bold">{result.enriched}</div>
                <div className="text-xs text-muted-foreground">Processados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-emerald-400">
                  {result.hits}
                </div>
                <div className="text-xs text-muted-foreground">
                  Dados encontrados
                </div>
              </div>
              <div>
                <div className="text-2xl font-bold text-spotorange-500">
                  {result.createdLeadIds.length}
                </div>
                <div className="text-xs text-muted-foreground">
                  Leads criados
                </div>
              </div>
            </div>
            {result.failed.length > 0 && (
              <div className="pt-2 border-t border-white/10 text-xs">
                <div className="text-muted-foreground mb-2 font-semibold">
                  Falharam ({result.failed.length}):
                </div>
                <ul className="space-y-1.5">
                  {result.failed.map((f, i) => {
                    const isObj = typeof f === "object" && f !== null;
                    const cnpj = isObj ? f.cnpj : (f as string);
                    const reason = isObj ? f.reason : "Sem dados na BrasilAPI";
                    return (
                      <li key={`${cnpj}-${i}`} className="flex items-start gap-2">
                        <Badge variant="outline" className="text-[10px] shrink-0">
                          {cnpj}
                        </Badge>
                        <span className="text-muted-foreground text-[11px] leading-tight">
                          {reason}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  💡 Se for &quot;timeout&quot;, a BrasilAPI está lenta — tenta de novo em 1 min.
                  Se for &quot;404&quot;, o CNPJ não existe na Receita Federal.
                </p>
              </div>
            )}
            <div className="pt-3">
              <Button variant="outline" size="sm" asChild>
                <a href="/app/sdr/leads">Ver leads criados</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
