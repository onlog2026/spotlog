"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import type { FormDefinition, FormField } from "@/lib/forms/types";

type Theme = "light" | "dark";

interface DynamicFormProps {
  slug: string;
  className?: string;
  theme?: Theme;
  onSuccess?: () => void;
  /** preview mode renderiza com definition local em vez de fetch */
  previewDefinition?: FormDefinition;
  previewFields?: FormField[];
  disableSubmit?: boolean;
}

const widthClass: Record<FormField["width"], string> = {
  full: "col-span-12",
  half: "col-span-12 sm:col-span-6",
  third: "col-span-12 sm:col-span-4",
};

export function DynamicForm({
  slug,
  className = "",
  theme = "light",
  onSuccess,
  previewDefinition,
  previewFields,
  disableSubmit = false,
}: DynamicFormProps) {
  const [definition, setDefinition] = useState<FormDefinition | null>(previewDefinition ?? null);
  const [fields, setFields] = useState<FormField[]>(previewFields ?? []);
  const [loading, setLoading] = useState(!previewDefinition);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<null | {
    title: string;
    message: string;
    redirect_url: string | null;
  }>(null);

  useEffect(() => {
    if (previewDefinition) {
      setDefinition(previewDefinition);
      setFields(previewFields ?? []);
      setLoading(false);
      return;
    }
    let mounted = true;
    setLoading(true);
    fetch(`/api/forms/${slug}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r)))
      .then((data) => {
        if (!mounted) return;
        setDefinition(data.definition as FormDefinition);
        setFields(data.fields as FormField[]);
      })
      .catch(() => mounted && setSubmitError("Nao foi possivel carregar o formulario."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [slug, previewDefinition, previewFields]);

  const tokens = useMemo(() => themeTokens(theme), [theme]);

  function setValue(key: string, v: string) {
    setValues((s) => ({ ...s, [key]: v }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: "" }));
  }

  function clientValidate(): boolean {
    const e: Record<string, string> = {};
    for (const f of fields) {
      if (!f.active) continue;
      const v = (values[f.field_key] ?? "").trim();
      if (f.required && !v) {
        e[f.field_key] = `${f.label} e obrigatorio`;
        continue;
      }
      if (v && f.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
        e[f.field_key] = "E-mail invalido";
      }
      if (v && f.validation?.min_length && v.length < f.validation.min_length) {
        e[f.field_key] = `Minimo ${f.validation.min_length} caracteres`;
      }
    }
    if (definition?.show_consent && !consent) {
      e.__consent = "Precisamos do seu consentimento (LGPD)";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (disableSubmit) return;
    setSubmitError(null);
    if (!clientValidate()) return;
    setSubmitting(true);
    try {
      const urlParams =
        typeof window !== "undefined"
          ? new URLSearchParams(window.location.search)
          : new URLSearchParams();
      const res = await fetch(`/api/forms/${slug}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payload: values,
          consent_given: consent,
          page_url: typeof window !== "undefined" ? window.location.href : null,
          referrer: typeof document !== "undefined" ? document.referrer : null,
          source_url: typeof window !== "undefined" ? window.location.href : null,
          utm_source: urlParams.get("utm_source"),
          utm_medium: urlParams.get("utm_medium"),
          utm_campaign: urlParams.get("utm_campaign"),
          utm_term: urlParams.get("utm_term"),
          utm_content: urlParams.get("utm_content"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Erro ao enviar");
      setSuccess({
        title: data.success_title ?? "Obrigado!",
        message: data.success_message ?? "Recebemos sua mensagem.",
        redirect_url: data.redirect_url ?? null,
      });
      setValues({});
      setConsent(false);
      onSuccess?.();
      if (data.redirect_url && typeof window !== "undefined") {
        setTimeout(() => {
          window.location.href = data.redirect_url;
        }, 1500);
      }
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Erro ao enviar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        <Loader2 className={`h-6 w-6 animate-spin ${tokens.spinner}`} />
      </div>
    );
  }

  if (!definition) {
    return (
      <div className={`rounded-2xl border ${tokens.errorBox} p-6 text-sm ${className}`}>
        Formulario nao encontrado.
      </div>
    );
  }

  if (success) {
    return (
      <div
        className={`rounded-3xl p-8 text-center ${tokens.successBox} ${className}`}
        role="status"
      >
        <div className={`mx-auto grid h-16 w-16 place-items-center rounded-full ${tokens.successIconBg} mb-4`}>
          <CheckCircle2 className={`h-9 w-9 ${tokens.successIcon}`} />
        </div>
        <h3 className={`text-2xl font-bold mb-2 ${tokens.title}`}>{success.title}</h3>
        <p className={`max-w-md mx-auto mb-6 ${tokens.bodyText}`}>{success.message}</p>
        <Link
          href="/"
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold ${tokens.btnSecondary}`}
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar pro site
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`space-y-5 ${className}`} noValidate>
      {(definition.title || definition.description) && (
        <div className="space-y-2">
          {definition.title && (
            <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${tokens.title}`}>
              {definition.title}
            </h2>
          )}
          {definition.description && (
            <p className={`text-sm md:text-base ${tokens.bodyText}`}>{definition.description}</p>
          )}
        </div>
      )}

      {submitError && (
        <div
          role="alert"
          className={`flex items-start gap-2 rounded-xl p-3 text-sm ${tokens.errorBox}`}
        >
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{submitError}</span>
        </div>
      )}

      <div className="grid grid-cols-12 gap-4">
        {fields
          .filter((f) => f.active)
          .map((field) => (
            <div key={field.id} className={widthClass[field.width]}>
              <FieldRenderer
                field={field}
                value={values[field.field_key] ?? ""}
                onChange={(v) => setValue(field.field_key, v)}
                error={errors[field.field_key]}
                tokens={tokens}
              />
            </div>
          ))}
      </div>

      {definition.show_consent && (
        <div className="space-y-1">
          <label className={`flex items-start gap-2 text-xs cursor-pointer ${tokens.bodyText}`}>
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => {
                setConsent(e.target.checked);
                if (errors.__consent) setErrors((er) => ({ ...er, __consent: "" }));
              }}
              className={`mt-0.5 h-4 w-4 rounded ${tokens.checkbox}`}
              aria-required="true"
              aria-invalid={!!errors.__consent}
            />
            <span>
              {definition.consent_text ??
                "Concordo com o tratamento dos meus dados conforme a Politica de Privacidade."}
            </span>
          </label>
          {errors.__consent && (
            <p role="alert" className="text-xs text-red-500 pl-6">
              {errors.__consent}
            </p>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || disableSubmit}
        className={`w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base transition-all disabled:opacity-60 disabled:cursor-not-allowed ${tokens.btnPrimary}`}
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {definition.submit_label}
      </button>
    </form>
  );
}

