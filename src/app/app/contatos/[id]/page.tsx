import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Linkedin,
  Building2,
  MessageSquare,
  MapPin,
  Briefcase,
  Send,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatDateTime, formatDate } from "@/lib/utils";
import { FlashBanner } from "@/components/crm/flash-banner";
import { DeleteButton } from "@/components/crm/delete-button";
import { getContact } from "@/lib/queries/contatos";
import { createClient } from "@/lib/supabase/server";
import { deleteContact } from "../actions";

export const dynamic = "force-dynamic";

function onlyDigits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

export default async function ContatoDetalhePage({
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
  const contact = await getContact(ctx.org.id, id);
  if (!contact) notFound();

  const supabase = await createClient();
  const [{ data: activities }, { data: deals }] = await Promise.all([
    supabase
      .from("activities")
      .select("id, type, status, subject, content, created_at")
      .eq("organization_id", ctx.org.id)
      .eq("contact_id", id)
      .order("created_at", { ascending: false })
      .limit(30),
    supabase
      .from("deals")
      .select(
        "id, title, amount, currency, status, expected_close_date, created_at",
      )
      .eq("organization_id", ctx.org.id)
      .eq("primary_contact_id", id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const enderecoLinhas = [
    [contact.street, contact.number, contact.complement]
      .filter(Boolean)
      .join(", "),
    contact.neighborhood,
    [contact.city, contact.state].filter(Boolean).join(" / "),
    contact.cep ? `CEP ${contact.cep}` : null,
    contact.country && contact.country !== "BR" ? contact.country : null,
  ].filter(Boolean);

  const whatsappDigits = onlyDigits(contact.whatsapp ?? contact.phone);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/contatos">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
      </div>

      {created ? <FlashBanner message="Contato criado com sucesso." /> : null}
      {updated ? <FlashBanner message="Contato atualizado." /> : null}
      {error ? <FlashBanner type="error" message={error} /> : null}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg bg-navy-900 text-white">
                {initials(contact.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold truncate">
                {contact.full_name}
              </h1>
              <div className="flex flex-wrap gap-2 items-center mt-2 text-sm text-muted-foreground">
                {contact.job_title ? <span>{contact.job_title}</span> : null}
                {contact.companies?.name ? (
                  <Link
                    href={`/app/empresas/${contact.companies.id}`}
                    className="flex items-center gap-1 hover:text-foreground"
                  >
                    <Building2 className="h-3 w-3" /> {contact.companies.name}
                  </Link>
                ) : null}
                {contact.is_decision_maker ? (
                  <Badge variant="orange">Decisor</Badge>
                ) : null}
                {contact.do_not_contact ? (
                  <Badge variant="destructive">DNC</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ===== Coluna esquerda ===== */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados do contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {contact.email ? (
                <Row
                  icon={<Mail className="h-4 w-4" />}
                  label="E-mail"
                  value={
                    <a
                      href={`mailto:${contact.email}`}
                      className="text-spotorange-500 hover:underline"
                    >
                      {contact.email}
                    </a>
                  }
                />
              ) : null}
              {contact.phone ? (
                <Row
                  icon={<Phone className="h-4 w-4" />}
                  label="Telefone"
                  value={contact.phone}
                />
              ) : null}
              {contact.whatsapp ? (
                <Row
                  icon={<MessageSquare className="h-4 w-4" />}
                  label="WhatsApp"
                  value={contact.whatsapp}
                />
              ) : null}
              {contact.linkedin_url ? (
                <Row
                  icon={<Linkedin className="h-4 w-4" />}
                  label="LinkedIn"
                  value={
                    <a
                      href={contact.linkedin_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-spotorange-500 hover:underline break-all"
                    >
                      {contact.linkedin_url}
                    </a>
                  }
                />
              ) : null}
              {contact.department || contact.seniority ? (
                <Row
                  label="Departamento"
                  value={[contact.department, contact.seniority]
                    .filter(Boolean)
                    .join(" · ")}
                />
              ) : null}
            </CardContent>
          </Card>

          {enderecoLinhas.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Endereço completo
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm space-y-1">
                {enderecoLinhas.map((linha, i) => (
                  <p key={i}>{linha}</p>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="h-4 w-4" /> Deals vinculados
                <Badge variant="secondary">{deals?.length ?? 0}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!deals || deals.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhum deal vinculado.
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

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Atividades recentes</CardTitle>
            </CardHeader>
            <CardContent>
              {!activities || activities.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nenhuma atividade.
                </p>
              ) : (
                <ul className="space-y-3">
                  {activities.map((a) => (
                    <li
                      key={a.id}
                      className="text-sm border-l-2 border-spotorange-500 pl-3"
                    >
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-[10px]">
                          {a.type}
                        </Badge>
                        {a.subject ? (
                          <span className="font-medium">{a.subject}</span>
                        ) : null}
                      </div>
                      {a.content ? (
                        <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                          {a.content}
                        </p>
                      ) : null}
                      <div className="text-[10px] text-muted-foreground mt-1">
                        {a.created_at ? formatDateTime(a.created_at) : ""}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ===== Coluna direita (ações) ===== */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="default" size="sm" asChild className="w-full">
                <Link href={`/app/contatos/${id}/editar`}>
                  <Pencil className="h-4 w-4" /> Editar
                </Link>
              </Button>
              {contact.email ? (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a href={`mailto:${contact.email}`}>
                    <Mail className="h-4 w-4" /> Enviar e-mail
                  </a>
                </Button>
              ) : null}
              {whatsappDigits ? (
                <Button variant="outline" size="sm" asChild className="w-full">
                  <a
                    href={`https://wa.me/${whatsappDigits.startsWith("55") ? whatsappDigits : "55" + whatsappDigits}`}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Send className="h-4 w-4" /> WhatsApp
                  </a>
                </Button>
              ) : null}
              <DeleteButton
                action={deleteContact.bind(null, id)}
                label="Excluir contato"
              />
            </CardContent>
          </Card>

          {contact.companies ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4" /> Empresa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link
                  href={`/app/empresas/${contact.companies.id}`}
                  className="font-medium hover:underline"
                >
                  {contact.companies.name}
                </Link>
              </CardContent>
            </Card>
          ) : null}
        </div>
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
