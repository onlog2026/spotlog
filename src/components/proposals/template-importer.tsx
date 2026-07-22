"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Loader2, Upload, FileSpreadsheet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type RegionRow = {
  uf: string;
  cidade: string;
  regiao: string;
  cep_inicio: string;
  cep_fim: string;
  prazo_entrega: string | null;
  precos: Record<string, number>;
};

type RuleRow = { codigo: string; descricao: string };

const WEIGHT_BRACKETS = [
  "0.250 kg", "0.500 kg", "0.750 kg", "1 kg", "2 kg", "3 kg", "4 kg", "5 kg",
  "6 kg", "7 kg", "8 kg", "9 kg", "10 kg", "15 kg", "20 kg", "25 kg", "30 kg",
];

function normKey(s: string) {
  return s.replace(/\s*kg$/i, "").trim();
}

function findHeaderRow(aoa: unknown[][], mustContain: string): number {
  for (let i = 0; i < Math.min(aoa.length, 10); i++) {
    const row = (aoa[i] ?? []).map((c) => String(c ?? "").toUpperCase().trim());
    if (row.some((c) => c.includes(mustContain))) return i;
  }
  return -1;
}

/**
 * Parser dedicado pro formato da planilha Spotlog de tabela de preços
 * (abas "Tabela", "ABRANGÊNCIA..." e "Regras Gerais") — não é um mapeador
 * genérico de coluna porque a estrutura é fixa e conhecida.
 */
function parseWorkbook(wb: XLSX.WorkBook): { regions: RegionRow[]; rules: RuleRow[] } {
  const tabelaSheetName = wb.SheetNames.find((n) => /tabela/i.test(n));
  const abrangenciaSheetName = wb.SheetNames.find((n) => /abrang/i.test(n));
  const regrasSheetName = wb.SheetNames.find((n) => /regra/i.test(n));
  if (!tabelaSheetName) {
    throw new Error('Aba "Tabela" não encontrada na planilha.');
  }

  // --- Tabela (preços base) ---
  const tabelaAoa = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[tabelaSheetName], {
    header: 1,
    defval: "",
  });
  const headerRowIdx = findHeaderRow(tabelaAoa, "CEP INICIAL");
  if (headerRowIdx < 0) throw new Error('Cabeçalho ("CEP INICIAL") não encontrado na aba Tabela.');
  const header = tabelaAoa[headerRowIdx].map((c) => String(c ?? "").trim());

  const colUf = header.findIndex((c) => /^UF$/i.test(c));
  const colCidade = header.findIndex((c) => /CIDADE/i.test(c));
  const colRegiao = header.findIndex((c) => /REGI/i.test(c));
  const colCepIni = header.findIndex((c) => /CEP INICIAL/i.test(c));
  const colCepFim = header.findIndex((c) => /CEP FINAL/i.test(c));
  if ([colUf, colCidade, colRegiao, colCepIni, colCepFim].some((c) => c < 0)) {
    throw new Error("Colunas UF/CIDADE/REGIÃO/CEP INICIAL/CEP FINAL não encontradas na aba Tabela.");
  }
  // Colunas de peso: só o PRIMEIRO bloco (preço base, reajuste 0%) -- para
  // no primeiro gap vazio após o bloco de pesos, ignorando os cenários de
  // reajuste repetidos à direita (são calculados, não armazenados).
  const weightCols: { key: string; col: number }[] = [];
  let col = colCepFim + 1;
  while (col < header.length && header[col]) {
    const label = header[col];
    if (WEIGHT_BRACKETS.some((w) => normKey(w) === normKey(label))) {
      weightCols.push({ key: normKey(label), col });
    }
    col++;
  }
  if (weightCols.length === 0) {
    throw new Error("Nenhuma coluna de peso (ex: '1 kg') encontrada na aba Tabela.");
  }

  const regions: RegionRow[] = [];
  for (let r = headerRowIdx + 1; r < tabelaAoa.length; r++) {
    const row = tabelaAoa[r];
    if (!row || !row[colUf]) continue;
    const precos: Record<string, number> = {};
    for (const wc of weightCols) {
      const v = Number(row[wc.col]);
      if (!isNaN(v)) precos[wc.key] = v;
    }
    regions.push({
      uf: String(row[colUf]).trim().toUpperCase(),
      cidade: String(row[colCidade] ?? "").trim(),
      regiao: String(row[colRegiao] ?? "").trim(),
      cep_inicio: String(row[colCepIni] ?? "").trim(),
      cep_fim: String(row[colCepFim] ?? "").trim(),
      prazo_entrega: null,
      precos,
    });
  }

  // --- Abrangência (prazo de entrega) — casa pelo mesmo CEP inicial/final ---
  if (abrangenciaSheetName) {
    const abrAoa = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[abrangenciaSheetName], {
      header: 1,
      defval: "",
    });
    const abrHeaderIdx = findHeaderRow(abrAoa, "CEP INICIAL");
    if (abrHeaderIdx >= 0) {
      const abrHeader = abrAoa[abrHeaderIdx].map((c) => String(c ?? "").trim());
      const aCepIni = abrHeader.findIndex((c) => /CEP INICIAL/i.test(c));
      const aCepFim = abrHeader.findIndex((c) => /CEP FINAL/i.test(c));
      const aPrazo = abrHeader.findIndex((c) => /PRAZO/i.test(c));
      if (aCepIni >= 0 && aCepFim >= 0 && aPrazo >= 0) {
        const prazoMap = new Map<string, string>();
        for (let r = abrHeaderIdx + 1; r < abrAoa.length; r++) {
          const row = abrAoa[r];
          if (!row || !row[aCepIni]) continue;
          const key = `${String(row[aCepIni]).trim()}|${String(row[aCepFim]).trim()}`;
          prazoMap.set(key, String(row[aPrazo] ?? "").trim());
        }
        for (const reg of regions) {
          const key = `${reg.cep_inicio}|${reg.cep_fim}`;
          reg.prazo_entrega = prazoMap.get(key) ?? null;
        }
      }
    }
  }

  // --- Regras Gerais ---
  const rules: RuleRow[] = [];
  if (regrasSheetName) {
    const regrasAoa = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[regrasSheetName], {
      header: 1,
      defval: "",
    });
    const rHeaderIdx = findHeaderRow(regrasAoa, "ITEM");
    const start = rHeaderIdx >= 0 ? rHeaderIdx + 1 : 0;
    for (let r = start; r < regrasAoa.length; r++) {
      const row = regrasAoa[r];
      if (!row || !row[0] || !row[1]) continue;
      rules.push({ codigo: String(row[0]).trim(), descricao: String(row[1]).trim() });
    }
  }

  return { regions, rules };
}

