import Link from "next/link";
import { FileSpreadsheet, ArrowRight } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PriceTableUploader } from "@/components/proposals/price-table-uploader";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TabelasPage() {
  const ctx = await requireSession();
  const supabase = await createClient();

  const { data: tables } = await supabase
    .from("price_tables")
    .select(
      "id, name, currency, is_default, source_filename, imported_at, products(count)",
    )
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Tabelas de preço</h1>
        <p className="text-muted-foreground mt-1">
          Suba uma planilha Excel (.xlsx) com seus produtos/serviços. Vira
          catálogo pra montar propostas.
        </p>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6">
          <PriceTableUploader />
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Tabelas
        </h2>
        {!tables || tables.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Nenhuma tabela cadastrada ainda.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {tables.map((t) => {
              const tb = t as unknown as {
                id: string;
                name: string;
                is_default: boolean;
                source_filename: string | null;
                imported_at: string;
                products: { count: number }[];
              };
              const count = tb.products?.[0]?.count ?? 0;
              return (
                <Card
                  key={tb.id}
                  className="border-white/10 bg-card/50 hover:border-white/20"
                >
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <FileSpreadsheet className="h-4 w-4 text-brand-400" />
                        <Link
                          href={`/app/propostas/tabelas/${tb.id}`}
                          className="font-semibold hover:underline"
                        >
                          {tb.name}
                        </Link>
                      </div>
                      {tb.is_default && (
                        <Badge variant="default" className="text-[10px]">
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground space-y-1">
                      <div>{count} itens</div>
                      {tb.source_filename && (
                        <div className="truncate">📄 {tb.source_filename}</div>
                      )}
                      <div>Importada {formatDateTime(tb.imported_at)}</div>
                    </div>
                    <Link
                      href={`/app/propostas/tabelas/${tb.id}`}
                      className="text-xs text-brand-400 flex items-center gap-1 hover:underline"
                    >
                      Ver itens <ArrowRight className="h-3 w-3" />
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
