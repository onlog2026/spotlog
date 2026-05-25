import Link from "next/link";
import { ArrowRight, Plus, Target } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";

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
  searchParams: Promise<{ status?: string }>;
}) {
  const ctx = await requireSession();
  const { status } = await searchParams;
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("id, full_name, email, company_name, status, source, score, created_at")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (status) query = query.eq("status", status);

  const { data: leads } = await query;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Leads</h1>
          <p className="text-muted-foreground mt-1">
            Lista de leads que entraram no funil. Triagem e atribuição.
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/app/leads/novo">
            <Plus className="h-4 w-4" />
            Novo lead
          </Link>
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Link href="/app/leads">
          <Badge variant={!status ? "gradient" : "outline"}>Todos</Badge>
        </Link>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <Link key={k} href={`/app/leads?status=${k}`}>
            <Badge variant={status === k ? "gradient" : "outline"}>
              {v.label}
            </Badge>
          </Link>
        ))}
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-0">
          {!leads || leads.length === 0 ? (
            <EmptyState />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-white/10 text-xs text-muted-foreground">
                  <tr>
                    <th className="text-left p-4 font-medium">Nome</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Empresa</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">E-mail</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">Origem</th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">Criado</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {leads.map((l) => {
                    const lead = l as unknown as {
                      id: string;
                      full_name: string | null;
                      email: string | null;
                      company_name: string | null;
                      status: string;
                      source: string;
                      created_at: string;
                    };
                    const s = STATUS_LABELS[lead.status] ?? STATUS_LABELS.new;
                    return (
                      <tr
                        key={lead.id}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        <td className="p-4 font-medium">
                          {lead.full_name ?? "—"}
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
                        <td className="p-4 hidden md:table-cell text-muted-foreground text-xs">
                          {lead.source}
                        </td>
                        <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                          {formatDateTime(lead.created_at)}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/app/leads/${lead.id}`}
                            className="text-brand-400 hover:underline text-xs flex items-center gap-1"
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
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
        <Target className="h-7 w-7 text-brand-400" />
      </div>
      <h3 className="font-semibold text-lg">Nenhum lead ainda</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Conecte o formulário do seu site, rode uma campanha de prospecção ou
        adicione manualmente.
      </p>
      <div className="mt-6 flex gap-2 justify-center">
        <Button variant="glass" asChild>
          <Link href="/app/leads/novo">Adicionar manual</Link>
        </Button>
        <Button variant="gradient" asChild>
          <Link href="/app/prospeccao/nova">Nova campanha</Link>
        </Button>
      </div>
    </div>
  );
}
