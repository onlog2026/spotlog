import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Trash2 } from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import {
  excluirItemAction,
  adicionarItemAction,
  renomearTabelaAction,
} from "../actions";

export const dynamic = "force-dynamic";

type Product = {
  id: string;
  name: string;
  sku: string | null;
  unit: string | null;
  category: string | null;
  price: number;
};

export default async function TabelaDetalhePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireOrgModule("propostas");
  const supabase = await createClient();

  const { data: table } = await supabase
    .from("price_tables")
    .select("id, name, currency, is_default, source_filename, imported_at")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();

  if (!table) notFound();

  const { data: products } = await supabase
    .from("products")
    .select("id, name, sku, unit, category, price")
    .eq("price_table_id", id)
    .eq("organization_id", ctx.org.id)
    .order("name", { ascending: true });

  const items = (products ?? []) as Product[];
  const currency = (table as { currency?: string }).currency ?? "BRL";

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/propostas/tabelas"
          className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground mb-2"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Voltar pra tabelas
        </Link>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h1 className="text-2xl md:text-3xl font-bold">{table.name}</h1>
          <form action={renomearTabelaAction} className="flex items-center gap-2">
            <input type="hidden" name="table_id" value={id} />
            <Input
              name="name"
              defaultValue={table.name}
              className="h-8 w-48 text-sm"
              placeholder="Renomear tabela"
            />
            <Button type="submit" size="sm" variant="outline">
              Salvar nome
            </Button>
          </form>
        </div>
        <p className="text-muted-foreground mt-1 text-sm">
          {items.length} {items.length === 1 ? "item" : "itens"}
        </p>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-6">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Adicionar item
          </h2>
          <form
            action={adicionarItemAction}
            className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 items-end"
          >
            <input type="hidden" name="table_id" value={id} />
            <div className="lg:col-span-2">
              <label className="text-xs text-muted-foreground">Nome *</label>
              <Input name="name" required placeholder="Ex: Frete Sudeste" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">SKU</label>
              <Input name="sku" placeholder="Opcional" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Unidade</label>
              <Input name="unit" placeholder="un" defaultValue="un" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Preço *</label>
              <Input name="price" type="number" step="0.01" required placeholder="0,00" />
            </div>
            <div className="lg:col-span-5">
              <label className="text-xs text-muted-foreground">Categoria</label>
              <Input name="category" placeholder="Opcional" />
            </div>
            <div className="lg:col-span-5">
              <Button type="submit" size="sm">
                Adicionar item
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
          Itens da tabela
        </h2>
        {items.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">
            Nenhum item nesta tabela ainda.
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((p) => (
              <Card key={p.id} className="border-white/10 bg-card/50">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.name}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {[p.sku && `SKU ${p.sku}`, p.category, p.unit]
                        .filter(Boolean)
                        .join(" · ")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="font-semibold text-sm">
                      {formatCurrency(Number(p.price ?? 0), currency)}
                    </div>
                    <form action={excluirItemAction}>
                      <input type="hidden" name="product_id" value={p.id} />
                      <input type="hidden" name="table_id" value={id} />
                      <Button
                        type="submit"
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
