"use client";

import { useState } from "react";
import Link from "next/link";
import { Loader2, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AddressForm, EMPTY_ADDRESS } from "@/components/crm/address-form";

const INDUSTRIES = [
  { value: "ecommerce", label: "E-commerce" },
  { value: "farma", label: "Farma" },
  { value: "manipulacao", label: "Manipulação" },
  { value: "correlatos", label: "Correlatos" },
  { value: "dermo", label: "Dermo" },
  { value: "b2b", label: "B2B" },
  { value: "saude", label: "Saúde" },
  { value: "tecnologia", label: "Tecnologia" },
  { value: "varejo", label: "Varejo" },
  { value: "industria", label: "Indústria" },
  { value: "logistica", label: "Logística" },
  { value: "outro", label: "Outro" },
];

const SIZES = [
  { value: "1-10", label: "1-10 funcionários" },
  { value: "11-50", label: "11-50 funcionários" },
  { value: "51-200", label: "51-200 funcionários" },
  { value: "201-500", label: "201-500 funcionários" },
  { value: "501-1000", label: "501-1000 funcionários" },
  { value: "1000+", label: "1000+ funcionários" },
];

type CompanyFormDefaults = {
  name?: string | null;
  legal_name?: string | null;
  cnpj?: string | null;
  industry?: string | null;
  size?: string | null;
  domain?: string | null;
  website?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  country?: string | null;
  linkedin_url?: string | null;
  description?: string | null;
  notes?: string | null;
};

function maskCnpj(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 14);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12)
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function CompanyForm({
  action,
  defaults,
  submitLabel = "Salvar empresa",
  cancelHref,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: CompanyFormDefaults;
  submitLabel?: string;
  cancelHref: string;
}) {
  const d = defaults ?? {};
  const [cnpj, setCnpj] = useState<string>(d.cnpj ?? "");
  const [name, setName] = useState<string>(d.name ?? "");
  const [legalName, setLegalName] = useState<string>(d.legal_name ?? "");
  const [industry, setIndustry] = useState<string>(d.industry ?? "");
  const [size, setSize] = useState<string>(d.size ?? "");
  const [domain, setDomain] = useState<string>(d.domain ?? "");
  const [website, setWebsite] = useState<string>(d.website ?? "");
  const [phone, setPhone] = useState<string>(d.phone ?? "");
  const [email, setEmail] = useState<string>(d.email ?? "");
  const [linkedin, setLinkedin] = useState<string>(d.linkedin_url ?? "");
  const [description, setDescription] = useState<string>(d.description ?? "");
  const [notes, setNotes] = useState<string>(d.notes ?? "");
  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    cep: d.cep ?? d.zipcode ?? "",
    street: d.street ?? "",
    number: d.number ?? "",
    complement: d.complement ?? "",
    neighborhood: d.neighborhood ?? "",
    city: d.city ?? "",
    state: d.state ?? "",
    country: d.country ?? "BR",
  });

  const [cnpjLoading, setCnpjLoading] = useState(false);
  const [cnpjMsg, setCnpjMsg] = useState<string | null>(null);

  async function lookupCnpj() {
    setCnpjMsg(null);
    const digits = cnpj.replace(/\D/g, "");
    if (digits.length !== 14) {
      setCnpjMsg("Digite os 14 dígitos do CNPJ.");
      return;
    }
    setCnpjLoading(true);
    try {
      const r = await fetch(`/api/brasil/cnpj?cnpj=${digits}`);
      if (!r.ok) {
        setCnpjMsg("CNPJ não encontrado.");
        return;
      }
      const j = await r.json();
      if (j.razao_social) setName(j.razao_social);
      if (j.nome_fantasia) setLegalName(j.nome_fantasia);
      if (j.phone) setPhone(j.phone);
      if (j.email) setEmail(j.email);
      setAddress((cur) => ({
        ...cur,
        cep: j.cep ?? cur.cep,
        street: j.street ?? cur.street,
        number: j.number ?? cur.number,
        complement: j.complement ?? cur.complement,
        neighborhood: j.neighborhood ?? cur.neighborhood,
        city: j.city ?? cur.city,
        state: (j.state ?? cur.state).toUpperCase(),
      }));
      setCnpjMsg(j.situacao ? `Situação: ${j.situacao}` : "Dados carregados.");
    } catch {
      setCnpjMsg("Falha ao consultar CNPJ.");
    } finally {
      setCnpjLoading(false);
    }
  }

  return (
    <form action={action} className="space-y-6">
      {/* === Identificação + CNPJ lookup === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Identificação</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label htmlFor="cnpj" className="flex items-center gap-1">
              CNPJ
              {cnpjLoading ? (
                <Loader2 className="h-3 w-3 animate-spin text-spotorange-500" />
              ) : null}
            </Label>
            <div className="flex gap-2">
              <Input
                id="cnpj"
                name="cnpj"
                value={cnpj}
                onChange={(e) => setCnpj(maskCnpj(e.target.value))}
                placeholder="00.000.000/0001-00"
                maxLength={18}
                inputMode="numeric"
                className="hover:border-spotorange-500 transition-colors"
              />
              <Button
                type="button"
                variant="default"
                onClick={lookupCnpj}
                disabled={cnpjLoading}
              >
                <Search className="h-4 w-4" />
                Buscar CNPJ
              </Button>
            </div>
            {cnpjMsg ? (
              <p className="text-[11px] text-muted-foreground mt-1">{cnpjMsg}</p>
            ) : null}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="name">Razão social / nome *</Label>
            <Input
              id="name"
              name="name"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Farmácia Bem-Estar Ltda"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="legal_name">Nome fantasia</Label>
            <Input
              id="legal_name"
              name="legal_name"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Bem-Estar"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="industry">Segmento</Label>
            <select
              id="industry"
              name="industry"
              value={industry}
              onChange={(e) => setIndustry(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-spotorange-500 transition-colors"
            >
              <option value="">— Selecione —</option>
              {INDUSTRIES.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label htmlFor="size">Porte</Label>
            <select
              id="size"
              name="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-spotorange-500 transition-colors"
            >
              <option value="">— Selecione —</option>
              {SIZES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="domain">Domínio</Label>
            <Input
              id="domain"
              name="domain"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="bemestar.com.br"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>
          <div>
            <Label htmlFor="website">Website</Label>
            <Input
              id="website"
              name="website"
              type="url"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://bemestar.com.br"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* === Endereço === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm
            value={address}
            onChange={setAddress}
            idPrefix="company"
          />
        </CardContent>
      </Card>

      {/* === Contato === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Contato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="phone">Telefone</Label>
            <Input
              id="phone"
              name="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(11) 0000-0000"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="contato@empresa.com"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/company/..."
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      {/* === Observações === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Observações</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição pública</Label>
            <Textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que essa empresa faz"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>
          <div>
            <Label htmlFor="notes">Notas internas</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anotações internas, contexto comercial"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
        <Button type="button" variant="ghost" asChild>
          <Link href={cancelHref}>Cancelar</Link>
        </Button>
        <Button type="submit" variant="orange">
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
