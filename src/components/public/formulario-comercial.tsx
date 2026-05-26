"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const schema = z.object({
  full_name: z.string().min(2, "Informe seu nome completo"),
  company_name: z.string().min(2, "Informe a empresa"),
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "Informe o WhatsApp com DDD"),
  segment: z.string().optional(),
  monthly_volume: z.string().optional(),
  region: z.string().optional(),
  operation_type: z.string().optional(),
  message: z.string().min(10, "Conta um pouco do que você precisa"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Precisamos do seu consentimento (LGPD)" }),
  }),
});
type Values = z.infer<typeof schema>;

export function FormularioComercial({ compact = false }: { compact?: boolean }) {
  const [done, setDone] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { consent: undefined as unknown as true } });

  async function onSubmit(values: Values) {
    try {
      const utm = new URLSearchParams(window.location.search);
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          source: "form",
          source_detail: "site/contato",
          utm_source: utm.get("utm_source"),
          utm_medium: utm.get("utm_medium"),
          utm_campaign: utm.get("utm_campaign"),
          page_url: window.location.href,
          referrer: document.referrer,
          custom_fields: {
            segment: values.segment,
            monthly_volume: values.monthly_volume,
            region: values.region,
            operation_type: values.operation_type,
          },
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro");
      setDone(true);
      toast.success("Recebemos sua mensagem! Vamos responder em até 1 dia útil.");
      form.reset();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erro ao enviar. Tente novamente.");
    }
  }

  if (done) {
    return (
      <div className="text-center py-12 px-6 bg-success-50 rounded-3xl border-2 border-success-200">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-success-500 mb-4">
          <CheckCircle2 className="h-8 w-8 text-white" />
        </div>
        <h3 className="text-2xl font-bold text-navy-900 mb-2">Recebemos! 🎉</h3>
        <p className="text-ink-600 max-w-sm mx-auto mb-6">
          Em até 1 dia útil um especialista da Spotlog entra em contato pelo
          WhatsApp ou e-mail informado.
        </p>
        <Button variant="outline" onClick={() => setDone(false)}>
          Enviar nova mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Nome completo *" error={form.formState.errors.full_name?.message}>
          <Input {...form.register("full_name")} placeholder="Maria Silva" />
        </Field>
        <Field label="Empresa *" error={form.formState.errors.company_name?.message}>
          <Input {...form.register("company_name")} placeholder="Sua empresa" />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="E-mail corporativo *" error={form.formState.errors.email?.message}>
          <Input type="email" {...form.register("email")} placeholder="voce@empresa.com.br" />
        </Field>
        <Field label="WhatsApp *" error={form.formState.errors.whatsapp?.message}>
          <Input {...form.register("whatsapp")} placeholder="(11) 99999-9999" inputMode="tel" />
        </Field>
      </div>

      {!compact && (
        <>
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Segmento">
              <Select onValueChange={(v) => form.setValue("segment", v)} defaultValue="">
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ecommerce">E-commerce</SelectItem>
                  <SelectItem value="farma">Farmácia de manipulação</SelectItem>
                  <SelectItem value="drogaria">Drogaria</SelectItem>
                  <SelectItem value="correlatos">Correlatos</SelectItem>
                  <SelectItem value="cosmeticos">Cosméticos / dermo</SelectItem>
                  <SelectItem value="suplementos">Suplementos</SelectItem>
                  <SelectItem value="b2b">B2B / Distribuição</SelectItem>
                  <SelectItem value="marketplace">Marketplace</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field label="Volume mensal de entregas">
              <Select onValueChange={(v) => form.setValue("monthly_volume", v)} defaultValue="">
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1-50">Até 50/mês</SelectItem>
                  <SelectItem value="50-200">50 a 200/mês</SelectItem>
                  <SelectItem value="200-500">200 a 500/mês</SelectItem>
                  <SelectItem value="500-2000">500 a 2.000/mês</SelectItem>
                  <SelectItem value="2000+">Mais de 2.000/mês</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Região de atuação">
              <Input {...form.register("region")} placeholder="Ex: São Paulo capital, ABC..." />
            </Field>
            <Field label="Tipo de operação">
              <Select onValueChange={(v) => form.setValue("operation_type", v)} defaultValue="">
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="expressa">Expressa / Same-day</SelectItem>
                  <SelectItem value="programada">Coleta programada</SelectItem>
                  <SelectItem value="rota">Rota dedicada</SelectItem>
                  <SelectItem value="reversa">Logística reversa</SelectItem>
                  <SelectItem value="recorrente">Recorrente B2B</SelectItem>
                  <SelectItem value="mix">Combinação</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </>
      )}

      <Field label="Como podemos ajudar? *" error={form.formState.errors.message?.message}>
        <Textarea
          {...form.register("message")}
          rows={4}
          placeholder="Ex: tenho um e-commerce de cosméticos e preciso de operação com rastreamento e atendimento humano..."
        />
      </Field>

      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id="consent"
          onCheckedChange={(c) =>
            form.setValue("consent", c === true ? true : (undefined as never))
          }
        />
        <label htmlFor="consent" className="text-xs text-ink-600">
          Concordo com o tratamento dos meus dados conforme a{" "}
          <a href="/privacidade" className="text-spotorange-600 font-semibold underline">
            Política de Privacidade
          </a>{" "}
          para que a Spotlog entre em contato comigo.
        </label>
      </div>
      {form.formState.errors.consent && (
        <p className="text-xs text-destructive">{form.formState.errors.consent.message}</p>
      )}

      <Button
        type="submit"
        variant="orange"
        size="xl"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
        Solicitar proposta agora
        <ArrowRight className="h-5 w-5" />
      </Button>
    </form>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-navy-900">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
