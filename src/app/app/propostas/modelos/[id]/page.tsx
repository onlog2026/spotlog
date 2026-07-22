import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DeleteTemplateButton } from "@/components/proposals/delete-template-button";
import { WEIGHT_BRACKETS, buildRegionSummary } from "@/lib/proposal-templates";

export const dynamic = "force-dynamic";

export default async function ProposalTemplateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: template } = await supabase
    .from("proposal_templates")
    .select("id, name, description")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!template) notFound();

  const { data: regionRows } = await supabase
    .from("proposal_template_regions")
    .select("uf, cidade, regiao, cep_inicio, cep_fim, prazo_entrega, precos")
    .eq("template_id", id)
    .order("position");

  const { data: rules } = await supabase
    .from("proposal_template_rules")
    .select("codigo, descricao")
    .eq("template_id", id)
    .order("position");

  const regions = (regionRows ?? []) as Array<{
    uf: string;
    cidade: string;
    regiao: string;
    cep_inicio: string;
    cep_fim: string;
    prazo_entrega: string | null;
    precos: Record<string, number>;
  }>;

  const summary = buildRegionSummary(regions);

  return (
    <div className="space-y-6">
      <Link
        href="/app/propostas/modelos"
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> Modelos
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{template.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {regions.length} faixas de CEP · {rules?.length ?? 0} regras gerais
          </p>
        </div>
        <DeleteTemplateButton templateId={id} />
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Resumo por região (preço base, reajuste 0%)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground border-b border-white/10">
              <tr>
                <th className="text-left p-2">Peso</th>
                {summary.regioes.map((r) => (
                  <th key={r} colSpan={3} className="text-center p-2 border-l border-white/10">
                    {r}
                  </th>
                ))}
              </tr>
              <tr>
                <th />
                {summary.regioes.map((r) => (
                  <>
                    <th key={`${r}-min`} className="text-right p-2 border-l border-white/10">Mín</th>
                    <th key={`${r}-med`} className="text-right p-2">Méd</th>
                    <th key={`${r}-max`} className="text-right p-2">Máx</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEIGHT_BRACKETS.map((w) => (
                <tr key={w} className="border-b border-white/5">
                  <td className="p-2 font-medium">{w}</td>
                  {summary.regioes.map((r) => {
                    const s = summary.byRegiao[r]?.[w];
                    return (
                      <>
                        <td key={`${r}-${w}-min`} className="text-right p-2 border-l border-white/5 text-muted-foreground">
                          {s ? `R$ ${s.min.toFixed(2)}` : "—"}
                        </td>
                        <td key={`${r}-${w}-med`} className="text-right p-2 text-muted-foreground">
                          {s ? `R$ ${s.avg.toFixed(2)}` : "—"}
                        </td>
                        <td key={`${r}-${w}-max`} className="text-right p-2 font-medium">
                          {s ? `R$ ${s.max.toFixed(2)}` : "—"}
                        </td>
                      </>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Tabela completa ({regions.length} faixas de CEP)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto max-h-[480px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="text-muted-foreground border-b border-white/10 sticky top-0 bg-card">
              <tr>
                <th className="text-left p-2">UF</th>
                <th className="text-left p-2">Cidade</th>
                <th className="text-left p-2">Região</th>
                <th className="text-left p-2">CEP inicial</th>
                <th className="text-left p-2">CEP final</th>
                <th className="text-left p-2">Prazo</th>
                {WEIGHT_BRACKETS.map((w) => (
                  <th key={w} className="text-right p-2">{w}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regions.map((r, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="p-2">{r.uf}</td>
                  <td className="p-2">{r.cidade}</td>
                  <td className="p-2">{r.regiao}</td>
                  <td className="p-2">{r.cep_inicio}</td>
                  <td className="p-2">{r.cep_fim}</td>
                  <td className="p-2">{r.prazo_entrega ?? "—"}</td>
                  {WEIGHT_BRACKETS.map((w) => (
                    <td key={w} className="text-right p-2 text-muted-foreground">
                      {r.precos[w] != null ? `R$ ${Number(r.precos[w]).toFixed(2)}` : "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Regras gerais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(rules ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma regra importada.</p>
          ) : (
            (rules ?? []).map((r, i) => (
              <div key={i} className="text-sm border-b border-white/5 pb-2 last:border-0">
                <span className="font-semibold text-spotorange-500">{r.codigo}</span>{" "}
                <span className="text-muted-foreground">{r.descricao}</span>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
