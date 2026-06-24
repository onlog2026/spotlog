import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Building2,
  Phone,
  Globe,
  MapPin,
  Linkedin,
  Users2,
  Target,
  Briefcase,
  Plus,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FlashBanner } from "@/components/crm/flash-banner";
import { DeleteButton } from "@/components/crm/delete-button";
import { getCompany } from "@/lib/queries/empresas";
import { listContactsByCompany } from "@/lib/queries/contatos";
import { createClient } from "@/lib/supabase/server";
import { deleteCompany } from "../actions";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function EmpresaDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    error?: string;
  }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const { created, updated, error } = await searchParams;

  const company = await getCompany(ctx.org.id, id);
  if (!company) notFound();

  const contacts = await listContactsByCompany(ctx.org.id, id);

  const supabase = await createClient();
  const { data: deals } = await supabase
    .from("deals")
    .select("id, title, amount, currency, status, expected_close_date")
    .eq("organization_id", ctx.org.id)
    .eq("company_id", id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/empresas">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/app/empresas/${id}/usuarios`}>
              <Users2 className="h-4 w-4" />
              Usuários do Portal
            </Link>
          </Button>
          <Button variant="default" size="sm" asChild>
            <Link href={`/app/empresas/${id}/editar`}>
              <Pencil className="h-4 w-4" />
              Editar
            </Link>
          </Button>
          <DeleteButton
            action={deleteCompany.bind(null, id)}
            label="Excluir empresa"
          />
        </div>
      </div>

      {created ? (
        <FlashBanner message="Empresa criada com sucesso." />
      ) : null}
      {updated ? <FlashBanner message="Empresa atualizada." /> : null}
      {error ? <FlashBanner type="error" message={error} /> : null}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-navy-900/10 dark:bg-white/10 grid place-items-center shrink-0">
              <Building2 className="h-7 w-7 text-navy-900 dark:text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold truncate">
                {company.name}
              </h1>
              <div className="flex flex-wrap gap-2 items-center mt-2 text-sm text-muted-foreground">
                {company.cnpj ? <span>CNPJ {company.cnpj}</span> : null}
                {company.industry ? (
                  <Badge variant="outline">{company.industry}</Badge>
                ) : null}
                {company.size ? (
                  <Badge variant="secondary">{company.size}</Badge>
                ) : null}
                {company.created_at ? (
                  <span className="text-xs">
                    desde {formatDate(company.created_at)}
                  </span>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Dados</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {company.legal_name ? (
              <Row label="Nome fantasia" value={company.legal_name} />
            ) : null}
            {company.phone ? (
              <Row
                icon={<Phone className="h-4 w-4" />}
                label="Telefone"
                value={company.phone}
              />
            ) : null}
            {company.domain ? (
              <Row
                icon={<Globe className="h-4 w-4" />}
                label="Domínio"
                value={company.domain}
              />
            ) : null}
            {company.website ? (
              <Row
                icon={<Globe className="h-4 w-4" />}
                label="Website"
                value={
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-spotorange-500 hover:underline"
                  >
                    {company.website}
                  </a>
                }
              />
            ) : null}
            {company.linkedin_url ? (
              <Row
                icon={<Linkedin className="h-4 w-4" />}
                label="LinkedIn"
                value={
                  <a
                    href={company.linkedin_url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-spotorange-500 hover:underline"
                  >
                    {company.linkedin_url}
                  </a>
                }
              />
            ) : null}
            {company.street ||
            company.address ||
            company.city ||
            company.state ? (
              <Row
                icon={<MapPin className="h-4 w-4" />}
                label="Endereço completo"
                value={
                  <div className="space-y-0.5">
                    {[company.street, company.number, company.complement]
                      .filter(Boolean)
                      .join(", ") ||
                    company.address ? (
                      <div>
                        {[company.street, company.number, company.complement]
                          .filter(Boolean)
                          .join(", ") || company.address}
                      </div>
                    ) : null}
                    {company.neighborhood ? (
                      <div>{company.neighborhood}</div>
                    ) : null}
                    {(company.city || company.state) && (
                      <div>
                        {[company.city, company.state]
                          .filter(Boolean)
                          .join(" / ")}
                      </div>
                    )}
                    {company.cep || company.zipcode ? (
                      <div className="text-xs text-muted-foreground">
                        CEP {company.cep ?? company.zipcode}
                      </div>
                    ) : null}
                  </div>
                }
              />
            ) : null}
            {company.notes ? (
              <div className="pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Notas internas
                </div>
                <p className="whitespace-pre-wrap text-sm">{company.notes}</p>
              </div>
            ) : null}
            {company.description ? (
              <div className="pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Descrição
                </div>
                <p className="whitespace-pre-wrap">{company.description}</p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users2 className="h-4 w-4" /> Contatos
              <Badge variant="secondary">{contacts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {contacts.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum contato vinculado.
              </p>
            ) : (
              <ul className="space-y-2">
                {contacts.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <Link
                      href={`/app/contatos/${c.id}`}
                      className="hover:underline truncate"
                    >
                      {c.full_name}
                    </Link>
                    {c.is_decision_maker ? (
                      <Badge variant="orange" className="text-[9px]">
                        Decisor
                      </Badge>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            <Button variant="ghost" size="sm" asChild className="w-full">
              <Link
                href={`/app/contatos/novo?company_id=${id}`}
                className="flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Adicionar contato
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-4 w-4" /> Deals
              <Badge variant="secondary">{deals?.length ?? 0}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!deals || deals.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhum deal vinculado a essa empresa.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-muted-foreground border-b border-border">
                    <tr>
                      <th className="text-left p-2">Título</th>
                      <th className="text-left p-2">Valor</th>
                      <th className="text-left p-2">Status</th>
                      <th className="text-left p-2 hidden md:table-cell">
                        Fechamento
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {deals.map((d) => (
                      <tr key={d.id} className="border-b border-border">
                        <td className="p-2 font-medium">{d.title}</td>
                        <td className="p-2">
                          {d.amount
                            ? `${d.currency ?? "BRL"} ${Number(d.amount).toLocaleString("pt-BR")}`
                            : "—"}
                        </td>
                        <td className="p-2">
                          <Badge variant="outline">{d.status}</Badge>
                        </td>
                        <td className="p-2 hidden md:table-cell text-muted-foreground text-xs">
                          {d.expected_close_date
                            ? formatDate(d.expected_close_date)
                            : "—"}
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
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      {icon ? (
        <span className="mt-0.5 text-muted-foreground">{icon}</span>
      ) : null}
      <div className="flex-1 min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-sm break-words">{value}</div>
      </div>
    </div>
  );
}

// Ícone Target evitar tree-shake mismatch — usado em outras telas
void Target;
