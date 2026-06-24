import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contatos/contact-form";
import { FlashBanner } from "@/components/crm/flash-banner";
import { listCompanyOptions } from "@/lib/queries/empresas";
import { createContact } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoContatoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; company_id?: string }>;
}) {
  const ctx = await requireSession();
  const { error, company_id } = await searchParams;
  const companies = await listCompanyOptions(ctx.org.id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/contatos">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Novo contato</h1>
          <p className="text-sm text-muted-foreground">
            Adicione uma pessoa ao seu CRM. Comece pelo e-mail — se já existir,
            podemos reaproveitar.
          </p>
        </div>
      </div>

      {error ? <FlashBanner type="error" message={error} /> : null}

      <ContactForm
        action={createContact}
        companies={companies}
        defaults={{ company_id: company_id ?? null }}
        cancelHref="/app/contatos"
        submitLabel="Criar contato"
      />
    </div>
  );
}
