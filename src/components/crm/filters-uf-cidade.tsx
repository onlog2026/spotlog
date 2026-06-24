"use client";

import { useEffect, useState } from "react";
import { UFs } from "@/lib/data/uf";

type Municipio = { id: number; nome: string };

/**
 * Pair UF+Cidade dropdowns para uso em forms de filtro (method=GET).
 * Emite hidden inputs `state` e `city`.
 */
export function FiltersUfCidade({
  initialState,
  initialCity,
}: {
  initialState?: string;
  initialCity?: string;
}) {
  const [uf, setUf] = useState<string>(initialState ?? "");
  const [city, setCity] = useState<string>(initialCity ?? "");
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
      .catch(() => active && setMunicipios([]))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [uf]);

  return (
    <>
      <select
        value={uf}
        onChange={(e) => {
          setUf(e.target.value.toUpperCase());
          setCity("");
        }}
        aria-label="UF"
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm md:w-32 hover:border-spotorange-500 transition-colors"
      >
        <option value="">UF</option>
        {UFs.map((u) => (
          <option key={u.sigla} value={u.sigla}>
            {u.sigla}
          </option>
        ))}
      </select>
      <select
        value={city}
        onChange={(e) => setCity(e.target.value)}
        disabled={!uf || loading}
        aria-label="Cidade"
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm md:w-48 hover:border-spotorange-500 transition-colors disabled:opacity-50"
      >
        <option value="">
          {!uf ? "Cidade" : loading ? "Carregando…" : "Cidade"}
        </option>
        {city && !municipios.find((m) => m.nome === city) ? (
          <option value={city}>{city}</option>
        ) : null}
        {municipios.map((m) => (
          <option key={m.id} value={m.nome}>
            {m.nome}
          </option>
        ))}
      </select>
      <input type="hidden" name="state" value={uf} />
      <input type="hidden" name="city" value={city} />
    </>
  );
}
