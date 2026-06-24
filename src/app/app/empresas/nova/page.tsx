import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { CompanyForm } from "@/components/empresas/company-form";
import { FlashBanner } from "@/components/crm/flash-banner";
import { createCompany } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovaEmpresaPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSession();
  const { error } = await searchParams;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/empresas">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Nova empresa</h1>
          <p className="text-sm text-muted-foreground">
            Comece pelo CNPJ — clique em &quot;Buscar CNPJ&quot; e a gente
            preenche o resto automaticamente.
          </p>
        </div>
      </div>

      {error ? <FlashBanner type="error" message={error} /> : null}

      <CompanyForm
        action={createCompany}
        cancelHref="/app/empresas"
        submitLabel="Criar empresa"
      />
    </div>
  );
}
