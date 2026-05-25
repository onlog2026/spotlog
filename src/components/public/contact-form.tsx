"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
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
  email: z.string().email("E-mail inválido"),
  whatsapp: z.string().min(10, "Informe seu WhatsApp"),
  company_name: z.string().min(2, "Informe a empresa"),
  job_title: z.string().optional(),
  team_size: z.string().optional(),
  message: z.string().min(10, "Conta um pouco do que precisa"),
  consent: z.literal(true, {
    errorMap: () => ({ message: "Precisamos do seu consentimento (LGPD)" }),
  }),
});

type FormValues = z.infer<typeof schema>;

export function ContactForm() {
  const [done, setDone] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { consent: undefined as unknown as true },
  });

  async function onSubmit(values: FormValues) {
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
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Erro");
      setDone(true);
      toast.success("Recebemos seu contato. Vamos responder em até 1 dia útil.");
      form.reset();
    } catch (e) {
      toast.error(
        e instanceof Error
          ? e.message
          : "Não foi possível enviar agora. Tente de novo em alguns minutos.",
      );
    }
  }

  if (done) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15">
          <CheckCircle2 className="h-8 w-8 text-emerald-400" />
        </div>
        <h3 className="text-xl font-bold">Recebemos! 🎉</h3>
        <p className="text-sm text-muted-foreground max-w-sm mx-auto">
          Em até 1 dia útil um especialista entra em contato pelo WhatsApp ou
          e-mail informado.
        </p>
        <Button
          variant="glass"
          onClick={() => setDone(false)}
          className="mt-2"
        >
          Enviar outra mensagem
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="Nome completo *"
          error={form.formState.errors.full_name?.message}
        >
          <Input {...form.register("full_name")} placeholder="Maria Silva" />
        </Field>
        <Field
          label="E-mail corporativo *"
          error={form.formState.errors.email?.message}
        >
          <Input
            type="email"
            {...form.register("email")}
            placeholder="maria@empresa.com.br"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field
          label="WhatsApp *"
          error={form.formState.errors.whatsapp?.message}
        >
          <Input
            {...form.register("whatsapp")}
            placeholder="(11) 99999-9999"
            inputMode="tel"
          />
        </Field>
        <Field
          label="Empresa *"
          error={form.formState.errors.company_name?.message}
        >
          <Input
            {...form.register("company_name")}
            placeholder="Sua empresa"
          />
        </Field>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Cargo">
          <Input {...form.register("job_title")} placeholder="Diretor comercial" />
        </Field>
        <Field label="Tamanho do time de vendas">
          <Select
            onValueChange={(v) => form.setValue("team_size", v)}
            defaultValue=""
          >
            <SelectTrigger>
              <SelectValue placeholder="Selecione" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Só eu</SelectItem>
              <SelectItem value="2-5">2 a 5</SelectItem>
              <SelectItem value="6-15">6 a 15</SelectItem>
              <SelectItem value="16-50">16 a 50</SelectItem>
              <SelectItem value="50+">Mais de 50</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>

      <Field
        label="O que você quer resolver? *"
        error={form.formState.errors.message?.message}
      >
        <Textarea
          {...form.register("message")}
          rows={4}
          placeholder="Quero automatizar a prospecção pra meu time de SDR..."
        />
      </Field>

      <div className="flex items-start gap-2 pt-2">
        <Checkbox
          id="consent"
          onCheckedChange={(c) =>
            form.setValue("consent", c === true ? true : (undefined as never))
          }
        />
        <label htmlFor="consent" className="text-xs text-muted-foreground">
          Concordo com o tratamento dos meus dados conforme a{" "}
          <a href="/privacidade" className="text-brand-400 underline">
            Política de Privacidade
          </a>{" "}
          pra que a Spotlog entre em contato.
        </label>
      </div>
      {form.formState.errors.consent && (
        <p className="text-xs text-destructive">
          {form.formState.errors.consent.message}
        </p>
      )}

      <Button
        type="submit"
        variant="gradient"
        size="lg"
        className="w-full"
        disabled={form.formState.isSubmitting}
      >
        {form.formState.isSubmitting && (
          <Loader2 className="h-4 w-4 animate-spin" />
        )}
        Enviar mensagem
      </Button>
    </form>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
