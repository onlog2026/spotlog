import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Building2, User, Calendar, DollarSign, Tag, Clock,
  Mail, Phone, KanbanSquare, ExternalLink, TrendingUp,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  open: { label: "Aberto", color: "bg-blue-100 text-blue-700" },
  won: { label: "Ganho", color: "bg-success-100 text-success-700" },
  lost: { label: "Perdido", color: "bg-red-100 text-red-700" },
};

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  // 1) Deal sem joins (PostgREST cache stale)
  const { data: dealRow } = await supabase
    .from("deals")
    .select(
      "id, title, amount, currency, status, source, tags, probability, expected_close_date, closed_at, created_at, updated_at, lost_reason, custom_fields, pipeline_id, stage_id, company_id, contact_id, owner_id",
    )
    .eq("organization_id", ctx.org.id)
    .eq("id", id)
    .maybeSingle();

  if (!dealRow) notFound();
  const d = dealRow as {
    id: string;
    title: string;
    amount: number | string | null;
    currency: string;
    status: string;
    source: string | null;
    tags: string[] | null;
    probability: number | null;
    expected_close_date: string | null;
    closed_at: string | null;
    created_at: string;
    updated_at: string;
    lost_reason: string | null;
    custom_fields: Record<string, unknown> | null;
    pipeline_id: string | null;
    stage_id: string | null;
    company_id: string | null;
    contact_id: string | null;
    owner_id: string | null;
  };

  // 2) Relações em paralelo
  const [pipelineRes, stageRes, companyRes, contactRes, ownerRes] = await Promise.all([
    d.pipeline_id
      ? supabase.from("pipelines").select("id, name").eq("id", d.pipeline_id).maybeSingle()
      : Promise.resolve({ data: null }),
    d.stage_id
      ? supabase.from("pipeline_stages").select("id, name, color, position, is_won, is_lost").eq("id", d.stage_id).maybeSingle()
      : Promise.resolve({ data: null }),
    d.company_id
      ? supabase.from("companies").select("id, name, cnpj, industry, city, state, phone, email").eq("id", d.company_id).maybeSingle()
      : Promise.resolve({ data: null }),
    d.contact_id
      ? supabase.from("contacts").select("id, full_name, email, phone, whatsapp, job_title").eq("id", d.contact_id).maybeSingle()
      : Promise.resolve({ data: null }),
    d.owner_id
      ? supabase.from("profiles").select("id, full_name, email, avatar_url").eq("id", d.owner_id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const pipeline = pipelineRes.data as { id: string; name: string } | null;
  const stage = stageRes.data as { id: string; name: string; color: string | null; is_won: boolean; is_lost: boolean } | null;
  const company = companyRes.data as { id: string; name: string; cnpj: string | null; industry: string | null; city: string | null; state: string | null; phone: string | null; email: string | null } | null;
  const contact = contactRes.data as { id: string; full_name: string; email: string | null; phone: string | null; whatsapp: string | null; job_title: string | null } | null;
  const owner = ownerRes.data as { id: string; full_name: string | null; email: string | null; avatar_url: string | null } | null;

  const statusBadge = STATUS_LABEL[d.status] ?? STATUS_LABEL.open;
  const amount = Number(d.amount) || 0;

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <Link
          href="/app/pipeline"
          className="inline-flex items-center gap-1.5 text-sm text-ink-500 hover:text-spotorange-600 mb-3"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pro pipeline
        </Link>

        <div className="flex items-start justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-spotorange-500/15 text-spotorange-600">
              <KanbanSquare className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold leading-tight">
                {d.title}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Badge className={`${statusBadge.color} text-xs`}>{statusBadge.label}</Badge>
                {stage && (
                  <Badge variant="outline" className="text-xs">
                    {stage.name}
                  </Badge>
                )}
                {pipeline && (
                  <span className="text-xs text-ink-500">
                    Pipeline: {pipeline.name}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-navy-950">
              {formatCurrency(amount, d.currency)}
            </div>
            {d.probability !== null && (
              <div className="text-xs text-ink-500 mt-1">
                Probabilidade: {d.probability}%
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Coluna principal */}
        <div className="lg:col-span-2 space-y-5">
          {/* Datas */}
          <Card className="border-navy-100 bg-white shadow-soft">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Datas
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Field label="Criado em" value={formatDate(d.created_at)} />
                <Field label="Atualizado em" value={formatDate(d.updated_at)} />
                <Field
                  label="Previsão de fechamento"
                  value={d.expected_close_date ? formatDate(d.expected_close_date) : "—"}
                />
                <Field
                  label="Fechado em"
                  value={d.closed_at ? formatDate(d.closed_at) : "—"}
                />
              </div>
            </CardContent>
          </Card>

          {/* Cliente */}
          <Card className="border-navy-100 bg-white shadow-soft">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Cliente
              </h2>
              {company ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-base font-semibold text-navy-950">
                      <Link
                        href={`/app/empresas/${company.id}`}
                        className="hover:text-spotorange-600 inline-flex items-center gap-1"
                      >
                        {company.name}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {company.cnpj && (
                      <div className="text-xs text-ink-500 font-mono">
                        CNPJ: {company.cnpj}
                      </div>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {company.industry && (
                      <Field label="Segmento" value={company.industry} />
                    )}
                    {(company.city || company.state) && (
                      <Field
                        label="Localização"
                        value={[company.city, company.state].filter(Boolean).join(" / ")}
                      />
                    )}
                    {company.phone && (
                      <a
                        href={`tel:${company.phone}`}
                        className="text-sm text-spotorange-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {company.phone}
                      </a>
                    )}
                    {company.email && (
                      <a
                        href={`mailto:${company.email}`}
                        className="text-sm text-spotorange-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        {company.email}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-500">Sem empresa vinculada</p>
              )}
            </CardContent>
          </Card>

          {/* Contato */}
          <Card className="border-navy-100 bg-white shadow-soft">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <User className="h-4 w-4" />
                Contato principal
              </h2>
              {contact ? (
                <div className="space-y-3">
                  <div>
                    <div className="text-base font-semibold text-navy-950">
                      <Link
                        href={`/app/contatos/${contact.id}`}
                        className="hover:text-spotorange-600 inline-flex items-center gap-1"
                      >
                        {contact.full_name}
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </div>
                    {contact.job_title && (
                      <div className="text-xs text-ink-500">{contact.job_title}</div>
                    )}
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-sm text-spotorange-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Mail className="h-3 w-3" />
                        {contact.email}
                      </a>
                    )}
                    {contact.phone && (
                      <a
                        href={`tel:${contact.phone}`}
                        className="text-sm text-spotorange-600 hover:underline inline-flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        {contact.phone}
                      </a>
                    )}
                    {contact.whatsapp && (
                      <a
                        href={`https://wa.me/${contact.whatsapp.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-success-700 hover:underline inline-flex items-center gap-1"
                      >
                        <Phone className="h-3 w-3" />
                        WhatsApp: {contact.whatsapp}
                      </a>
                    )}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-ink-500">Sem contato vinculado</p>
              )}
            </CardContent>
          </Card>

          {/* Detalhes técnicos */}
          <Card className="border-navy-100 bg-white shadow-soft">
            <CardContent className="p-5 space-y-4">
              <h2 className="text-sm font-bold text-navy-950 uppercase tracking-wider flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Detalhes
              </h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <Field label="Origem" value={d.source ?? "—"} />
                <Field
                  label="Tags"
                  value={d.tags?.length ? d.tags.join(", ") : "—"}
                />
                {d.lost_reason && (
                  <div className="sm:col-span-2">
                    <Field label="Motivo da perda" value={d.lost_reason} />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar ações + responsável */}
        <div className="space-y-5">
          <Card className="border-navy-100 bg-white shadow-soft">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-ink-500 uppercase tracking-wider">
                Ações
              </h3>
              <Button variant="orange" className="w-full" asChild>
                <Link href={`/app/pipeline?edit=${d.id}`}>
                  <TrendingUp className="h-4 w-4" />
                  Editar no kanban
                </Link>
              </Button>
              <Button variant="outline" className="w-full" asChild>
                <Link href={`/app/propostas/nova?deal=${d.id}`}>
                  <DollarSign className="h-4 w-4" />
                  Criar proposta
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-navy-100 bg-white shadow-soft">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-ink-500 uppercase tracking-wider flex items-center gap-2">
                <User className="h-3.5 w-3.5" />
                Responsável
              </h3>
              {owner ? (
                <div>
                  <div className="font-semibold text-navy-950 text-sm">
                    {owner.full_name ?? owner.email ?? "Sem nome"}
                  </div>
                  {owner.email && (
                    <div className="text-xs text-ink-500 truncate">{owner.email}</div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-ink-500">Sem responsável atribuído</p>
              )}
            </CardContent>
          </Card>

          <Card className="border-navy-100 bg-white shadow-soft">
            <CardContent className="p-5 space-y-3">
              <h3 className="text-xs font-bold text-ink-500 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-3.5 w-3.5" />
                Histórico
              </h3>
              <div className="text-xs text-ink-600 space-y-1">
                <div>Criado: {formatDate(d.created_at)}</div>
                <div>Atualizado: {formatDate(d.updated_at)}</div>
                {d.closed_at && (
                  <div className="text-success-700 font-semibold">
                    Fechado: {formatDate(d.closed_at)}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider font-bold text-ink-500 mb-0.5">
        {label}
      </div>
      <div className="text-sm font-medium text-navy-900">{value ?? "—"}</div>
    </div>
  );
}
