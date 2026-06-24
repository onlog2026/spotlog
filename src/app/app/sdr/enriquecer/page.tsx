import { EnrichForm } from "@/components/sdr/enrich-form";
import { Card, CardContent } from "@/components/ui/card";
import { Sparkles, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default function SdrEnriquecerPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg md:text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-spotorange-500" /> Enriquecer empresas
          por CNPJ
        </h2>
        <p className="text-xs text-muted-foreground">
          Busca em fonte pública (BrasilAPI) e cria leads automaticamente com
          score calculado.
        </p>
      </div>

      <EnrichForm />

      <Card className="border-blue-500/20 bg-blue-500/5">
        <CardContent className="p-4 flex items-start gap-2 text-xs text-blue-200">
          <Info className="h-4 w-4 mt-0.5 shrink-0" />
          <div className="space-y-1">
            <p>
              <strong>Fonte:</strong> BrasilAPI (dados públicos da Receita
              Federal). Sem custo, sem rate limit relevante pra uso comercial
              moderado.
            </p>
            <p>
              <strong>Cache:</strong> mesmo CNPJ não é re-consultado — fica
              salvo em <code>company_enrichment</code>.
            </p>
            <p>
              <strong>LGPD:</strong> dados de empresa (CNPJ, razão social,
              endereço, telefone, e-mail comercial) são dados públicos. Para
              contato direto, registre a base legal em{" "}
              <a className="underline" href="/app/sdr/lgpd">
                /app/sdr/lgpd
              </a>
              .
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
