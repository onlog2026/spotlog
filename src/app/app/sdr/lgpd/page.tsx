import { ShieldCheck, AlertTriangle } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getSdrClient } from "@/lib/sdr/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AddConsentDialog,
  AddOptOutDialog,
} from "@/components/sdr/lgpd-actions";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

const BASIS_LABEL: Record<string, string> = {
  consentimento: "Consentimento (Art. 7º, I)",
  interesse_legitimo: "Interesse legítimo (Art. 7º, IX)",
  execucao_contrato: "Execução de contrato (Art. 7º, V)",
  obrigacao_legal: "Obrigação legal (Art. 7º, II)",
};

const TYPE_VARIANT: Record<
  string,
  "success" | "default" | "destructive" | "warning"
> = {
  opt_in: "success",
  legitimate_interest: "default",
  opt_out: "destructive",
  unsubscribed: "warning",
};

const TYPE_LABEL: Record<string, string> = {
  opt_in: "Opt-in",
  legitimate_interest: "Interesse legítimo",
  opt_out: "Opt-out",
  unsubscribed: "Cancelado",
};

export default async function SdrLgpdPage() {
  const ctx = await requireSession();
  const supabase = await getSdrClient();

  const startOfMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1,
  ).toISOString();

  const [
    { data: consents },
    { data: suppressions },
    { count: optOutsMonth },
    { count: totalConsents },
    { count: totalSuppression },
    { data: breakdown },
  ] = await Promise.all([
    supabase
      .from("lead_consents")
      .select(
        "id, email, phone, consent_type, legal_basis, source, recorded_at, notes",
      )
      .eq("organization_id", ctx.org.id)
      .order("recorded_at", { ascending: false })
      .limit(50),
    supabase
      .from("suppression_list")
      .select("id, email, phone, reason, added_at")
      .eq("organization_id", ctx.org.id)
      .order("added_at", { ascending: false })
      .limit(50),
    supabase
      .from("lead_consents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("consent_type", "opt_out")
      .gte("recorded_at", startOfMonth),
    supabase
      .from("lead_consents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id),
    supabase
      .from("suppression_list")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id),
    supabase
      .from("lead_consents")
      .select("consent_type")
      .eq("organization_id", ctx.org.id),
  ]);

  // Breakdown manual
  const counts: Record<string, number> = {};
  for (const row of breakdown ?? []) {
    const t = (row as { consent_type: string }).consent_type;
    counts[t] = (counts[t] ?? 0) + 1;
  }
  const totalBreakdown = Object.values(counts).reduce((a, b) => a + b, 0) || 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-400" /> Conformidade LGPD
          </h2>
          <p className="text-xs text-muted-foreground">
            Registros de consentimento, suppression list e auditoria.
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <AddConsentDialog />
          <AddOptOutDialog />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{totalConsents ?? 0}</div>
            <div className="text-xs text-muted-foreground">
              Registros totais
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-400">
              {totalSuppression ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">
              Em suppression
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-amber-400">
              {optOutsMonth ?? 0}
            </div>
            <div className="text-xs text-muted-foreground">Opt-outs no mês</div>
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-emerald-400">
              {Math.round(
                ((counts.opt_in ?? 0) + (counts.legitimate_interest ?? 0)) /
                  totalBreakdown *
                  100,
              )}
              %
            </div>
            <div className="text-xs text-muted-foreground">Base legítima</div>
          </CardContent>
        </Card>
      </div>

      {/* Breakdown bars */}
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6 space-y-3">
          <h3 className="font-semibold">Distribuição por tipo</h3>
          <div className="space-y-2">
            {["opt_in", "legitimate_interest", "opt_out", "unsubscribed"].map(
              (k) => {
                const v = counts[k] ?? 0;
                const pct = Math.round((v / totalBreakdown) * 100);
                return (
                  <div key={k}>
                    <div className="flex justify-between text-xs mb-1">
                      <span>{TYPE_LABEL[k]}</span>
                      <span className="text-muted-foreground">
                        {v} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className={`h-full ${
                          k === "opt_out" || k === "unsubscribed"
                            ? "bg-red-500"
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              },
            )}
          </div>
        </CardContent>
      </Card>

      {/* Consentimentos recentes */}
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-0">
          <div className="p-4 border-b border-white/10">
            <h3 className="font-semibold">Consentimentos recentes</h3>
            <p className="text-xs text-muted-foreground">Últimos 50 registros</p>
          </div>
          {!consents || consents.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Nenhum consentimento registrado ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-3 font-medium">Tipo</th>
                    <th className="text-left p-3 font-medium">Contato</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">
                      Base legal
                    </th>
                    <th className="text-left p-3 font-medium hidden lg:table-cell">
                      Origem
                    </th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">
                      Registrado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(consents as Array<{
                    id: string;
                    email: string | null;
                    phone: string | null;
                    consent_type: string;
                    legal_basis: string;
                    source: string | null;
                    recorded_at: string;
                    notes: string | null;
                  }>).map((c) => (
                    <tr
                      key={c.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-3">
                        <Badge variant={TYPE_VARIANT[c.consent_type] ?? "outline"}>
                          {TYPE_LABEL[c.consent_type] ?? c.consent_type}
                        </Badge>
                      </td>
                      <td className="p-3 text-xs">
                        {c.email || c.phone || "—"}
                      </td>
                      <td className="p-3 text-xs hidden md:table-cell text-muted-foreground">
                        {BASIS_LABEL[c.legal_basis] ?? c.legal_basis}
                      </td>
                      <td className="p-3 text-xs hidden lg:table-cell text-muted-foreground">
                        {c.source ?? "—"}
                      </td>
                      <td className="p-3 text-xs hidden md:table-cell text-muted-foreground">
                        {formatDateTime(c.recorded_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suppression list */}
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-0">
          <div className="p-4 border-b border-white/10 flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h3 className="font-semibold flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" /> Suppression
                list
              </h3>
              <p className="text-xs text-muted-foreground">
                Esses contatos NUNCA recebem outbound, independentemente da
                cadência.
              </p>
            </div>
          </div>
          {!suppressions || suppressions.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground text-center">
              Nenhum contato na suppression list.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-3 font-medium">Contato</th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">
                      Motivo
                    </th>
                    <th className="text-left p-3 font-medium hidden md:table-cell">
                      Adicionado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(suppressions as Array<{
                    id: string;
                    email: string | null;
                    phone: string | null;
                    reason: string;
                    added_at: string;
                  }>).map((s) => (
                    <tr
                      key={s.id}
                      className="border-b border-white/5 hover:bg-white/5"
                    >
                      <td className="p-3 text-xs font-mono">
                        {s.email || s.phone || "—"}
                      </td>
                      <td className="p-3 text-xs hidden md:table-cell text-muted-foreground">
                        {s.reason}
                      </td>
                      <td className="p-3 text-xs hidden md:table-cell text-muted-foreground">
                        {formatDateTime(s.added_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <p className="text-[11px] text-muted-foreground text-center pt-2">
        Lei Geral de Proteção de Dados (Lei 13.709/2018). Bases legais
        suportadas: Art. 7º, I (consentimento), V (execução de contrato), IX
        (interesse legítimo), II (obrigação legal). Opt-out é absoluto e
        prevalece sobre qualquer base legal.
      </p>
    </div>
  );
}
