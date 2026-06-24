import { PackagePlus } from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NovaColetaForm } from "@/components/portal/nova-coleta-form";

export const dynamic = "force-dynamic";

export default async function NovaColetaPage() {
  const ctx = await requireClientSession();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <PackagePlus className="h-6 w-6" /> Solicitar nova coleta
        </h1>
        <p className="text-muted-foreground">
          Sua solicitação vai pra equipe operacional da {ctx.organization.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da coleta</CardTitle>
        </CardHeader>
        <CardContent>
          <NovaColetaForm
            companyId={ctx.company.id}
            organizationId={ctx.organization.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
