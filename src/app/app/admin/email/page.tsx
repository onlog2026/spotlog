import { requireRole } from "@/lib/auth";
import { renderEmailLayout } from "@/lib/email/layout";
import { EmailTestForm } from "@/components/admin/email-test-form";

export const dynamic = "force-dynamic";

export default async function EmailLayoutPage() {
  await requireRole(["owner", "admin"]);

  const html = renderEmailLayout({
    heading: "Olá, Carlos",
    bodyHtml:
      "Você recebeu uma nova proposta da Spotlog. Preparamos as condições de frete e os prazos de entrega para a sua operação.",
    highlight: {
      label: "PROPOSTA #1042",
      title: "Logística Express — Same Day",
      subtitle: "Cobertura: 92 cidades · Prazo: D+1 a D+2",
    },
    ctaLabel: "Ver proposta",
    ctaUrl: "https://www.spotlog.com.br",
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Layout de e-mail</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          É assim que seus e-mails (propostas, avisos) chegam ao cliente — com a marca Spotlog.
          Envie um teste pra você ver na sua própria caixa.
        </p>
      </div>
      <div className="rounded-xl border border-white/10 overflow-hidden bg-white">
        <iframe
          title="Pré-visualização do e-mail"
          srcDoc={html}
          className="w-full"
          style={{ height: "640px", border: "0" }}
        />
      </div>
      <EmailTestForm />
    </div>
  );
}
