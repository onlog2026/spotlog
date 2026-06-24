"use client";

import { useEffect, useState } from "react";
import { Label } from "@/components/ui/label";
import { UFs } from "@/lib/data/uf";

type Municipio = { id: number; nome: string };

export function UfCidadeSelect({
  uf,
  cidade,
  onChange,
  required,
  idPrefix = "addr",
}: {
  uf: string;
  cidade: string;
  onChange: (next: { uf: string; cidade: string }) => void;
  required?: boolean;
  idPrefix?: string;
}) {
  const [municipios, setMunicipios] = useState<Municipio[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    if (!uf) {
      setMunicipios([]);
      return;
    }
    setLoading(true);
    fetch(`/api/brasil/municipios?uf=${uf}`)
      .then((r) => r.json())
      .then((j: { municipios?: Municipio[] }) => {
        if (active) setMunicipios(j.municipios ?? []);
      })
      .catch(() => {
        if (active) setMunicipios([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [uf]);

  return (
    <>
      <div>
        <Label htmlFor={`${idPrefix}-state`}>
          UF{required ? " *" : ""}
        </Label>
        <select
          id={`${idPrefix}-state`}
          value={uf}
          required={required}
          onChange={(e) =>
            onChange({ uf: e.target.value.toUpperCase(), cidade: "" })
          }
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-spotorange-500 transition-colors"
        >
          <option value="">— Selecione —</option>
          {UFs.map((u) => (
            <option key={u.sigla} value={u.sigla}>
              {u.sigla} — {u.nome}
            </option>
          ))}
        </select>
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-city`}>
          Cidade{required ? " *" : ""}
        </Label>
        <select
          id={`${idPrefix}-city`}
          value={cidade}
          required={required}
          disabled={!uf || loading}
          onChange={(e) => onChange({ uf, cidade: e.target.value })}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-spotorange-500 transition-colors disabled:opacity-50"
        >
          <option value="">
            {!uf
              ? "Escolha UF primeiro"
              : loading
                ? "Carregando…"
                : "— Selecione —"}
          </option>
          {/* Permite manter valor legado mesmo se não constar */}
          {cidade && !municipios.find((m) => m.nome === cidade) ? (
            <option value={cidade}>{cidade}</option>
          ) : null}
          {municipios.map((m) => (
            <option key={m.id} value={m.nome}>
              {m.nome}
            </option>
          ))}
        </select>
      </div>
    </>
  );
}
