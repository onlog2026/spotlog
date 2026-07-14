import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listReports } from "@/lib/queries/marketing-ana";
import { runReport } from "../../actions";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

const REPORT_LABEL: Record<string, string> = {
  leads_by_source: "Leads por canal de origem",
  deals_by_stage: "Negócios por estágio do funil",
  revenue: "Receita mensal",
  conversion_funnel: "Funil de conversão",
  tickets_by_dept: "Tickets por categoria",
  custom_sql: "SQL customizado (admin)",
};

export default async function ExecutarRelatorioPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireSession();
  const reports = await listReports(ctx.org.id);
  const report = reports.find((r) => r.id === id);
  if (!report) notFound();

  const isCustomSql = report.report_type === "custom_sql";
  const rows = isCustomSql ? [] : await runReport(ctx.org.id, report.report_type);

  return (
    <div className="space-y-6">
      <Link
        href="/app/marketing/analisar/relatorios"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">{report.name}</h1>
        <p className="text-muted-foreground mt-1">
          {REPORT_LABEL[report.report_type] ?? report.report_type} — dados ao vivo
        </p>
      </div>

      {isCustomSql ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-6 text-sm text-muted-foreground">
            Relatórios "SQL customizado" ainda não têm execução automática — rodar
            SQL livre vindo de um campo de texto é risco de segurança sem uma
            allowlist de consultas. Se precisar disso, me diga qual consulta
            específica você quer e eu deixo pronta como um tipo de relatório fixo.
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <div className="text-center py-12 text-sm text-muted-foreground">
          Sem dados no período pra este relatório ainda.
        </div>
      ) : (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {rows.map((r, i) => (
                <div
                  key={`${r.label}-${i}`}
                  className="flex items-center justify-between px-5 py-3 text-sm"
                >
                  <span className="capitalize">{r.label}</span>
                  <div className="flex items-center gap-3">
                    {r.extra && (
                      <span className="text-xs text-muted-foreground">{r.extra}</span>
                    )}
                    <span className="font-semibold">{r.value.toLocaleString("pt-BR")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <p className="text-xs text-muted-foreground">
        Envio automático por e-mail (frequência {report.schedule ?? "manual"}) ainda
        não está implementado — hoje "Executar" só mostra o resultado na tela.
      </p>
    </div>
  );
}
