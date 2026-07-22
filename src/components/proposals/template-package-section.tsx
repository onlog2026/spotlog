import { WEIGHT_BRACKETS, applyReajuste, buildRegionSummary, type TemplateRegionRow } from "@/lib/proposal-templates";

const NAVY = "#011960";

function money(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

/**
 * Pacote completo do modelo escolhido na proposta: resumo por região,
 * tabela completa (todas as faixas de CEP) e regras gerais — mesma
 * estrutura da planilha de origem (Tabela + Abrangência + Regras Gerais).
 */
export function TemplatePackageSection({
  templateName,
  regions,
  rules,
  reajustePct,
}: {
  templateName: string;
  regions: TemplateRegionRow[];
  rules: Array<{ codigo: string; descricao: string }>;
  reajustePct: number;
}) {
  const summary = buildRegionSummary(regions, reajustePct);

  return (
    <div className="space-y-8 pt-8 border-t border-slate-200">
      <div>
        <div className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">
          Tabela de preços — {templateName}
        </div>
        {reajustePct > 0 && (
          <div className="text-xs text-slate-500">
            Reajuste aplicado: {(reajustePct * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%
          </div>
        )}
      </div>

      {/* Resumo por região */}
      <div>
        <h3 className="font-semibold text-sm mb-2 text-slate-900">Resumo por região</h3>
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs">
            <thead style={{ background: "#f1f5f9" }}>
              <tr>
                <th className="text-left p-2 font-semibold text-slate-700">Peso</th>
                {summary.regioes.map((r) => (
                  <th key={r} className="text-right p-2 font-semibold text-slate-700 whitespace-nowrap">
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {WEIGHT_BRACKETS.map((w) => (
                <tr key={w} className="border-t border-slate-100">
                  <td className="p-2 font-medium text-slate-900">{w}</td>
                  {summary.regioes.map((r) => {
                    const s = summary.byRegiao[r]?.[w];
                    return (
                      <td key={r} className="text-right p-2 text-slate-600 whitespace-nowrap">
                        {s ? `${money(s.min)} – ${money(s.max)}` : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tabela completa */}
      <div>
        <h3 className="font-semibold text-sm mb-2 text-slate-900">
          Tabela completa por CEP e prazo de entrega ({regions.length} faixas)
        </h3>
        <div className="border border-slate-200 rounded-lg overflow-auto max-h-[420px]">
          <table className="w-full text-xs">
            <thead style={{ background: "#f1f5f9" }} className="sticky top-0">
              <tr>
                <th className="text-left p-2 font-semibold text-slate-700">UF</th>
                <th className="text-left p-2 font-semibold text-slate-700">Cidade</th>
                <th className="text-left p-2 font-semibold text-slate-700">Região</th>
                <th className="text-left p-2 font-semibold text-slate-700">CEP</th>
                <th className="text-left p-2 font-semibold text-slate-700">Prazo</th>
                {WEIGHT_BRACKETS.map((w) => (
                  <th key={w} className="text-right p-2 font-semibold text-slate-700 whitespace-nowrap">
                    {w}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {regions.map((r, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="p-2 text-slate-700">{r.uf}</td>
                  <td className="p-2 text-slate-700">{r.cidade}</td>
                  <td className="p-2 text-slate-700">{r.regiao}</td>
                  <td className="p-2 text-slate-500 whitespace-nowrap">
                    {r.cep_inicio}–{r.cep_fim}
                  </td>
                  <td className="p-2 text-slate-700">{r.prazo_entrega ?? "—"}</td>
                  {WEIGHT_BRACKETS.map((w) => {
                    const base = r.precos[w];
                    return (
                      <td key={w} className="text-right p-2 text-slate-600">
                        {base != null ? money(applyReajuste(base, reajustePct)) : "—"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Regras gerais */}
      {rules.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-2 text-slate-900">Regras gerais</h3>
          <div className="space-y-2">
            {rules.map((r, i) => (
              <div key={i} className="text-xs text-slate-600 flex gap-2">
                <span className="font-semibold shrink-0" style={{ color: NAVY }}>
                  {r.codigo}
                </span>
                <span>{r.descricao}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
