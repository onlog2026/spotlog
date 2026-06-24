import Link from "next/link";
import { ArrowRight, Plus, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { requireSession } from "@/lib/auth";
import { listTickets, type TicketDepartment } from "@/lib/queries/sac";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/sac/status-badges";
import type {
  TicketStatus,
  TicketPriority,
} from "@/lib/types/operacao";

export const dynamic = "force-dynamic";

const DEPARTMENTS: Array<{ value: TicketDepartment | "todos"; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "comercial", label: "Comercial" },
  { value: "financeiro", label: "Financeiro" },
  { value: "sac", label: "SAC" },
  { value: "tecnico", label: "Técnico" },
];

function formatDateTime(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_OPTIONS: Array<{ value: TicketStatus | "todos"; label: string }> = [
  { value: "todos", label: "Todos os status" },
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "aguardando_cliente", label: "Aguardando cliente" },
  { value: "resolvido", label: "Resolvido" },
  { value: "fechado", label: "Fechado" },
];

const PRIORITY_OPTIONS: Array<{
  value: TicketPriority | "todas";
  label: string;
}> = [
  { value: "todas", label: "Todas prioridades" },
  { value: "urgente", label: "Urgente" },
  { value: "alta", label: "Alta" },
  { value: "media", label: "Média" },
  { value: "baixa", label: "Baixa" },
];

export default async function TicketsListPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    priority?: string;
    department?: string;
    q?: string;
    ok?: string;
  }>;
}) {
  const { org } = await requireSession();
  const params = await searchParams;
  const status = (params.status ?? "todos") as TicketStatus | "todos";
  const priority = (params.priority ?? "todas") as TicketPriority | "todas";
  const department = (params.department ?? "todos") as TicketDepartment | "todos";
  const search = params.q ?? "";

  const tickets = await listTickets(org.id, { status, priority, department, search });

  return (
    <div className="space-y-5">
      {params.ok === "created" && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300">
          Ticket criado com sucesso.
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Tickets</h2>
          <p className="text-sm text-muted-foreground">
            {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}{" "}
            encontrados
          </p>
        </div>
        <Button asChild variant="orange" size="sm">
          <Link href="/app/sac/tickets/novo" aria-label="Abrir novo ticket">
            <Plus className="h-4 w-4" />
            Novo ticket
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="Departamento">
        {DEPARTMENTS.map((d) => {
          const active = department === d.value;
          const params = new URLSearchParams();
          if (d.value !== "todos") params.set("department", d.value);
          if (status !== "todos") params.set("status", status);
          if (priority !== "todas") params.set("priority", priority);
          if (search) params.set("q", search);
          const href = params.toString()
            ? `/app/sac/tickets?${params.toString()}`
            : `/app/sac/tickets`;
          return (
            <Link
              key={d.value}
              href={href}
              role="tab"
              aria-selected={active}
              className={`inline-flex items-center rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                active
                  ? "border-[#BA0102] bg-[#BA0102]/15 text-[#BA0102]"
                  : "border-white/10 bg-card/50 text-muted-foreground hover:border-[#011960] hover:text-foreground"
              }`}
            >
              {d.label}
            </Link>
          );
        })}
      </div>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form
            method="get"
            className="grid grid-cols-1 md:grid-cols-4 gap-3"
            aria-label="Filtros de tickets"
          >
            <input type="hidden" name="department" value={department} />
            <div className="md:col-span-2">
              <label
                htmlFor="q"
                className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold"
              >
                Buscar
              </label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  id="q"
                  name="q"
                  defaultValue={search}
                  placeholder="Protocolo, assunto..."
                  className="h-10 w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="status"
                className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="priority"
                className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold"
              >
                Prioridade
              </label>
              <select
                id="priority"
                name="priority"
                defaultValue={priority}
                className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-4 flex justify-end">
              <Button type="submit" variant="orange" size="sm">
                Aplicar filtros
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-0">
          {tickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Nenhum ticket encontrado com os filtros atuais.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Protocolo</th>
                    <th className="text-left py-2 px-4">Assunto</th>
                    <th className="text-left py-2 px-4">Empresa</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Prioridade</th>
                    <th className="text-left py-2 px-4">Aberto em</th>
                    <th className="text-left py-2 px-4">Última resposta</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {tickets.map((t) => (
                    <tr
                      key={t.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition"
                    >
                      <td className="py-3 px-4 font-mono text-xs">
                        {t.protocol}
                      </td>
                      <td className="py-3 px-4">{t.subject}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {t.companies?.name ?? "—"}
                      </td>
                      <td className="py-3 px-4">
                        <TicketStatusBadge status={t.status} />
                      </td>
                      <td className="py-3 px-4">
                        <TicketPriorityBadge priority={t.priority} />
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDateTime(t.opened_at)}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {formatDateTime(t.last_response_at)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link
                            href={`/app/sac/tickets/${t.id}`}
                            aria-label={`Abrir ticket ${t.protocol}`}
                          >
                            Abrir <ArrowRight className="h-3 w-3" />
                          </Link>
                        </Button>
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
