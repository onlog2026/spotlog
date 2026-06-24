import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/leads/lead-form";
import { FlashBanner } from "@/components/crm/flash-banner";
import { createLead } from "../actions";

export const dynamic = "force-dynamic";

export default async function NovoLeadPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireSession();
  const { error } = await searchParams;

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/app/leads">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Novo lead</h1>
          <p className="text-sm text-muted-foreground">
            Cadastre manualmente um lead no funil.
          </p>
        </div>
      </div>

      {error ? <FlashBanner type="error" message={error} /> : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados do lead</CardTitle>
        </CardHeader>
        <CardContent>
          <LeadForm
            action={createLead}
            cancelHref="/app/leads"
            submitLabel="Criar lead"
          />
        </CardContent>
      </Card>
    </div>
  );
}
