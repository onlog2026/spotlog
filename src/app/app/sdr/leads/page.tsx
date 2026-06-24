import Link from "next/link";
import { ArrowRight, Sparkles, Target } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getSdrClient } from "@/lib/sdr/db";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

function scoreColor(score: number | null) {
  if (score == null) return "outline" as const;
  if (score >= 80) return "success" as const;
  if (score >= 60) return "gradient" as const;
  if (score >= 40) return "warning" as const;
  return "secondary" as const;
}

export default async function SdrLeadsPage({
  searchParams,
}: {
  searchParams: Promise<{ min?: string }>;
}) {
  const ctx = await requireSession();
  const { min } = await searchParams;
  const supabase = await getSdrClient();

  let q = supabase
    .from("leads")
    .select(
      "id, full_name, email, company_name, status, source, score, created_at",
    )
    .eq("organization_id", ctx.org.id)
    .in("source", ["enrichment", "sdr_outbound", "prospecting"])
    .order("score", { ascending: false, nullsFirst: false })
    .limit(200);
  if (min) q = q.gte("score", Number(min));

  const { data: leads } = await q;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg md:text-xl font-semibold">Leads do agente SDR</h2>
          <p className="text-xs text-muted-foreground">
            Apenas leads vindos de enrichment, prospecção e outbound. Os leads
            inbound estão em{" "}
            <Link className="underline" href="/app/leads">
              /app/leads
            </Link>
            .
          </p>
        </div>
        <div className="flex gap-2 text-xs">
          <Link href="/app/sdr/leads">
            <Badge variant={!min ? "gradient" : "outline"}>Todos</Badge>
          </Link>
          <Link href="/app/sdr/leads?min=60">
            <Badge variant={min === "60" ? "gradient" : "outline"}>
              Qualificados (≥60)
            </Badge>
          </Link>
          <Link href="/app/sdr/leads?min=80">
            <Badge variant={min === "80" ? "gradient" : "outline"}>
              Quentes (≥80)
            </Badge>
          </Link>
        </div>
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
                    <th className="text-left p-4 font-medium">Score</th>
                    <th className="text-left p-4 font-medium">Empresa</th>
                    <th className="text-left p-4 font-medium hidden md:table-cell">
                      Contato
                    </th>
                    <th className="text-left p-4 font-medium hidden lg:table-cell">
                      E-mail
                    </th>
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
                  {(leads as Array<{
                    id: string;
                    full_name: string | null;
                    email: string | null;
                    company_name: string | null;
                    status: string;
                    source: string;
                    score: number | null;
                    created_at: string;
                  }>).map((l) => (
                    <tr
                      key={l.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="p-4">
                        <Badge variant={scoreColor(l.score)}>
                          {l.score ?? "—"}
                        </Badge>
                      </td>
                      <td className="p-4 font-medium">
                        {l.company_name ?? "—"}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        {l.full_name ?? "—"}
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground">
                        {l.email ?? "—"}
                      </td>
                      <td className="p-4 hidden md:table-cell">
                        <Badge variant="outline" className="text-[10px]">
                          {l.source}
                        </Badge>
                      </td>
                      <td className="p-4 hidden lg:table-cell text-muted-foreground text-xs">
                        {formatDateTime(l.created_at)}
                      </td>
                      <td className="p-4">
                        <Link
                          href={`/app/sdr/leads/${l.id}`}
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

      <p className="text-[11px] text-muted-foreground text-center">
        Dados de contato tratados sob base legal de <strong>interesse legítimo</strong>{" "}
        (LGPD Art. 7º, IX).
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
        <Target className="h-7 w-7 text-spotorange-500" />
      </div>
      <h3 className="font-semibold text-lg">Nenhum lead SDR ainda</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
        Cole uma lista de CNPJs no enriquecimento ou crie uma campanha de
        prospecção.
      </p>
      <div className="mt-6 flex gap-2 justify-center">
        <Button variant="orange" asChild>
          <Link href="/app/sdr/enriquecer">
            <Sparkles className="h-4 w-4 mr-1" /> Enriquecer CNPJs
          </Link>
        </Button>
      </div>
    </div>
  );
}