interface FieldRendererProps {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  tokens: ReturnType<typeof themeTokens>;
}

function FieldRenderer({ field, value, onChange, error, tokens }: FieldRendererProps) {
  if (field.type === "hidden") {
    return <input type="hidden" name={field.field_key} value={value} />;
  }

  const inputCls = `w-full rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${
    error ? tokens.inputError : tokens.input
  }`;

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={field.field_key}
        className={`text-xs font-semibold ${tokens.label}`}
      >
        {field.label} {field.required && <span className="text-red-500">*</span>}
      </label>

      {field.type === "datetime_slot" ? (
        <DatetimeSlotField field={field} value={value} onChange={onChange} tokens={tokens} />
      ) : field.type === "textarea" ? (
        <textarea
          id={field.field_key}
          name={field.field_key}
          rows={5}
          required={field.required}
          aria-required={field.required}
          aria-invalid={!!error}
          placeholder={field.placeholder ?? ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      ) : field.type === "select" ? (
        <select
          id={field.field_key}
          name={field.field_key}
          required={field.required}
          aria-required={field.required}
          aria-invalid={!!error}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        >
          <option value="">Selecione...</option>
          {field.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "radio" ? (
        <div className="space-y-1.5 pt-1">
          {field.options.map((opt) => (
            <label
              key={opt.value}
              className={`flex items-center gap-2 text-sm cursor-pointer ${tokens.bodyText}`}
            >
              <input
                type="radio"
                name={field.field_key}
                value={opt.value}
                checked={value === opt.value}
                onChange={(e) => onChange(e.target.value)}
                className={tokens.checkbox}
              />
              {opt.label}
            </label>
          ))}
        </div>
      ) : field.type === "checkbox" ? (
        <div className="space-y-1.5 pt-1">
          {field.options.length > 0 ? (
            field.options.map((opt) => {
              const arr = value ? value.split(",") : [];
              const checked = arr.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-center gap-2 text-sm cursor-pointer ${tokens.bodyText}`}
                >
                  <input
                    type="checkbox"
                    value={opt.value}
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...arr, opt.value]
                        : arr.filter((x) => x !== opt.value);
                      onChange(next.join(","));
                    }}
                    className={tokens.checkbox}
                  />
                  {opt.label}
                </label>
              );
            })
          ) : (
            <label className={`flex items-center gap-2 text-sm cursor-pointer ${tokens.bodyText}`}>
              <input
                type="checkbox"
                checked={value === "true"}
                onChange={(e) => onChange(e.target.checked ? "true" : "")}
                className={tokens.checkbox}
              />
              {field.placeholder ?? "Marque para confirmar"}
            </label>
          )}
        </div>
      ) : (
        <input
          id={field.field_key}
          name={field.field_key}
          type={
            field.type === "phone"
              ? "tel"
              : field.type === "url"
                ? "url"
                : field.type === "number"
                  ? "number"
                  : field.type === "date"
                    ? "date"
                    : field.type
          }
          inputMode={field.type === "phone" ? "tel" : undefined}
          required={field.required}
          aria-required={field.required}
          aria-invalid={!!error}
          placeholder={field.placeholder ?? ""}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={inputCls}
        />
      )}

      {field.help_text && !error && (
        <p className={`text-[11px] ${tokens.helpText}`}>{field.help_text}</p>
      )}
      {error && (
        <p role="alert" className="text-[11px] text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}

function DatetimeSlotField({
  field,
  value,
  onChange,
  tokens,
}: {
  field: FormField;
  value: string;
  onChange: (v: string) => void;
  tokens: ReturnType<typeof themeTokens>;
}) {
  // Próximos 14 dias úteis (Seg-Sex)
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [slots, setSlots] = useState<{ iso_start: string; start: string }[]>([]);
  const [loading, setLoading] = useState(false);

  // org slug usado no atributo data-org-id do form; lê do data attr ou env
  const orgId =
    (typeof document !== "undefined" && document.body.dataset.spotlogOrg) ||
    process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ||
    "";

  const dates = useMemo(() => {
    const out: { v: string; label: string }[] = [];
    const today = new Date();
    let added = 0;
    let i = 1;
    while (added < 14 && i < 30) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        const v = d.toISOString().slice(0, 10);
        const label = d.toLocaleDateString("pt-BR", { weekday: "short", day: "2-digit", month: "2-digit" });
        out.push({ v, label });
        added++;
      }
      i++;
    }
    return out;
  }, []);

  useEffect(() => {
    if (!date || !orgId) return;
    setLoading(true);
    setTime("");
    fetch(`/api/agenda/slots?date=${date}&owner=auto&org=${orgId}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoading(false));
  }, [date, orgId]);

  useEffect(() => {
    if (date && time) {
      const iso = new Date(`${date}T${time}:00-03:00`).toISOString();
      onChange(iso);
    } else {
      onChange("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, time]);

  const selectCls = `w-full rounded-xl px-4 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 ${tokens.input}`;

  return (
    <div className="grid grid-cols-2 gap-2">
      <select value={date} onChange={(e) => setDate(e.target.value)} className={selectCls}>
        <option value="">Escolha a data</option>
        {dates.map((d) => (
          <option key={d.v} value={d.v}>
            {d.label}
          </option>
        ))}
      </select>
      <select value={time} onChange={(e) => setTime(e.target.value)} disabled={!date || loading} className={selectCls}>
        <option value="">
          {loading
            ? "Carregando…"
            : !date
              ? "Escolha o horário"
              : slots.length === 0
                ? "Sem horários — vamos te ligar"
                : "Escolha o horário"}
        </option>
        {slots.map((s) => {
          const t = s.start.slice(11, 16);
          return (
            <option key={s.iso_start} value={t}>
              {t}
            </option>
          );
        })}
      </select>
      <input type="hidden" name={field.field_key} value={value} />
    </div>
  );
}

function themeTokens(theme: Theme) {
  if (theme === "dark") {
    return {
      title: "text-white",
      bodyText: "text-white/70",
      label: "text-white/90",
      helpText: "text-white/50",
      input:
        "bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:border-spotorange-400 focus:ring-spotorange-400/20",
      inputError:
        "bg-white/5 border border-red-400 text-white focus:ring-red-400/30",
      checkbox: "accent-spotorange-500",
      btnPrimary:
        "bg-spotorange-500 hover:bg-spotorange-600 text-white shadow-lg shadow-spotorange-500/30",
      btnSecondary: "bg-white/10 hover:bg-white/20 text-white",
      successBox: "bg-emerald-500/10 border border-emerald-500/30 text-white",
      successIconBg: "bg-emerald-500/20",
      successIcon: "text-emerald-400",
      errorBox: "bg-red-500/10 border border-red-500/30 text-red-300",
      spinner: "text-white/60",
    };
  }
  return {
    title: "text-navy-900",
    bodyText: "text-ink-600",
    label: "text-navy-900",
    helpText: "text-ink-500",
    input:
      "bg-white border-2 border-navy-100 text-navy-900 placeholder:text-ink-400 focus:border-spotorange-500 focus:ring-spotorange-500/20",
    inputError:
      "bg-red-50 border-2 border-red-400 text-navy-900 focus:ring-red-400/30",
    checkbox: "accent-spotorange-500",
    btnPrimary:
      "bg-spotorange-500 hover:bg-spotorange-600 text-white shadow-lg shadow-spotorange-500/30 hover:shadow-xl hover:scale-[1.01]",
    btnSecondary: "bg-navy-50 hover:bg-navy-100 text-navy-900",
    successBox: "bg-emerald-50 border-2 border-emerald-200",
    successIconBg: "bg-emerald-500",
    successIcon: "text-white",
    errorBox: "bg-red-50 border-2 border-red-200 text-red-700",
    spinner: "text-spotorange-500",
  };
}
