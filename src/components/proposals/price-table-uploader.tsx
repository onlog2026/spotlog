"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { Loader2, Upload, FileSpreadsheet, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FIELDS = ["name", "sku", "description", "unit", "price", "category"];

export function PriceTableUploader() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function onFile(f: File) {
    setFile(f);
    if (!tableName) {
      setTableName(f.name.replace(/\.(xlsx|xls|csv)$/i, ""));
    }
    const buf = await f.arrayBuffer();
    const wb = XLSX.read(buf);
    const ws = wb.Sheets[wb.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, {
      defval: "",
    });
    setRows(data);
    if (data.length) {
      const cols = Object.keys(data[0]);
      setColumns(cols);
      // auto-mapping
      const auto: Record<string, string> = {};
      cols.forEach((c) => {
        const low = c.toLowerCase().trim();
        if (/(nome|name|produto|descricao|item)/.test(low) && !auto.name) auto.name = c;
        else if (/(sku|codigo|cod)/.test(low) && !auto.sku) auto.sku = c;
        else if (/(descr|detail)/.test(low) && !auto.description) auto.description = c;
        else if (/(unid|unit)/.test(low) && !auto.unit) auto.unit = c;
        else if (/(preco|price|valor)/.test(low) && !auto.price) auto.price = c;
        else if (/(categ|grupo|tipo)/.test(low) && !auto.category) auto.category = c;
      });
      setMapping(auto);
    }
  }

  async function submit() {
    if (!file || !tableName || !mapping.name || !mapping.price) {
      toast.error("Informe nome, mapeie pelo menos Nome e Preço.");
      return;
    }
    setSaving(true);
    const items = rows.map((r) => ({
      name: String(r[mapping.name] ?? "").trim(),
      sku: mapping.sku ? String(r[mapping.sku] ?? "").trim() : null,
      description: mapping.description
        ? String(r[mapping.description] ?? "").trim()
        : null,
      unit: mapping.unit ? String(r[mapping.unit] ?? "").trim() : "un",
      category: mapping.category
        ? String(r[mapping.category] ?? "").trim()
        : null,
      price: parsePrice(r[mapping.price]),
    }));

    const res = await fetch("/api/price-tables", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: tableName,
        source_filename: file.name,
        items,
      }),
    });
    setSaving(false);
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error ?? "Erro ao importar");
      return;
    }
    toast.success(`${data.imported} itens importados!`);
    setFile(null);
    setRows([]);
    setColumns([]);
    setMapping({});
    setTableName("");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <div>
        <Label className="text-xs">Nome da tabela</Label>
        <Input
          value={tableName}
          onChange={(e) => setTableName(e.target.value)}
          placeholder="Tabela 2026 — produtos premium"
          className="mt-1.5"
        />
      </div>

      <div>
        <Label className="text-xs">Arquivo Excel (.xlsx, .csv)</Label>
        <div className="mt-1.5">
          <label className="flex items-center justify-center gap-3 p-6 border border-dashed border-white/20 rounded-lg cursor-pointer hover:bg-white/5 transition">
            {file ? (
              <>
                <FileSpreadsheet className="h-6 w-6 text-emerald-400" />
                <div>
                  <div className="text-sm font-medium">{file.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {rows.length} linhas detectadas
                  </div>
                </div>
              </>
            ) : (
              <>
                <Upload className="h-5 w-5" />
                <span className="text-sm">
                  Clique para selecionar ou arraste seu arquivo
                </span>
              </>
            )}
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) =>
                e.target.files?.[0] && onFile(e.target.files[0])
              }
            />
          </label>
        </div>
      </div>

      {columns.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Mapeamento de colunas</h4>
          <div className="grid sm:grid-cols-2 gap-3">
            {FIELDS.map((field) => (
              <div key={field} className="space-y-1.5">
                <Label className="text-xs capitalize">
                  {field === "name"
                    ? "Nome do produto *"
                    : field === "price"
                      ? "Preço *"
                      : field}
                </Label>
                <Select
                  value={mapping[field] ?? ""}
                  onValueChange={(v) =>
                    setMapping({ ...mapping, [field]: v })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">— ignorar —</SelectItem>
                    {columns.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        </div>
      )}

      {rows.length > 0 && (
        <Button
          variant="gradient"
          size="lg"
          onClick={submit}
          disabled={saving || !mapping.name || !mapping.price}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
          Importar {rows.length} itens
        </Button>
      )}
    </div>
  );
}

function parsePrice(v: unknown): number {
  if (typeof v === "number") return v;
  const s = String(v ?? "")
    .replace(/[^\d,.\-]/g, "")
    .replace(/\./g, "")
    .replace(",", ".");
  const n = Number(s);
  return isNaN(n) ? 0 : n;
}
