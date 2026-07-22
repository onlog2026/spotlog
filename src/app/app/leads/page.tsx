import Link from "next/link";
import { ArrowRight, Plus, Target, Search, Lock, UserX } from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDateTime, initials } from "@/lib/utils";
import { MarkSeenOnMount } from "@/components/notifications/mark-seen-on-mount";
import { FlashBanner } from "@/components/crm/flash-banner";
import { listLeads, getActiveLeadLocks } from "@/lib/queries/leads";
import { EnrollCadencePanel } from "@/components/leads/enroll-cadence-panel";
import { LeadSourceBadge } from "@/components/crm/lead-source-badge";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, { label: string; variant: string }> = {
  new: { label: "Novo", variant: "gradient" },
  contacted: { label: "Contactado", variant: "default" },
  qualified: { label: "Qualificado", variant: "success" },
  disqualified: { label: "Desqualificado", variant: "secondary" },
  converted: { label: "Convertido", variant: "success" },
  recycled: { label: "Reciclado", variant: "warning" },
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    q?: string;
    created?: string;
    deleted?: string;
    error?: string;
    assignment?: "mine" | "unassigned" | "all";
  }>;
}) {
  const ctx = await requireOrgModule("crm"); // Eixo A — neutro enquanto enforcement OFF
  const { status, q, created, deleted, error, assignment } = await searchParams;
  const leads = await listLeads(ctx.org.id, {
    status,
    search: q,
    limit: 200,
    assignment,
    currentUserId: ctx.user.id,
  });

  // Lookup de profiles dos assigned_to
  const ownerIds = Array.from(
    new Set(
      leads
        .map((l) => l.assigned_to)
        .filter((x): x is string => typeof x === "string"),
    ),
  );
  const supabase = await createClient();
  const { data: ownerProfiles } = ownerIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, email, avatar_url")
        .in("id", ownerIds)
    : { data: [] };
  const profMap = new Map<
    string,
    { full_name: string | null; email: string | null; avatar_url: string | null }
  >();
  (ownerProfiles ?? []).forEach(
    (p: {
      id: string;
      full_name: string | null;
      email: string | null;
      avatar_url: string | null;
    }) =>
      profMap.set(p.id, {
        full_name: p.full_name,
        email: p.email,
        avatar_url: p.avatar_url,
      }),
  );

  const locks = await getActiveLeadLocks(
    ctx.org.id,
    leads.map((l) => l.id),
  );

  // Cadências ativas — alimentam o painel "Colocar na cadência".
  const { data: seqRows } = await createAdminClient()
    .from("sequences")
    .select("id, name")
    .eq("organization_id", ctx.org.id)
    .eq("is_active", true)
    .order("name");
  const sequences = (seqRows ?? []) as { id: string; name: string }[];

  const qs = (extra: Record<string, string | undefined>) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (assignment) params.set("assignment", assignment);
    Object.entries(extra).forEach(([k, v]) => {
      if (v === undefined) params.delete(k);
      else params.set(k, v);
    });
    const s = params.toString();
    return s ? `?${s}` : "";
  };

  return (
    <div className="space-y-6">
      <MarkSeenOnMount module="leads" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Lista de leads que entraram no funil. Triagem e atribuição.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <EnrollCadencePanel sequences={sequences} />
          <Button variant="orange" asChild>
            <Link href="/app/leads/novo">
              <Plus className="h-4 w-4" />
              Novo lead
            </Link>
          </Button>
        </div>
      </div>

      {created ? <FlashBanner message="Lead criado com sucesso." /> : null}
      {deleted ? <FlashBanner message="Lead excluído." /> : null}
      {error ? <FlashBanner type="error" message={error} /> : null}

      <Card>
        <CardContent className="p-4">
          <form
            method="get"
            className="flex flex-col md:flex-row gap-3 items-stretch md:items-center"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                name="q"
                defaultValue={q ?? ""}
                placeholder="Buscar por nome, e-mail ou empresa"
                className="pl-9"
              />
            </div>
            {status ? (
              <input type="hidden" name="status" value={status} />
            ) : null}
            {assignment ? (
              <input type="hidden" name="assignment" value={assignment} />
            ) : null}
            <Button type="submit">Filtrar</Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-muted-foreground mr-1">Atribuição:</span>
        <Link href={`/app/leads${qs({ assignment: undefined })}`}>
          <Badge variant={!assignment ? "gradient" : "outline"}>Todos</Badge>
        </Link>
        <Link href={`/app/leads${qs({ assignment: "mine" })}`}>
          <Badge variant={assignment === "mine" ? "gradient" : "outline"}>
            Meus leads
          </Badge>
        </Link>
        <Link href={`/app/leads${qs({ assignment: "unassigned" })}`}>
          <Badge variant={assignment === "unassigned" ? "gradient" : "outline"}>
            Sem atribuição
          </Badge>
        </Link>
      </div>

      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-xs text-muted-foreground mr-1">Status:</span>
        <Link href={`/app/leads${qs({ status: undefined })}`}>
          <Badge variant={!status ? "gradient" : "outline"}>Todos</Badge>
        </Link>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <Link key={k} href={`/app/leads${qs({ status: k })}`}>
            <Badge variant={status === k ? "gradient" : "outline"}>
              {v.label}
            </Badge>
          </Link>
        ))}
      </div>

      <Card>
        <CardContent className="p-0">
          {leads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-4 font-medium">Nome</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Empresa
                    </th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">
                      E-mail
                    </th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Responsável</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Origem
                    </th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">
                      Criado
                    </th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => {
                    const s = STATUS_LABELS[lead.status] ?? STATUS_LABELS.new;
                    const owner = lead.assigned_to
                      ? profMap.get(lead.assigned_to)
                      : null;
                    const ownerLabel =
                      owner?.full_name ?? owner?.email ?? null;
                    const lock = locks.get(lead.id);
                    return (
                      <tr
                        key={lead.id}
                        className="border-b border-border hover:bg-muted/40 transition-colors"
                      >
                        <td className="p-4 font-medium">
                          <Link
                            href={`/app/leads/${lead.id}`}
                            className="hover:underline"
                          >
                            {lead.full_name ?? "—"}
                          </Link>
                          {lock && (
                            <span
                              className="ml-2 inline-flex items-center gap-1 text-[10px] text-amber-600"
                              title={`Em atendimento por ${lock.full_name ?? "alguém"}`}
                            >
                              <Lock className="h-3 w-3" /> em atendimento
                            </span>
                          )}
                        </td>
                        <td className="p-4 hidden md:table-cell">
                          {lead.company_name ?? "—"}
                        </td>
                        <td className="p-4 hidden lg:table-cell text-muted-foreground">
                          {lead.email ?? "—"}
                        </td>
                        <td className="p-4">
                          <Badge
                            variant={
                              s.variant as
                                | "default"
                                | "secondary"
                                | "outline"
                                | "success"
                                | "warning"
                                | "gradient"
                            }
                          >
                            {s.label}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {owner && ownerLabel ? (
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                {owner.avatar_url ? (
                                  <AvatarImage src={owner.avatar_url} />
                                ) : null}
                                <AvatarFallback
                                  className="text-[10px]"
                                  style={{ background: "#011960", color: "white" }}
                                >
                                  {initials(ownerLabel)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs truncate max-w-[120px]">
                                {ownerLabel}
                              </span>
                            </div>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-xs"
                              style={{ color: "#BA0102" }}
                              title="Lead sem responsável"
                            >
                              <UserX className="h-3.5 w-3.5" /> sem responsável
                            </span>
                          )}
                        </td>
                        <td className="p-4 hidden md:table-cell text-xs">
                          <LeadSourceBadge source={lead.source} />
                        </td>
                        <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {lead.created_at
                            ? formatDateTime(lead.created_at)
                            : "—"}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/app/leads/${lead.id}`}
                            className="text-spotorange-500 hover:underline text-xs flex items-center gap-1"
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-spotorange-500/15 mb-4">
        <Target className="h-7 w-7 text-spotorange-500" />
      </div>
      <h3 className="font-semibold text-lg">Nenhum lead ainda</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Conecte o formulário do seu site, rode uma campanha de prospecção ou
        adicione manualmente.
      </p>
      <div className="mt-6 flex gap-2 justify-center">
        <Button variant="default" asChild>
          <Link href="/app/leads/novo">Adicionar manual</Link>
        </Button>
        <Button variant="orange" asChild>
          <Link href="/app/prospeccao/nova">Nova campanha</Link>
        </Button>
      </div>
    </div>
  );
}
