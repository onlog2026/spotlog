import Link from "next/link";
import { ArrowRight, Plus, Users2, Search } from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials } from "@/lib/utils";
import { FlashBanner } from "@/components/crm/flash-banner";
import { FiltersUfCidade } from "@/components/crm/filters-uf-cidade";
import { listContacts } from "@/lib/queries/contatos";
import { listCompanyOptions } from "@/lib/queries/empresas";

export const dynamic = "force-dynamic";

export default async function ContatosPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    company_id?: string;
    state?: string;
    city?: string;
    created?: string;
    deleted?: string;
    error?: string;
  }>;
}) {
  const ctx = await requireOrgModule("crm"); // Eixo A — neutro enquanto enforcement OFF
  const { q, company_id, state, city, created, deleted, error } =
    await searchParams;
  const [contacts, companies] = await Promise.all([
    listContacts(ctx.org.id, {
      search: q,
      companyId: company_id,
      state,
      city,
      limit: 200,
    }),
    listCompanyOptions(ctx.org.id),
  ]);

  const hasFilter = Boolean(q || company_id || state || city);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Contatos</h1>
          <p className="text-muted-foreground mt-1">
            Pessoas que você conhece. Decisores, influenciadores, parceiros.
          </p>
        </div>
        <Button variant="orange" asChild>
          <Link href="/app/contatos/novo">
            <Plus className="h-4 w-4" />
            Novo contato
          </Link>
        </Button>
      </div>

      {created ? <FlashBanner message="Contato criado com sucesso." /> : null}
      {deleted ? <FlashBanner message="Contato excluído." /> : null}
      {error ? <FlashBanner type="error" message={error} /> : null}

      <Card>
        <CardContent className="p-4">
          <form
            method="get"
            className="flex flex-col md:flex-row md:flex-wrap gap-3 items-stretch md:items-center"
            aria-label="Filtrar contatos"
          >
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar por nome, e-mail ou telefone"
                className="pl-9 hover:border-spotorange-500 transition-colors"
              />
            </div>
            <FiltersUfCidade initialState={state} initialCity={city} />
            <select
              name="company_id"
              defaultValue={company_id ?? ""}
              className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm md:w-56 hover:border-spotorange-500 transition-colors"
            >
              <option value="">Todas as empresas</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button type="submit">Filtrar</Button>
            {hasFilter ? (
              <Button type="button" variant="ghost" asChild>
                <Link href="/app/contatos">Limpar</Link>
              </Button>
            ) : null}
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {contacts.length === 0 ? (
            <Empty />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-4">Nome</th>
                    <th className="text-left p-4 hidden md:table-cell">
                      Empresa
                    </th>
                    <th className="text-left p-4 hidden md:table-cell">
                      Cargo
                    </th>
                    <th className="text-left p-4 hidden lg:table-cell">
                      E-mail
                    </th>
                    <th className="text-left p-4 hidden lg:table-cell">
                      Telefone
                    </th>
                    <th className="text-left p-4 hidden xl:table-cell">
                      Cidade/UF
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {contacts.map((ct) => (
                    <tr
                      key={ct.id}
                      className="border-b border-border hover:bg-muted/40 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="text-xs bg-navy-900 text-white">
                              {initials(ct.full_name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <Link
                              href={`/app/contatos/${ct.id}`}
                              className="font-medium hover:underline flex items-center gap-1.5"
                            >
                              {ct.full_name}
                              {ct.is_decision_maker ? (
                                <Badge variant="orange" className="text-[9px]">
                                  Decisor
                                </Badge>
                              ) : null}
                              {ct.do_not_contact ? (
                                <Badge variant="destructive" className="text-[9px]">
                                  DNC
                                </Badge>
                              ) : null}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">
                        {ct.companies?.name ?? "—"}
                      </td>
                      <td className="p-4 hidden md:table-cell text-muted-foreground">
                        {ct.job_title ?? "—"}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                        {ct.email ?? "—"}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                        {ct.whatsapp ?? ct.phone ?? "—"}
                      </td>
                      <td className="p-4 hidden xl:table-cell text-muted-foreground text-xs">
                        {[ct.city, ct.state].filter(Boolean).join("/") || "—"}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/app/contatos/${ct.id}`}
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

function Empty() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-spotorange-500/15 mb-4">
        <Users2 className="h-7 w-7 text-spotorange-500" />
      </div>
      <h3 className="font-semibold text-lg">Nenhum contato</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Cadastre seu primeiro contato manualmente ou converta um lead.
      </p>
      <Button variant="orange" className="mt-6" asChild>
        <Link href="/app/contatos/novo">
          <Plus className="h-4 w-4" /> Novo contato
        </Link>
      </Button>
    </div>
  );
}
