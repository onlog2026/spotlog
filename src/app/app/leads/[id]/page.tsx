import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Building2,
  MessageSquare,
  ArrowRightCircle,
  PartyPopper,
} from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/utils";
import { FlashBanner } from "@/components/crm/flash-banner";
import { DeleteButton } from "@/components/crm/delete-button";
import { LeadSourceBadge } from "@/components/crm/lead-source-badge";
import { SubmitButton } from "@/components/crm/submit-button";
import { getLead, getLeadActivities } from "@/lib/queries/leads";
import {
  deleteLead,
  addLeadActivity,
  convertLeadToDeal,
  markLeadConverted,
} from "../actions";
import { LeadLockBanner } from "@/components/leads/lead-lock-banner";
import { CelebrationTrigger } from "@/components/celebration/celebration-trigger";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  new: { label: "Novo", variant: "gradient" },
  contacted: { label: "Contactado", variant: "default" },
  qualified: { label: "Qualificado", variant: "success" },
  disqualified: { label: "Desqualificado", variant: "secondary" },
  converted: { label: "Convertido", variant: "success" },
  recycled: { label: "Reciclado", variant: "warning" },
};

export default async function LeadDetalhePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    created?: string;
    updated?: string;
    converted?: string;
    activity?: string;
    error?: string;
    celebrate?: string;
    name?: string;
  }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const { created, updated, converted, activity, error } = await searchParams;
  const lead = await getLead(ctx.org.id, id);
  if (!lead) notFound();

  const activities = await getLeadActivities(ctx.org.id, id);
  const status = STATUS_LABELS[lead.status] ?? STATUS_LABELS.new;
  const addActivityAction = addLeadActivity.bind(null, id);
  const convertAction = convertLeadToDeal.bind(null, id);
  const markConvertedAction = markLeadConverted.bind(null, id);

  // Buscar membros + profile do assigned_to (para banner de lock)
  const supabase = await createClient();
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", ctx.org.id);
  const memberIds = (members ?? []).map((m: { user_id: string }) => m.user_id);
  const { data: profiles } = memberIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", memberIds)
    : { data: [] };
  const membersWithProfile = (members ?? []).map(
    (m: { user_id: string; role: string }) => {
      const p = (profiles ?? []).find(
        (x: { id: string }) => x.id === m.user_id,
      ) as
        | {
            id: string;
            full_name: string | null;
            email: string | null;
            avatar_url: string | null;
          }
        | undefined;
      return {
        user_id: m.user_id,
        role: m.role,
        full_name: p?.full_name ?? null,
        email: p?.email ?? null,
        avatar_url: p?.avatar_url ?? null,
      };
    },
  );
  const assignedProfile = lead.assigned_to
    ? membersWithProfile.find((m) => m.user_id === lead.assigned_to) ?? null
    : null;

  return (
    <div className="space-y-6">
      <CelebrationTrigger userName={ctx.user.full_name} />

      <div className="flex items-center justify-between gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/leads">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div className="flex gap-2 flex-wrap justify-end">
          <Button variant="default" size="sm" asChild>
            <Link href={`/app/leads/${id}/editar`}>
              <Pencil className="h-4 w-4" /> Editar
            </Link>
          </Button>
          {lead.status !== "converted" ? (
            <>
              <form action={convertAction}>
                <SubmitButton variant="orange" size="sm" pendingLabel="Convertendo…">
                  <ArrowRightCircle className="h-4 w-4" /> Converter em deal
                </SubmitButton>
              </form>
              <form action={markConvertedAction}>
                <SubmitButton
                  size="sm"
                  style={{ background: "#BA0102", color: "white" }}
                  pendingLabel="Marcando…"
                >
                  <PartyPopper className="h-4 w-4" /> Marcar como convertido
                </SubmitButton>
              </form>
            </>
          ) : null}
          <DeleteButton
            action={deleteLead.bind(null, id)}
            label="Excluir lead"
          />
        </div>
      </div>

      <LeadLockBanner
        leadId={id}
        assignedTo={lead.assigned_to}
        assignedProfile={
          assignedProfile
            ? {
                full_name: assignedProfile.full_name,
                email: assignedProfile.email,
                avatar_url: assignedProfile.avatar_url,
              }
            : null
        }
        currentUserId={ctx.user.id}
        currentUserRole={ctx.org.role}
        members={membersWithProfile}
      />

      {created ? <FlashBanner message="Lead criado com sucesso." /> : null}
      {updated ? <FlashBanner message="Lead atualizado." /> : null}
      {converted ? (
        <FlashBanner message="Lead convertido em deal." />
      ) : null}
      {activity ? <FlashBanner message="Atividade registrada." /> : null}
      {error ? <FlashBanner type="error" message={error} /> : null}

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-3xl font-bold truncate">
                {lead.full_name ?? "(sem nome)"}
              </h1>
              <div className="flex flex-wrap gap-2 items-center mt-2 text-sm text-muted-foreground">
                {lead.job_title ? <span>{lead.job_title}</span> : null}
                {lead.company_name ? (
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {lead.company_name}
                  </span>
                ) : null}
                <Badge
                  variant={
                    status.variant as
                      | "default"
                      | "secondary"
                      | "outline"
                      | "success"
                      | "warning"
                      | "gradient"
                  }
                >
                  {status.label}
                </Badge>
                <LeadSourceBadge source={lead.source} />
                {typeof lead.score === "number" ? (
                  <Badge variant="secondary">Score {lead.score}</Badge>
                ) : null}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {lead.email ? (
              <Row
                icon={<Mail className="h-4 w-4" />}
                label="E-mail"
                value={
                  <a
                    href={`mailto:${lead.email}`}
                    className="text-spotorange-500 hover:underline"
                  >
                    {lead.email}
                  </a>
                }
              />
            ) : null}
            {lead.phone ? (
              <Row
                icon={<Phone className="h-4 w-4" />}
                label="Telefone"
                value={lead.phone}
              />
            ) : null}
            {lead.whatsapp ? (
              <Row
                icon={<MessageSquare className="h-4 w-4" />}
                label="WhatsApp"
                value={lead.whatsapp}
              />
            ) : null}
            {lead.source_detail ? (
              <Row label="Detalhe da origem" value={lead.source_detail} />
            ) : null}
            {lead.message ? (
              <div className="pt-3 border-t border-border">
                <div className="text-xs text-muted-foreground mb-1">
                  Mensagem
                </div>
                <p className="whitespace-pre-wrap">{lead.message}</p>
              </div>
            ) : null}
            {lead.converted_at ? (
              <div className="pt-3 border-t border-border text-xs text-muted-foreground">
                Convertido em {formatDateTime(lead.converted_at)}
                {lead.converted_deal_id ? (
                  <>
                    {" · "}
                    <Link
                      href={`/app/pipeline/${lead.converted_deal_id}`}
                      className="text-spotorange-500 hover:underline"
                    >
                      Ver deal
                    </Link>
                  </>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Nova atividade</CardTitle>
          </CardHeader>
          <CardContent>
            <form action={addActivityAction} className="space-y-3">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <select
                  id="type"
                  name="type"
                  defaultValue="note"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="note">Nota</option>
                  <option value="call">Ligação</option>
                  <option value="email">E-mail</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="meeting">Reunião</option>
                  <option value="task">Tarefa</option>
                  <option value="linkedin">LinkedIn</option>
                </select>
              </div>
              <div>
                <Label htmlFor="subject">Assunto</Label>
                <Input id="subject" name="subject" placeholder="Resumo" />
              </div>
              <div>
                <Label htmlFor="content">Detalhe</Label>
                <Textarea
                  id="content"
                  name="content"
                  rows={3}
                  placeholder="O que aconteceu?"
                />
              </div>
              <Button type="submit" variant="default" className="w-full">
                Registrar
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade registrada ainda.
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
                      <Badge variant="secondary" className="text-[9px] ml-auto">
                        {a.status}
                      </Badge>
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
