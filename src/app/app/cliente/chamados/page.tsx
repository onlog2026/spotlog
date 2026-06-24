import Link from "next/link";
import { ArrowRight, MessageSquarePlus, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  TicketPriorityBadge,
  TicketStatusBadge,
} from "@/components/operacao/status-badges";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/operacao/empty-state";
import { requireSession } from "@/lib/auth";
import { getClienteTickets } from "@/lib/queries/cliente";
import { formatDateTime } from "@/lib/utils";
import type { TicketStatus } from "@/lib/types/operacao";

export const dynamic = "force-dynamic";

const STATUS_FILTERS: Array<{ value: TicketStatus | "todos"; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "aberto", label: "Aberto" },
  { value: "em_analise", label: "Em análise" },
  { value: "aguardando_cliente", label: "Aguardando você" },
  { value: "resolvido", label: "Resolvido" },
  { value: "fechado", label: "Fechado" },
];

const DEPT_FILTERS: Array<{ value: string; label: string }> = [
  { value: "todos", label: "Todos" },
  { value: "sac", label: "SAC" },
  { value: "comercial", label: "Comercial" },
  { value: "financeiro", label: "Financeiro" },
  { value: "tecnico", label: "Técnico" },
];

const DEPT_LABEL: Record<string, string> = {
  sac: "SAC",
  comercial: "Comercial",
  financeiro: "Financeiro",
  tecnico: "Técnico",
};

export default async function ChamadosPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    department?: string;
    created?: string;
  }>;
}) {
  const ctx = await requireSession();
  const sp = await searchParams;
  const status = (sp.status ?? "todos") as TicketStatus | "todos";
  const department = sp.department ?? "todos";

  let chamados = await getClienteTickets(ctx.org.id);
  if (status !== "todos") chamados = chamados.filter((c) => c.status === status);
  if (department !== "todos") {
    chamados = chamados.filter(
      (c) => (c as unknown as { department?: string }).department === department,
    );
  }

  return (
    <div className="space-y-5">
      {sp.created === "1" && (
        <div
          role="status"
          className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-300"
        >
          Chamado aberto com sucesso. Acompanhe a conversa abaixo.
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Chamados (SAC)</h2>
          <p className="text-sm text-muted-foreground">
            {chamados.length}{" "}
            {chamados.length === 1 ? "chamado" : "chamados"} registrados
          </p>
        </div>
        <Button asChild variant="orange">
          <Link href="/app/cliente/chamados/novo">
            <MessageSquarePlus className="h-4 w-4" />
            Abrir chamado
          </Link>
        </Button>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-4">
          <form method="get" className="flex flex-wrap items-end gap-3">
            <div>
              <label
                htmlFor="status"
                className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1"
              >
                Status
              </label>
              <select
                id="status"
                name="status"
                defaultValue={status}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {STATUS_FILTERS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label
                htmlFor="department"
                className="block text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1"
              >
                Departamento
              </label>
              <select
                id="department"
                name="department"
                defaultValue={department}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
              >
                {DEPT_FILTERS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Button type="submit" variant="orange" size="sm">
              Aplicar
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-transparent bg-card/50">
        <CardContent className="p-0">
          {chamados.length === 0 ? (
            <EmptyState
              icon={MessageSquare}
              title="Nenhum chamado registrado"
              description="Quando precisar de ajuda, abra um chamado pelo botão acima."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs uppercase tracking-wider text-muted-foreground border-y border-white/5">
                  <tr>
                    <th className="text-left py-2 px-4">Protocolo</th>
                    <th className="text-left py-2 px-4">Assunto</th>
                    <th className="text-left py-2 px-4">Depto</th>
                    <th className="text-left py-2 px-4">Status</th>
                    <th className="text-left py-2 px-4">Prioridade</th>
                    <th className="text-left py-2 px-4">Última resposta</th>
                    <th className="text-right py-2 px-4">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {chamados.map((c) => {
                    const dept =
                      (c as unknown as { department?: string }).department ??
                      "sac";
                    return (
                      <tr
                        key={c.id}
                        className="border-b border-white/5 last:border-0"
                      >
                        <td className="py-3 px-4 font-mono text-xs">
                          {c.protocol}
                        </td>
                        <td className="py-3 px-4">{c.subject}</td>
                        <td className="py-3 px-4">
                          <Badge
                            variant="outline"
                            className="border-transparent bg-navy-900/10 text-navy-900 dark:text-navy-200"
                          >
                            {DEPT_LABEL[dept] ?? dept}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <TicketStatusBadge status={c.status} />
                        </td>
                        <td className="py-3 px-4">
                          <TicketPriorityBadge priority={c.priority} />
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {c.last_response_at
                            ? formatDateTime(c.last_response_at)
                            : "—"}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <Button asChild variant="ghost" size="sm">
                            <Link
                              href={`/app/cliente/chamados/${c.protocol}`}
                              aria-label={`Ver conversa do chamado ${c.protocol}`}
                            >
                              Ver conversa
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          </Button>
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
