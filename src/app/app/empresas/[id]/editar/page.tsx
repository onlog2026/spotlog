import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/components/empresas/company-form";
import { FlashBanner } from "@/components/crm/flash-banner";
import { getCompany } from "@/lib/queries/empresas";
import { updateCompany } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarEmpresaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const { error } = await searchParams;
  const company = await getCompany(ctx.org.id, id);
  if (!company) notFound();

  const action = updateCompany.bind(null, id);

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/empresas/${id}`}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Editar empresa</h1>
          <p className="text-sm text-muted-foreground">{company.name}</p>
        </div>
      </div>

      {error ? <FlashBanner type="error" message={error} /> : null}

      <CompanyForm
        action={action}
        defaults={company}
        cancelHref={`/app/empresas/${id}`}
        submitLabel="Salvar alterações"
      />
    </div>
  );
}
