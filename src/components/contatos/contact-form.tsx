"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
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
import {
  EmailLookup,
  type ExistingContact,
} from "@/components/crm/email-lookup";

type CompanyOption = { id: string; name: string };

type ContactFormDefaults = {
  id?: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  job_title?: string | null;
  department?: string | null;
  seniority?: string | null;
  company_id?: string | null;
  linkedin_url?: string | null;
  cep?: string | null;
  street?: string | null;
  number?: string | null;
  complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  is_decision_maker?: boolean | null;
  do_not_contact?: boolean | null;
};

export function ContactForm({
  action,
  defaults,
  companies,
  cancelHref,
  submitLabel = "Salvar contato",
  showLookup = true,
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: ContactFormDefaults;
  companies: CompanyOption[];
  cancelHref: string;
  submitLabel?: string;
  /** desliga lookup quando editando o próprio contato (passa excludeId) */
  showLookup?: boolean;
}) {
  const d = defaults ?? {};
  const [email, setEmail] = useState<string>(d.email ?? "");
  const [fullName, setFullName] = useState<string>(d.full_name ?? "");
  const [phone, setPhone] = useState<string>(d.phone ?? "");
  const [whatsapp, setWhatsapp] = useState<string>(d.whatsapp ?? "");
  const [jobTitle, setJobTitle] = useState<string>(d.job_title ?? "");
  const [department, setDepartment] = useState<string>(d.department ?? "");
  const [seniority, setSeniority] = useState<string>(d.seniority ?? "");
  const [companyId, setCompanyId] = useState<string>(d.company_id ?? "");
  const [linkedin, setLinkedin] = useState<string>(d.linkedin_url ?? "");
  const [address, setAddress] = useState({
    ...EMPTY_ADDRESS,
    cep: d.cep ?? "",
    street: d.street ?? "",
    number: d.number ?? "",
    complement: d.complement ?? "",
    neighborhood: d.neighborhood ?? "",
    city: d.city ?? "",
    state: d.state ?? "",
    country: d.country ?? "BR",
  });

  function applyExisting(c: ExistingContact) {
    if (c.full_name) setFullName(c.full_name);
    if (c.phone) setPhone(c.phone);
    if (c.whatsapp) setWhatsapp(c.whatsapp);
    if (c.job_title) setJobTitle(c.job_title);
    if (c.department) setDepartment(c.department);
    if (c.seniority) setSeniority(c.seniority);
    if (c.linkedin_url) setLinkedin(c.linkedin_url);
    if (c.company_id) setCompanyId(c.company_id);
    setAddress({
      cep: c.cep ?? "",
      street: c.street ?? "",
      number: c.number ?? "",
      complement: c.complement ?? "",
      neighborhood: c.neighborhood ?? "",
      city: c.city ?? "",
      state: c.state ?? "",
      country: c.country ?? "BR",
    });
  }

  return (
    <form action={action} className="space-y-6">
      {/* === Seção 1: Dados básicos === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Dados do contato</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            {showLookup ? (
              <EmailLookup
                value={email}
                onChange={setEmail}
                onUseExisting={applyExisting}
                excludeId={d.id}
              />
            ) : (
              <>
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="joao@empresa.com"
                  className="hover:border-spotorange-500 transition-colors"
                />
              </>
            )}
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="full_name">Nome completo *</Label>
            <Input
              id="full_name"
              name="full_name"
              required
              minLength={2}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="João Silva"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="job_title">Cargo / Função</Label>
            <Input
              id="job_title"
              name="job_title"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="Diretor Comercial"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>
          <div>
            <Label htmlFor="department">Departamento</Label>
            <Input
              id="department"
              name="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              placeholder="Compras"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>

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
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              name="whatsapp"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="(11) 90000-0000"
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>

          <div>
            <Label htmlFor="seniority">Senioridade</Label>
            <select
              id="seniority"
              name="seniority"
              value={seniority}
              onChange={(e) => setSeniority(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-spotorange-500 transition-colors"
            >
              <option value="">—</option>
              <option value="entry">Entry</option>
              <option value="senior">Senior</option>
              <option value="manager">Gerente</option>
              <option value="director">Diretor</option>
              <option value="vp">VP</option>
              <option value="c_level">C-Level</option>
            </select>
          </div>
          <div>
            <Label htmlFor="linkedin_url">LinkedIn</Label>
            <Input
              id="linkedin_url"
              name="linkedin_url"
              type="url"
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="hover:border-spotorange-500 transition-colors"
            />
          </div>

          <div className="md:col-span-2">
            <Label htmlFor="company_id" className="flex items-center justify-between">
              <span>Empresa</span>
              <Link
                href="/app/empresas/nova"
                target="_blank"
                className="text-xs text-spotorange-500 hover:underline flex items-center gap-1"
              >
                <Plus className="h-3 w-3" /> Nova empresa
              </Link>
            </Label>
            <select
              id="company_id"
              name="company_id"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring hover:border-spotorange-500 transition-colors"
            >
              <option value="">— Sem empresa —</option>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_decision_maker"
                defaultChecked={d.is_decision_maker ?? false}
                className="h-4 w-4 rounded border-input"
              />
              É decisor
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="do_not_contact"
                defaultChecked={d.do_not_contact ?? false}
                className="h-4 w-4 rounded border-input"
              />
              Não contatar (DNC)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* === Seção 2: Endereço === */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <AddressForm
            value={address}
            onChange={setAddress}
            idPrefix="contact"
          />
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

// reserva o Textarea pra notes futuras
void Textarea;
