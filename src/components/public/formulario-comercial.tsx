"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { CheckCircle2, Loader2, ArrowRight, Phone, Mail, MessageCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Formulário comercial — "Solicitar proposta"
 * Submit vai direto pro endpoint /api/leads que cria lead no CRM
 * (com fallback automático pra org default — funciona mesmo sem
 * o usuário estar logado).
 */
type FormState = {
  full_name: string;
  company_name: string;
  email: string;
  whatsapp: string;
  segment: string;
  volume: string;
  regiao: string;
  tipo_operacao: string;
  message: string;
  consent: boolean;
  schedule_meeting: boolean;
  schedule_date: string;
  schedule_time: string;
};

const initialState: FormState = {
  full_name: "",
  company_name: "",
  email: "",
  whatsapp: "",
  segment: "",
  volume: "",
  regiao: "",
  tipo_operacao: "",
  message: "",
  consent: false,
  schedule_meeting: false,
  schedule_date: "",
  schedule_time: "",
};

const DEFAULT_ORG_ID = process.env.NEXT_PUBLIC_DEFAULT_ORG_ID ?? "";

export function FormularioComercial({ compact: _compact = false }: { compact?: boolean }) {
  const [data, setData] = useState<FormState>(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [slots, setSlots] = useState<{ iso_start: string; start: string }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setData((d) => ({ ...d, [key]: value }));
  }

  useEffect(() => {
    if (!data.schedule_meeting || !data.schedule_date || !DEFAULT_ORG_ID) {
      setSlots([]);
      return;
    }
    setLoadingSlots(true);
    fetch(`/api/agenda/slots?date=${data.schedule_date}&owner=auto&org=${DEFAULT_ORG_ID}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [data.schedule_meeting, data.schedule_date]);

  const next14Days = (() => {
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
  })();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!data.consent) {
      setError("Você precisa concordar com a Política de Privacidade.");
      return;
    }
    if (!data.full_name || !data.email || !data.whatsapp || !data.message) {
      setError("Preencha nome, e-mail, WhatsApp e mensagem.");
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
          source_detail: "solicitar-proposta",
          full_name: data.full_name,
          email: data.email,
          whatsapp: data.whatsapp,
          company_name: data.company_name || undefined,
          message: data.message,
          custom_fields: {
            segment: data.segment,
            volume: data.volume,
            regiao: data.regiao,
            tipo_operacao: data.tipo_operacao,
          },
          utm_source: params?.get("utm_source") ?? undefined,
          utm_medium: params?.get("utm_medium") ?? undefined,
          utm_campaign: params?.get("utm_campaign") ?? undefined,
          utm_term: params?.get("utm_term") ?? undefined,
          utm_content: params?.get("utm_content") ?? undefined,
          page_url: typeof window !== "undefined" ? window.location.href : undefined,
          referrer: typeof document !== "undefined" ? document.referrer || undefined : undefined,
          consent: data.consent,
        }),
      });

      const respBody = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error((respBody as { error?: string })?.error ?? "Falha ao enviar. Tente novamente.");
      }

      // Se quis agendar reunião, cria appointment vinculado
      if (data.schedule_meeting && data.schedule_date && data.schedule_time && DEFAULT_ORG_ID) {
        try {
          const leadId = (respBody as { id?: string; lead_id?: string })?.id ?? (respBody as { lead_id?: string })?.lead_id ?? null;
          const scheduledAt = new Date(`${data.schedule_date}T${data.schedule_time}:00-03:00`).toISOString();
          await fetch("/api/agenda/book", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              org: DEFAULT_ORG_ID,
              owner: "auto",
              scheduled_at: scheduledAt,
              duration: 30,
              title: `Reunião com ${data.full_name}`,
              external_name: data.full_name,
              external_email: data.email,
              external_phone: data.whatsapp,
              lead_id: leadId,
              source: "formulario-comercial",
              meeting_type: "video",
            }),
          });
        } catch (e) {
          console.warn("[form-comercial] agendamento falhou", e);
        }
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
      <div className="rounded-3xl bg-white border border-success-200 shadow-card p-8 md:p-12 text-center animate-in fade-in zoom-in-95 duration-500">
        <div className="inline-grid h-20 w-20 place-items-center rounded-full bg-success-100 mb-5">
          <CheckCircle2 className="h-10 w-10 text-success-700" />
        </div>
        <h3 className="text-2xl md:text-3xl font-bold text-navy-950 mb-2">
          Obrigado pelo contato! 🙌
        </h3>
        <p className="text-ink-600 max-w-xl mx-auto mb-8">
          Recebemos sua solicitação. Nosso time comercial vai responder em até{" "}
          <strong>1 dia útil</strong> pelo e-mail ou WhatsApp.
        </p>

        <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto mb-6">
          <a
            href="https://wa.me/5511914791442"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-xl bg-success-500 text-white font-semibold py-3 px-4 hover:bg-success-600 transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            WhatsApp
          </a>
          <a
            href="tel:+5511914791442"
            className="flex items-center justify-center gap-2 rounded-xl bg-navy-900 text-white font-semibold py-3 px-4 hover:bg-navy-800 transition-colors"
          >
            <Phone className="h-4 w-4" />
            (11) 91479-1442
          </a>
          <a
            href="mailto:comercial@spotlogoficial.com.br"
            className="flex items-center justify-center gap-2 rounded-xl border border-navy-200 text-navy-900 font-semibold py-3 px-4 hover:bg-navy-50 transition-colors"
          >
            <Mail className="h-4 w-4" />
            E-mail
          </a>
        </div>

        <Button variant="outline" asChild>
          <Link href="/">Voltar pro site</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl bg-white border border-navy-100 shadow-card p-6 md:p-8 lg:p-10"
    >
      <div className="grid md:grid-cols-2 gap-5">
        <Field label="Nome completo" required>
          <input
            type="text"
            required
            value={data.full_name}
            onChange={(e) => update("full_name", e.target.value)}
            placeholder="Como devemos te chamar?"
            className={inputClass}
          />
        </Field>
        <Field label="Empresa">
          <input
            type="text"
            value={data.company_name}
            onChange={(e) => update("company_name", e.target.value)}
            placeholder="Nome da sua empresa"
            className={inputClass}
          />
        </Field>
        <Field label="E-mail corporativo" required>
          <input
            type="email"
            required
            value={data.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="voce@empresa.com.br"
            className={inputClass}
          />
        </Field>
        <Field label="WhatsApp" required>
          <input
            type="tel"
            required
            value={data.whatsapp}
            onChange={(e) => update("whatsapp", e.target.value)}
            placeholder="(11) 99999-9999"
            className={inputClass}
          />
        </Field>
        <Field label="Segmento">
          <select
            value={data.segment}
            onChange={(e) => update("segment", e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione</option>
            <option value="ecommerce">E-commerce</option>
            <option value="farma">Farmácia</option>
            <option value="manipulacao">Farmácia de manipulação</option>
            <option value="correlatos">Correlatos / Dermocosméticos</option>
            <option value="b2b">B2B / Indústria</option>
            <option value="outro">Outro</option>
          </select>
        </Field>
        <Field label="Volume mensal de entregas">
          <select
            value={data.volume}
            onChange={(e) => update("volume", e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione</option>
            <option value="ate_50">Até 50/mês</option>
            <option value="50_200">50 a 200/mês</option>
            <option value="200_500">200 a 500/mês</option>
            <option value="500_1000">500 a 1.000/mês</option>
            <option value="1000_5000">1.000 a 5.000/mês</option>
            <option value="mais_5000">Mais de 5.000/mês</option>
          </select>
        </Field>
        <Field label="Região de atuação">
          <input
            type="text"
            value={data.regiao}
            onChange={(e) => update("regiao", e.target.value)}
            placeholder="Ex: SP capital, Grande SP, Campinas"
            className={inputClass}
          />
        </Field>
        <Field label="Tipo de operação">
          <select
            value={data.tipo_operacao}
            onChange={(e) => update("tipo_operacao", e.target.value)}
            className={inputClass}
          >
            <option value="">Selecione</option>
            <option value="expressa">Expressa / Same-day</option>
            <option value="dedicada">Rota dedicada</option>
            <option value="reversa">Logística reversa</option>
            <option value="farma">Farma com AFE Anvisa</option>
            <option value="misto">Misto</option>
          </select>
        </Field>
        <div className="md:col-span-2">
          <Field label="Como podemos ajudar?" required>
            <textarea
              required
              value={data.message}
              onChange={(e) => update("message", e.target.value)}
              placeholder="Conte um pouco do desafio da sua operação"
              rows={4}
              className={inputClass + " resize-y"}
            />
          </Field>
        </div>
      </div>

      {DEFAULT_ORG_ID && (
        <div className="mt-6 rounded-2xl border-2 border-dashed border-[#011960]/30 bg-[#011960]/5 p-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={data.schedule_meeting}
              onChange={(e) => update("schedule_meeting", e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-navy-300 text-[#BA0102] focus:ring-[#BA0102]"
            />
            <span className="text-sm">
              <strong className="text-[#011960]">Quero agendar uma demonstração</strong>
              <span className="block text-ink-600 text-xs mt-0.5">
                Escolha o dia e horário que prefere — vamos direto ao ponto.
              </span>
            </span>
          </label>
          {data.schedule_meeting && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              <select
                value={data.schedule_date}
                onChange={(e) => update("schedule_date", e.target.value)}
                className={inputClass}
              >
                <option value="">Escolha o dia</option>
                {next14Days.map((d) => (
                  <option key={d.v} value={d.v}>
                    {d.label}
                  </option>
                ))}
              </select>
              <select
                value={data.schedule_time}
                onChange={(e) => update("schedule_time", e.target.value)}
                disabled={!data.schedule_date || loadingSlots}
                className={inputClass}
              >
                <option value="">
                  {loadingSlots
                    ? "Carregando…"
                    : !data.schedule_date
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
            </div>
          )}
        </div>
      )}

      <label className="mt-6 flex items-start gap-3 cursor-pointer group">
        <input
          type="checkbox"
          checked={data.consent}
          onChange={(e) => update("consent", e.target.checked)}
          className="mt-1 h-4 w-4 rounded border-navy-300 text-spotorange-500 focus:ring-spotorange-500"
        />
        <span className="text-sm text-ink-600 leading-relaxed">
          Concordo com o tratamento dos meus dados conforme a{" "}
          <Link href="/privacidade" className="text-spotorange-600 font-semibold underline">
            Política de Privacidade
          </Link>{" "}
          para que a Spotlog entre em contato comigo.
        </span>
      </label>

      {error && (
        <div className="mt-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex items-center gap-3 flex-wrap">
        <Button type="submit" variant="orange" size="xl" disabled={loading}>
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              Solicitar proposta agora
              <ArrowRight className="h-5 w-5" />
            </>
          )}
        </Button>
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-500">
          <ShieldCheck className="h-3.5 w-3.5 text-success-600" />
          Seus dados ficam protegidos (LGPD)
        </span>
      </div>
    </form>
  );
}

const inputClass =
  "w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-navy-900 placeholder:text-ink-400 focus:border-spotorange-500 focus:outline-none focus:ring-2 focus:ring-spotorange-500/20 transition-all";

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-semibold text-navy-900 mb-1.5">
        {label} {required && <span className="text-spotorange-500">*</span>}
      </span>
      {children}
    </label>
  );
}
