import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ContactForm } from "@/components/contatos/contact-form";
import { FlashBanner } from "@/components/crm/flash-banner";
import { getContact } from "@/lib/queries/contatos";
import { listCompanyOptions } from "@/lib/queries/empresas";
import { updateContact } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarContatoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const { error } = await searchParams;
  const [contact, companies] = await Promise.all([
    getContact(ctx.org.id, id),
    listCompanyOptions(ctx.org.id),
  ]);
  if (!contact) notFound();

  const action = updateContact.bind(null, id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/contatos/${id}`}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Editar contato</h1>
          <p className="text-sm text-muted-foreground">{contact.full_name}</p>
        </div>
      </div>

      {error ? <FlashBanner type="error" message={error} /> : null}

      <ContactForm
        action={action}
        defaults={{ ...contact, id }}
        companies={companies}
        cancelHref={`/app/contatos/${id}`}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
