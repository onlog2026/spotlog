import Link from "next/link";
import { ArrowRight, Plus, Building2, Search } from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FlashBanner } from "@/components/crm/flash-banner";
import { FiltersUfCidade } from "@/components/crm/filters-uf-cidade";
import { listCompanies } from "@/lib/queries/empresas";

export const dynamic = "force-dynamic";

const INDUSTRY_FILTERS = [
  { value: "", label: "Todos segmentos" },
  { value: "ecommerce", label: "E-commerce" },
  { value: "farma", label: "Farma" },
  { value: "manipulacao", label: "Manipulação" },
  { value: "correlatos", label: "Correlatos" },
  { value: "dermo", label: "Dermo" },
  { value: "b2b", label: "B2B" },
  { value: "saude", label: "Saúde" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "logistica", label: "Logística" },
  { value: "outro", label: "Outro" },
];

export default async function EmpresasPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    industry?: string;
    state?: string;
    city?: string;
    created?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const ctx = await requireOrgModule("crm"); // Eixo A — neutro enquanto enforcement OFF
  const { q, industry, state, city, created, deleted, error } =
    await searchParams;
  const data = await listCompanies(ctx.org.id, {
    search: q,
    industry,
    state,
    city,
    limit: 200,
  });

  const hasFilter = Boolean(q || industry || state || city);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Empresas</h1>
          <p className="text-muted-foreground mt-1">
            Contas / empresas alvo. Vinculadas aos contatos e deals.
          </p>
        </div>
        <Button variant="orange" asChild>
          <Link href="/app/empresas/nova">
            <Plus className="h-4 w-4" />
            Nova empresa
          </Link>
        </Button>
      </div>

      {created ? (
        <FlashBanner message="Empresa criada com sucesso." />
      ) : null}
      {deleted ? <FlashBanner message="Empresa excluída." /> : null}
      {error ? <FlashBanner type="error" message={error} /> : null}

      <Card>
        <CardContent className="p-4 space-y-4">
          <form
            method="get"
            className="flex flex-col md:flex-row md:flex-wrap gap-3 items-stretch md:items-center"
            aria-label="Filtrar empresas"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar por nome, CNPJ ou domínio"
                className="pl-9 hover:border-spotorange-500 transition-colors"
              />
            </div>
            <FiltersUfCidade initialState={state} initialCity={city} />
            <select
              name="industry"
              defaultValue={industry ?? ""}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm md:w-56 hover:border-spotorange-500 transition-colors"
            >
              {INDUSTRY_FILTERS.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
            <Button type="submit" variant="default">
              Filtrar
            </Button>
            {hasFilter ? (
              <Button type="button" variant="ghost" asChild>
                <Link href="/app/empresas">Limpar</Link>
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {data.length === 0 ? (
            <div className="text-center py-16">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-spotorange-500/15 mb-4">
                <Building2 className="h-7 w-7 text-spotorange-500" />
              </div>
              <h3 className="font-semibold text-lg">Nenhuma empresa</h3>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Cadastre a primeira empresa ou ajuste o filtro de busca.
              </p>
              <Button variant="orange" className="mt-6" asChild>
                <Link href="/app/empresas/nova">
                  <Plus className="h-4 w-4" /> Nova empresa
                </Link>
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Razão social</th>
                    <th className="text-left p-4 hidden md:table-cell">CNPJ</th>
                    <th className="text-left p-4 hidden md:table-cell">
                      Segmento
                    </th>
                    <th className="text-left p-4 hidden lg:table-cell">
                      Cidade/UF
                    </th>
                    <th className="text-left p-4 hidden lg:table-cell">
                      Domínio
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {data.map((co) => (
                    <tr
                      key={co.id}
                      className="border-b border-border hover:bg-muted/40 transition-colors"
                    >
                      <td className="p-4">
                        <Link
                          href={`/app/empresas/${co.id}`}
                          className="font-medium hover:underline"
                        >
                          {co.name}
                        </Link>
                        {co.legal_name ? (
                          <div className="text-xs text-muted-foreground">
                            {co.legal_name}
                          </div>
                        ) : null}
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground text-xs">
                        {co.cnpj ?? "—"}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {co.industry ? (
                          <Badge variant="outline">{co.industry}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                        {[co.city, co.state].filter(Boolean).join("/") || "—"}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                        {co.domain ?? "—"}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/app/empresas/${co.id}`}
                          className="text-spotorange-500 hover:underline text-xs flex items-center gap-1"
                        >
                          Abrir <ArrowRight className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
