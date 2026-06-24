"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ExternalLink, X, Search } from "lucide-react";
import type { FormField, FormSubmission } from "@/lib/forms/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface SubmissionWithLead extends FormSubmission {
  lead?: {
    id: string;
    full_name: string | null;
    email: string | null;
    company_name: string | null;
  } | null;
}

export function SubmissionsTable({
  submissions,
  fields,
}: {
  submissions: SubmissionWithLead[];
  fields: FormField[];
}) {
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<SubmissionWithLead | null>(null);

  const labelMap = useMemo(() => {
    const m: Record<string, string> = {};
    fields.forEach((f) => {
      m[f.field_key] = f.label;
    });
    return m;
  }, [fields]);

  const filtered = useMemo(() => {
    if (!q) return submissions;
    const s = q.toLowerCase();
    return submissions.filter((sub) => {
      const str = JSON.stringify(sub.payload).toLowerCase();
      return str.includes(s);
    });
  }, [q, submissions]);

  return (
    <>
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, e-mail, conteudo..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma resposta {q ? "encontrada" : "ainda"}.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground uppercase border-b border-white/10">
                    <th className="py-2 pr-3">Quando</th>
                    <th className="py-2 pr-3">Nome / E-mail</th>
                    <th className="py-2 pr-3">Empresa</th>
                    <th className="py-2 pr-3">Consent</th>
                    <th className="py-2 pr-3">Lead</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((sub) => {
                    const p = sub.payload as Record<string, unknown>;
                    const name = (p.full_name as string) ?? sub.lead?.full_name ?? "-";
                    const email = (p.email as string) ?? sub.lead?.email ?? "-";
                    const company = (p.company_name as string) ?? sub.lead?.company_name ?? "-";
                    return (
                      <tr key={sub.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-2 pr-3 text-xs text-muted-foreground">
                          {new Date(sub.submitted_at).toLocaleString("pt-BR")}
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium">{name}</div>
                          <div className="text-xs text-muted-foreground">{email}</div>
                        </td>
                        <td className="py-2 pr-3 text-xs">{company}</td>
                        <td className="py-2 pr-3 text-xs">
                          {sub.consent_given ? (
                            <span className="text-emerald-500">sim</span>
                          ) : (
                            <span className="text-red-400">nao</span>
                          )}
                        </td>
                        <td className="py-2 pr-3 text-xs">
                          {sub.lead_id ? (
                            <Link
                              href={`/app/leads/${sub.lead_id}`}
                              className="text-spotorange-400 hover:underline inline-flex items-center gap-1"
                            >
                              ver <ExternalLink className="h-3 w-3" />
                            </Link>
                          ) : (
                            "-"
                          )}
                        </td>
                        <td className="py-2 text-right">
                          <Button size="sm" variant="ghost" onClick={() => setDetail(sub)}>
                            Detalhe
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {detail && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setDetail(null)}
        >
          <div
            className="bg-card border border-white/10 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-4 border-b border-white/10 sticky top-0 bg-card">
              <div>
                <h3 className="font-bold">Submissao</h3>
                <p className="text-xs text-muted-foreground">
                  {new Date(detail.submitted_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <button
                onClick={() => setDetail(null)}
                className="text-muted-foreground hover:text-foreground p-1"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <Section title="Dados enviados">
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {Object.entries(detail.payload as Record<string, unknown>).map(([k, v]) => (
                    <div key={k} className="rounded-lg bg-white/[0.03] p-2">
                      <dt className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {labelMap[k] ?? k}
                      </dt>
                      <dd className="font-medium break-words">
                        {v === null || v === "" ? "-" : String(v)}
                      </dd>
                    </div>
                  ))}
                </dl>
              </Section>
              <Section title="Metadados">
                <dl className="text-xs space-y-1 font-mono">
                  <Row label="Lead ID" value={detail.lead_id ?? "-"} />
                  <Row label="Consent" value={detail.consent_given ? "sim" : "nao"} />
                  <Row label="IP" value={detail.ip ?? "-"} />
                  <Row label="Source URL" value={detail.source_url ?? "-"} />
                  <Row label="User Agent" value={detail.user_agent ?? "-"} />
                </dl>
              </Section>
              {detail.lead_id && (
                <Button asChild variant="orange" size="sm" className="w-full">
                  <Link href={`/app/leads/${detail.lead_id}`}>
                    Abrir lead no CRM
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground mb-1.5">
        {title}
      </div>
      {children}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <span className="text-muted-foreground w-24 flex-shrink-0">{label}:</span>
      <span className="break-all">{value}</span>
    </div>
  );
}
