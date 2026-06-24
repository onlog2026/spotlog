import Link from "next/link";
import { Plus, FileText, Copy, Trash2, ExternalLink, BarChart3 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { listForms } from "@/lib/forms/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FormActions } from "@/components/admin/forms/form-actions";

export const dynamic = "force-dynamic";

export default async function FormsListPage() {
  const ctx = await requireSession();
  const forms = await listForms(ctx.org.id);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <FileText className="h-7 w-7 text-spotorange-500" />
            Formularios
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie e gerencie formularios publicos. Cada submissao vira lead no CRM.
          </p>
        </div>
        <Button asChild variant="orange" size="lg">
          <Link href="/app/admin/forms/novo">
            <Plus className="h-4 w-4" />
            Novo formulario
          </Link>
        </Button>
      </div>

      {forms.length === 0 ? (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="py-16 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum formulario ainda.</p>
            <Button asChild variant="orange" className="mt-4">
              <Link href="/app/admin/forms/novo">Criar o primeiro</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card
              key={form.id}
              className="border-white/10 bg-card/50 hover:border-white/20 transition flex flex-col"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex-1">{form.title}</CardTitle>
                  {form.active ? (
                    <Badge variant="default" className="bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/20">
                      Ativo
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Inativo</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground font-mono">/{form.slug}</p>
              </CardHeader>
              <CardContent className="space-y-3 flex-1 flex flex-col">
                {form.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{form.description}</p>
                )}
                <div className="grid grid-cols-3 gap-2 mt-auto">
                  <Stat label="Campos" value={form.fields_count} />
                  <Stat label="Total" value={form.submissions_total} />
                  <Stat label="7 dias" value={form.submissions_7d} highlight />
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/admin/forms/${form.id}/editor`}>
                      <FileText className="h-3.5 w-3.5" />
                      Editar
                    </Link>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/admin/forms/${form.id}/submissions`}>
                      <BarChart3 className="h-3.5 w-3.5" />
                      Respostas
                    </Link>
                  </Button>
                </div>
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/5 mt-2">
                  <Link
                    href={`/forms/${form.slug}`}
                    target="_blank"
                    className="text-xs text-spotorange-400 hover:underline inline-flex items-center gap-1"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Abrir publico
                  </Link>
                  <FormActions formId={form.id} formTitle={form.title} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, highlight = false }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.03] border border-white/5 p-2 text-center">
      <div className={`text-lg font-bold ${highlight ? "text-spotorange-400" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
    </div>
  );
}
