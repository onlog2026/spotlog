"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, Send, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Formulário de contato geral.
 * Submit vai direto pro endpoint /api/leads que cria lead no CRM.
 */
type FormState = {
  full_name: string;
  email: string;
  whatsapp: string;
  company_name: string;
  subject: string;
  message: string;
  consent: boolean;
};

const initialState: FormState = {
  full_name: "",
  email: "",
  whatsapp: "",
  company_name: "",
  subject: "comercial",
  message: "",
  consent: false,
};

export function ContactForm() {
  const [data, setData] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!data.consent) {
      setError("Você precisa concordar com a Política de Privacidade.");
      return;
    }
    if (!data.full_name || !data.email || !data.message) {
      setError("Preencha nome, e-mail e mensagem.");
      return;
    }

    setLoading(true);
    try {
      const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "site",
          source_detail: "contato-geral",
          full_name: data.full_name,
          email: data.email,
          whatsapp: data.whatsapp || undefined,
          company_name: data.company_name || undefined,
          message: data.message,
          custom_fields: { subject: data.subject },
          utm_source: params?.get("utm_source") ?? undefined,
          utm_medium: params?.get("utm_medium") ?? undefined,
          utm_campaign: params?.get("utm_campaign") ?? undefined,
          page_url: typeof window !== "undefined" ? window.location.href : undefined,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
          consent: data.consent,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error ?? "Falha ao enviar.");
      }
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="rounded-3xl bg-white/10 border border-white/20 p-8 md:p-10 text-center backdrop-blur">
        <div className="inline-grid h-16 w-16 place-items-center rounded-full bg-success-500/30 mb-4">
          <CheckCircle2 className="h-8 w-8 text-success-300" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-2">Obrigado pelo contato! 🙌</h3>
        <p className="text-white/80 mb-6">
          Recebemos sua mensagem. Vamos responder em até <strong>1 dia útil</strong>.
        </p>
        <Button variant="outline" asChild className="bg-white text-navy-900 hover:bg-white/90">
          <Link href="/">Voltar pro site</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl bg-white/10 border border-white/20 p-6 md:p-8 backdrop-blur space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome" required>
          <input
            type="text"
            required
            value={data.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Seu nome"
            className={inputDark}
          />
        </Field>
        <Field label="E-mail" required>
          <input
            type="email"
            required
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="voce@email.com"
            className={inputDark}
          />
        </Field>
        <Field label="WhatsApp">
          <input
            type="tel"
            value={data.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            placeholder="(11) 99999-9999"
            className={inputDark}
          />
        </Field>
        <Field label="Empresa">
          <input
            type="text"
            value={data.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            placeholder="Sua empresa"
            className={inputDark}
          />
        </Field>
      </div>

      <Field label="Assunto">
        <select
          value={data.subject}
          onChange={(e) => update("subject", e.target.value)}
          className={inputDark}
        >
          <option value="comercial">Comercial / proposta</option>
          <option value="farma">Transporte farmacêutico</option>
          <option value="sac">SAC / suporte</option>
          <option value="parceria">Parceria</option>
          <option value="outro">Outro</option>
        </select>
      </Field>

      <Field label="Mensagem" required>
        <textarea
          required
          value={data.message}
          onChange={(e) => update("message", e.target.value)}
          rows={5}
          placeholder="Como podemos ajudar?"
          className={inputDark + " resize-y"}
        />
      </Field>

      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={data.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-white/30 text-spotorange-500"
        />
        <span className="text-sm text-white/80 leading-relaxed">
          Concordo com o tratamento dos meus dados conforme a{" "}
          <Link href="/privacidade" className="text-spotorange-300 font-semibold underline">
            Política de Privacidade
          </Link>
          .
        </span>
      </label>

      {error && (
        <div className="rounded-xl bg-red-500/20 border border-red-300/30 px-4 py-3 text-sm text-red-100">
          {error}
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <Button type="submit" variant="orange" size="xl" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              Enviar mensagem
            </>
          )}
        </Button>
        <span className="inline-flex items-center gap-1.5 text-xs text-white/60">
          <ShieldCheck className="h-3.5 w-3.5" />
          Dados protegidos (LGPD)
        </span>
      </div>
    </form>
  );
}

const inputDark =
  "w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-white placeholder:text-white/40 focus:border-spotorange-400 focus:outline-none focus:ring-2 focus:ring-spotorange-400/30 transition-all";

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-white mb-1.5">
        {label} {required && <span className="text-spotorange-300">*</span>}
      </span>
      {children}
    </label>
  );
}