export function TemplateImporter() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<{ regions: RegionRow[]; rules: RuleRow[] } | null>(null);
  const [saving, setSaving] = useState(false);

  async function onFile(f: File) {
    setFile(f);
    if (!name) setName(f.name.replace(/\.(xlsx|xls)$/i, ""));
    try {
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf);
      const result = parseWorkbook(wb);
      setParsed(result);
      toast.success(
        `${result.regions.length} faixas de CEP e ${result.rules.length} regras detectadas.`,
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao ler a planilha.");
      setParsed(null);
    }
  }

  async function submit() {
    if (!name || !parsed) {
      toast.error("Dê um nome ao modelo e selecione uma planilha válida.");
      return;
    }
    setSaving(true);
    const res = await fetch("/api/proposal-templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, regions: parsed.regions, rules: parsed.rules }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Erro ao importar");
      return;
    }
    toast.success(`Modelo "${name}" criado com ${parsed.regions.length} faixas de CEP.`);
    setName("");
    setFile(null);
    setParsed(null);
    router.push(`/app/propostas/modelos/${data.id}`);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs">Nome do modelo</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex: Ecommerce SP, Farma Nacional, B2B..."
          className="mt-1.5"
        />
      </div>

      <div>
        <Label className="text-xs">
          Planilha (mesma estrutura da Spotlog_Precos.xlsx: abas &quot;Tabela&quot;,
          &quot;ABRANGÊNCIA...&quot; e &quot;Regras Gerais&quot;)
        </Label>
        <div className="mt-1.5">
          <label className="flex items-center justify-center gap-3 p-6 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition">
            {file ? (
              <>
                <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium">{file.name}</div>
                  {parsed && (
                    <div className="text-xs text-muted-foreground">
                      {parsed.regions.length} faixas de CEP · {parsed.rules.length} regras
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-sm">Clique para selecionar a planilha</span>
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
          </label>
        </div>
      </div>

      {parsed && (
        <Button variant="orange" size="lg" onClick={submit} disabled={saving || !name}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          Criar modelo
        </Button>
      )}
    </div>
  );
}
