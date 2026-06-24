import { requireSession } from "@/lib/auth";
import { listReports } from "@/lib/queries/marketing-ana";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Trash2, Plus, Play } from "lucide-react";
import { saveReportForm, deleteReport } from "../actions";

export const dynamic = "force-dynamic";

const REPORT_TYPES = [
  { v: "leads_by_source", l: "Leads por canal de origem" },
  { v: "deals_by_stage", l: "Negócios por estágio do funil" },
  { v: "revenue", l: "Receita mensal" },
  { v: "conversion_funnel", l: "Funil de conversão" },
  { v: "tickets_by_dept", l: "Tickets por departamento" },
  { v: "custom_sql", l: "SQL customizado (admin)" },
];

const REPORT_LABEL: Record<string, string> = Object.fromEntries(
  REPORT_TYPES.map((r) => [r.v, r.l]),
);

export default async function RelatoriosPage() {
  const ctx = await requireSession();
  const reports = await listReports(ctx.org.id);

  async function remove(formData: FormData) {
    "use server";
    await deleteReport(String(formData.get("id")));
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Relatórios</h2>
        <p className="text-sm text-muted-foreground">
          Crie relatórios reutilizáveis e agende envio automático por e-mail.
        </p>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base inline-flex items-center gap-2">
            <Plus className="h-4 w-4" /> Novo relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form action={saveReportForm} className="grid sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" required placeholder="Ex: Resumo semanal de leads" />
            </div>
            <div>
              <Label htmlFor="report_type">Tipo *</Label>
              <select
                id="report_type"
                name="report_type"
                required
                className="w-full h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm"
              >
                {REPORT_TYPES.map((r) => (
                  <option key={r.v} value={r.v}>
                    {r.l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label htmlFor="schedule">Frequência</Label>
              <select
                id="schedule"
                name="schedule"
                className="w-full h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm"
              >
                <option value="manual">Manual</option>
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="recipients">Destinatários (separe por vírgula)</Label>
              <Input
                id="recipients"
                name="recipients"
                placeholder="ana@empresa.com, joao@empresa.com"
              />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" className="bg-[#BA0102] hover:bg-[#a10002] text-white">
                Salvar relatório
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {reports.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-12 text-center">
            <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-semibold mb-1">Nenhum relatório salvo</p>
            <p className="text-sm text-muted-foreground">
              Crie seu primeiro relatório acima.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {reports.map((r) => (
            <Card key={r.id} className="border-white/10 bg-card/50">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="h-10 w-10 rounded-md bg-[#011960] text-white inline-flex items-center justify-center flex-none">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h3 className="font-semibold text-sm">{r.name}</h3>
                    <Badge variant="secondary" className="text-[10px]">
                      {REPORT_LABEL[r.report_type] ?? r.report_type}
                    </Badge>
                    {r.schedule && r.schedule !== "manual" && (
                      <Badge className="bg-blue-500/20 text-blue-300 text-[10px]">
                        {r.schedule}
                      </Badge>
                    )}
                  </div>
                  {r.recipients && r.recipients.length > 0 && (
                    <p className="text-[11px] text-muted-foreground">
                      Envia para: {r.recipients.join(", ")}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    Criado {new Date(r.created_at).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="outline" className="border-white/20" disabled>
                    <Play className="h-3 w-3 mr-1" /> Executar
                  </Button>
                  <form action={remove}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" size="icon" variant="ghost">
                      <Trash2 className="h-4 w-4 text-red-400" />
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
