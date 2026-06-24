"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UfCidadeSelect } from "./uf-cidade-select";

export type AddressData = {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  country: string;
};

export const EMPTY_ADDRESS: AddressData = {
  cep: "",
  street: "",
  number: "",
  complement: "",
  neighborhood: "",
  city: "",
  state: "",
  country: "BR",
};

function maskCep(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function AddressForm({
  value,
  onChange,
  namePrefix = "",
  idPrefix = "addr",
}: {
  value: AddressData;
  onChange: (v: AddressData) => void;
  /** se !== "", os inputs serão prefixados (ex.: "billing_") */
  namePrefix?: string;
  idPrefix?: string;
}) {
  const [lookingUp, setLookingUp] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);

  const set = <K extends keyof AddressData>(key: K, v: AddressData[K]) =>
    onChange({ ...value, [key]: v });

  async function handleCepBlur() {
    setCepError(null);
    const digits = value.cep.replace(/\D/g, "");
    if (digits.length !== 8) return;
    setLookingUp(true);
    try {
      const r = await fetch(`/api/brasil/cep?cep=${digits}`);
      if (!r.ok) {
        setCepError("CEP não encontrado.");
        return;
      }
      const j = (await r.json()) as {
        street: string | null;
        neighborhood: string | null;
        city: string | null;
        state: string | null;
      };
      onChange({
        ...value,
        street: j.street ?? value.street,
        neighborhood: j.neighborhood ?? value.neighborhood,
        city: j.city ?? value.city,
        state: (j.state ?? value.state).toUpperCase(),
      });
    } catch {
      setCepError("Falha ao consultar CEP.");
    } finally {
      setLookingUp(false);
    }
  }

  const n = (s: string) => `${namePrefix}${s}`;

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
      {/* CEP */}
      <div className="md:col-span-2">
        <Label htmlFor={`${idPrefix}-cep`} className="flex items-center gap-1">
          CEP
          {lookingUp ? (
            <Loader2 className="h-3 w-3 animate-spin text-spotorange-500" />
          ) : null}
        </Label>
        <Input
          id={`${idPrefix}-cep`}
          name={n("cep")}
          value={value.cep}
          onChange={(e) => set("cep", maskCep(e.target.value))}
          onBlur={handleCepBlur}
          placeholder="00000-000"
          inputMode="numeric"
          maxLength={9}
          className="hover:border-spotorange-500 transition-colors"
        />
        {cepError ? (
          <p className="text-[11px] text-red-600 mt-1">{cepError}</p>
        ) : null}
      </div>

      {/* Rua */}
      <div className="md:col-span-4">
        <Label htmlFor={`${idPrefix}-street`}>Rua / Logradouro</Label>
        <Input
          id={`${idPrefix}-street`}
          name={n("street")}
          value={value.street}
          onChange={(e) => set("street", e.target.value)}
          placeholder="Av. Paulista"
          className="hover:border-spotorange-500 transition-colors"
        />
      </div>

      {/* Número + Complemento */}
      <div className="md:col-span-1">
        <Label htmlFor={`${idPrefix}-number`}>Número</Label>
        <Input
          id={`${idPrefix}-number`}
          name={n("number")}
          value={value.number}
          onChange={(e) => set("number", e.target.value)}
          placeholder="1000"
          className="hover:border-spotorange-500 transition-colors"
        />
      </div>
      <div className="md:col-span-3">
        <Label htmlFor={`${idPrefix}-complement`}>Complemento</Label>
        <Input
          id={`${idPrefix}-complement`}
          name={n("complement")}
          value={value.complement}
          onChange={(e) => set("complement", e.target.value)}
          placeholder="Sala 1010"
          className="hover:border-spotorange-500 transition-colors"
        />
      </div>

      {/* Bairro */}
      <div className="md:col-span-2">
        <Label htmlFor={`${idPrefix}-neighborhood`}>Bairro</Label>
        <Input
          id={`${idPrefix}-neighborhood`}
          name={n("neighborhood")}
          value={value.neighborhood}
          onChange={(e) => set("neighborhood", e.target.value)}
          placeholder="Bela Vista"
          className="hover:border-spotorange-500 transition-colors"
        />
      </div>

      {/* UF / Cidade */}
      <div className="md:col-span-2">
        <UfCidadeSelect
          uf={value.state}
          cidade={value.city}
          onChange={({ uf, cidade }) =>
            onChange({ ...value, state: uf, city: cidade })
          }
          idPrefix={idPrefix}
        />
      </div>
      {/* hidden inputs pra submitar UF/cidade no formulário */}
      <input type="hidden" name={n("state")} value={value.state} />
      <input type="hidden" name={n("city")} value={value.city} />

      {/* País */}
      <div className="md:col-span-2">
        <Label htmlFor={`${idPrefix}-country`}>País</Label>
        <Input
          id={`${idPrefix}-country`}
          name={n("country")}
          value={value.country || "BR"}
          onChange={(e) => set("country", e.target.value.toUpperCase())}
          maxLength={2}
          readOnly
          className="bg-muted/50"
        />
      </div>
    </div>
  );
}
