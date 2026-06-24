import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type LeadFormDefaults = {
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  company_name?: string | null;
  job_title?: string | null;
  source?: string | null;
  source_detail?: string | null;
  status?: string | null;
  score?: number | null;
  message?: string | null;
};

const STATUS = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Qualificado" },
  { value: "disqualified", label: "Desqualificado" },
  { value: "converted", label: "Convertido" },
  { value: "recycled", label: "Reciclado" },
];

const SOURCES = [
  { value: "manual", label: "Manual" },
  { value: "site", label: "Site / Formulário" },
  { value: "prospeccao", label: "Prospecção ativa" },
  { value: "indicacao", label: "Indicação" },
  { value: "evento", label: "Evento" },
  { value: "social", label: "Redes sociais" },
  { value: "google_ads", label: "Google Ads" },
  { value: "meta_ads", label: "Meta Ads" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "outro", label: "Outro" },
];

export function LeadForm({
  action,
  defaults,
  cancelHref,
  submitLabel = "Salvar lead",
}: {
  action: (formData: FormData) => void | Promise<void>;
  defaults?: LeadFormDefaults;
  cancelHref: string;
  submitLabel?: string;
}) {
  const d = defaults ?? {};
  return (
    <form action={action} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <Label htmlFor="full_name">Nome completo *</Label>
          <Input
            id="full_name"
            name="full_name"
            required
            minLength={2}
            defaultValue={d.full_name ?? ""}
            placeholder="Maria Souza"
          />
        </div>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            defaultValue={d.email ?? ""}
            placeholder="maria@empresa.com"
          />
        </div>
        <div>
          <Label htmlFor="whatsapp">WhatsApp</Label>
          <Input
            id="whatsapp"
            name="whatsapp"
            defaultValue={d.whatsapp ?? ""}
            placeholder="(11) 90000-0000"
          />
        </div>
        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input
            id="phone"
            name="phone"
            defaultValue={d.phone ?? ""}
            placeholder="(11) 0000-0000"
          />
        </div>
        <div>
          <Label htmlFor="company_name">Empresa</Label>
          <Input
            id="company_name"
            name="company_name"
            defaultValue={d.company_name ?? ""}
            placeholder="Nome da empresa do lead"
          />
        </div>
        <div>
          <Label htmlFor="job_title">Cargo</Label>
          <Input
            id="job_title"
            name="job_title"
            defaultValue={d.job_title ?? ""}
            placeholder="Diretor Comercial"
          />
        </div>

        <div>
          <Label htmlFor="source">Origem *</Label>
          <select
            id="source"
            name="source"
            required
            defaultValue={d.source ?? "manual"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="source_detail">Detalhe da origem</Label>
          <Input
            id="source_detail"
            name="source_detail"
            defaultValue={d.source_detail ?? ""}
            placeholder="Ex.: campanha black friday"
          />
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <select
            id="status"
            name="status"
            defaultValue={d.status ?? "new"}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            {STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="score">Score (0-100)</Label>
          <Input
            id="score"
            name="score"
            type="number"
            min={0}
            max={100}
            defaultValue={d.score ?? ""}
            placeholder="60"
          />
        </div>
        <div className="md:col-span-2">
          <Label htmlFor="message">Mensagem / contexto</Label>
          <Textarea
            id="message"
            name="message"
            rows={4}
            defaultValue={d.message ?? ""}
            placeholder="O que o lead quer? Histórico, necessidades, observações."
          />
        </div>
      </div>

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
