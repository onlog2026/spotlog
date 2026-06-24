import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/leads/lead-form";
import { FlashBanner } from "@/components/crm/flash-banner";
import { getLead } from "@/lib/queries/leads";
import { updateLead } from "../../actions";

export const dynamic = "force-dynamic";

export default async function EditarLeadPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const { error } = await searchParams;
  const lead = await getLead(ctx.org.id, id);
  if (!lead) notFound();

  const action = updateLead.bind(null, id);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/app/leads/${id}`}>
            <ArrowLeft className="h-4 w-4" /> Voltar
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Editar lead</h1>
          <p className="text-sm text-muted-foreground">
            {lead.full_name ?? "(sem nome)"}
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
            action={action}
            defaults={lead}
            cancelHref={`/app/leads/${id}`}
            submitLabel="Salvar alterações"
          />
        </CardContent>
      </Card>
    </div>
  );
}
