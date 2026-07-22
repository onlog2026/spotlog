import Link from "next/link";
import { Plus, Users2, Search } from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { FlashBanner } from "@/components/crm/flash-banner";
import { FiltersUfCidade } from "@/components/crm/filters-uf-cidade";
import { ContactsTable } from "@/components/contatos/contacts-table";
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
          {contacts.length === 0 ? <Empty /> : <ContactsTable contacts={contacts} />}
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
