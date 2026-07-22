import Link from "next/link";
import { ArrowLeft, ArrowRight, FileSpreadsheet } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TemplateImporter } from "@/components/proposals/template-importer";

export const dynamic = "force-dynamic";

export default async function ProposalTemplatesPage() {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { data: templates } = await supabase
    .from("proposal_templates")
    .select("id, name, description, created_at")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Link
        href="/app/propostas"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> Propostas
      </Link>

      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Modelos de proposta</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Cada modelo é um pacote completo: tabela de preços por região/CEP/peso,
          prazo de entrega e regras gerais — importado direto de uma planilha.
          Ao criar uma proposta, escolha um modelo em vez de digitar tudo de novo.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-6">
        <div className="space-y-3">
          {(!templates || templates.length === 0) ? (
            <Card className="border-white/10 bg-card/50">
              <CardContent className="py-12 text-center text-sm text-muted-foreground">
                Nenhum modelo importado ainda. Use o formulário ao lado.
              </CardContent>
            </Card>
          ) : (
            templates.map((t) => (
              <Link key={t.id} href={`/app/propostas/modelos/${t.id}`}>
                <Card className="border-white/10 bg-card/50 hover:border-white/20 transition">
                  <CardContent className="p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="grid h-10 w-10 place-items-center rounded-lg bg-spotorange-500/15 text-spotorange-500 shrink-0">
                        <FileSpreadsheet className="h-5 w-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold truncate">{t.name}</div>
                        {t.description && (
                          <div className="text-xs text-muted-foreground truncate">
                            {t.description}
                          </div>
                        )}
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>

        <Card className="border-white/10 bg-card/50 h-fit">
          <CardHeader>
            <CardTitle className="text-base">Importar novo modelo</CardTitle>
          </CardHeader>
          <CardContent>
            <TemplateImporter />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
