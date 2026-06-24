"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export interface LeadFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  message: string;
}

export function LeadForm({
  onSubmit,
  onCancel,
  defaultMessage,
}: {
  onSubmit: (values: LeadFormValues) => Promise<void> | void;
  onCancel?: () => void;
  defaultMessage?: string;
}) {
  const [values, setValues] = useState<LeadFormValues>({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: defaultMessage ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LeadFormValues, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function validate() {
    const e: Partial<Record<keyof LeadFormValues, string>> = {};
    if (values.name.trim().length < 2) e.name = "Informe seu nome";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) e.email = "E-mail inválido";
    if (values.phone && values.phone.replace(/\D/g, "").length < 8)
      e.phone = "Telefone inválido";
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(values);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-[#011960]/15 bg-white p-3 shadow-sm space-y-2.5"
    >
      <p className="text-sm font-semibold text-[#011960]">
        Deixa que a gente te chama 🚀
      </p>
      <Field
        label="Nome*"
        value={values.name}
        onChange={(v) => setValues({ ...values, name: v })}
        error={errors.name}
        autoComplete="name"
      />
      <Field
        label="E-mail*"
        type="email"
        value={values.email}
        onChange={(v) => setValues({ ...values, email: v })}
        error={errors.email}
        autoComplete="email"
      />
      <Field
        label="WhatsApp"
        value={values.phone}
        onChange={(v) => setValues({ ...values, phone: v })}
        error={errors.phone}
        autoComplete="tel"
        inputMode="tel"
      />
      <Field
        label="Empresa"
        value={values.company}
        onChange={(v) => setValues({ ...values, company: v })}
        autoComplete="organization"
      />
      <label className="block">
        <span className="text-[11px] font-medium text-[#011960]/80">Mensagem</span>
        <textarea
          value={values.message}
          onChange={(e) => setValues({ ...values, message: e.target.value })}
          rows={2}
          className="mt-1 w-full rounded-lg border border-[#011960]/20 bg-white px-2.5 py-1.5 text-sm text-[#011960] placeholder:text-[#011960]/40 focus:outline-none focus:ring-2 focus:ring-[#BA0102]/30 focus:border-[#BA0102]"
        />
      </label>

      <div className="flex gap-2 pt-1">
        {onCancel ? (
          <button
            type="button"
            onClick={onCancel}
            disabled={submitting}
            className="flex-1 rounded-lg border border-[#011960]/20 bg-white px-3 py-2 text-xs font-medium text-[#011960] hover:bg-[#011960]/5 disabled:opacity-50"
          >
            Cancelar
          </button>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-[#BA0102] px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#BA0102]/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 className="size-3.5 animate-spin" /> : null}
          Enviar
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-medium text-[#011960]/80">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="mt-1 w-full rounded-lg border border-[#011960]/20 bg-white px-2.5 py-1.5 text-sm text-[#011960] placeholder:text-[#011960]/40 focus:outline-none focus:ring-2 focus:ring-[#BA0102]/30 focus:border-[#BA0102]"
      />
      {error ? (
        <span className="mt-1 block text-[11px] text-[#BA0102]">{error}</span>
      ) : null}
    </label>
  );
}
