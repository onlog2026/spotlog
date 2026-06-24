"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Download, CheckCircle2, XCircle, AlertCircle, HelpCircle, Trash } from "lucide-react";

type Result = { email: string; status: "valid" | "invalid" | "risky" | "disposable" | "unknown"; reason: string };

const STATUS_COLOR: Record<Result["status"], string> = {
  valid: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  invalid: "text-red-400 bg-red-500/10 border-red-500/30",
  risky: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
  disposable: "text-orange-400 bg-orange-500/10 border-orange-500/30",
  unknown: "text-muted-foreground bg-white/5 border-white/10",
};

const STATUS_ICON: Record<Result["status"], React.ComponentType<{ className?: string }>> = {
  valid: CheckCircle2,
  invalid: XCircle,
  risky: AlertCircle,
  disposable: Trash,
  unknown: HelpCircle,
};

export function EmailValidatorForm() {
  const [emails, setEmails] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function validate() {
    setError(null);
    const list = emails
      .split(/[\n,;]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (list.length === 0) {
      setError("Cole pelo menos 1 e-mail");
      return;
    }
    if (list.length > 1000) {
      setError("Máximo 1000 e-mails por vez");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/marketing/email-validator", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ emails: list }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Falha na validação");
      } else {
        setResults(json.results ?? []);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro de rede");
    } finally {
      setLoading(false);
    }
  }

  function downloadCsv() {
    const lines = ["email,status,motivo"];
    results.forEach((r) =>
      lines.push(`"${r.email}","${r.status}","${r.reason.replace(/"/g, '""')}"`),
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `email-validation-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const counts = results.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-4 space-y-3">
          <Textarea
            rows={8}
            placeholder={"1 email por linha (ou separado por vírgula/ponto-vírgula)\nMáx 1000 por vez"}
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            disabled={loading}
          />
          {error && (
            <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/30 px-3 py-2 rounded-md">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Valida formato, domínio e MX. Lista descartáveis bloqueada.
            </p>
            <Button
              onClick={validate}
              disabled={loading || !emails.trim()}
              className="bg-[#BA0102] hover:bg-[#a10002] text-white"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1 animate-spin" /> Validando…
                </>
              ) : (
                "Validar todos"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results.length > 0 && (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap text-xs">
                <span className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  {counts.valid ?? 0} válidos
                </span>
                <span className="px-2 py-1 rounded bg-red-500/10 text-red-400 border border-red-500/30">
                  {counts.invalid ?? 0} inválidos
                </span>
                <span className="px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                  {counts.disposable ?? 0} descartáveis
                </span>
                <span className="px-2 py-1 rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                  {counts.risky ?? 0} suspeitos
                </span>
                <span className="px-2 py-1 rounded bg-white/5 text-muted-foreground border border-white/10">
                  {counts.unknown ?? 0} desconhecidos
                </span>
              </div>
              <Button
                onClick={downloadCsv}
                variant="outline"
                size="sm"
                className="border-white/20"
              >
                <Download className="h-3 w-3 mr-1" /> Baixar CSV
              </Button>
            </div>
            <div className="border border-white/10 rounded-md overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left p-2">Email</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Motivo</th>
                  </tr>
                </thead>
                <tbody>
                  {results.map((r, i) => {
                    const Icon = STATUS_ICON[r.status];
                    return (
                      <tr key={i} className="border-t border-white/5">
                        <td className="p-2 font-mono">{r.email}</td>
                        <td className="p-2">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] ${STATUS_COLOR[r.status]}`}
                          >
                            <Icon className="h-3 w-3" /> {r.status}
                          </span>
                        </td>
                        <td className="p-2 text-muted-foreground">{r.reason}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
