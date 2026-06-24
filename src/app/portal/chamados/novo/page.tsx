import { Headphones } from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { NovoChamadoForm } from "@/components/portal/novo-chamado-form";

export const dynamic = "force-dynamic";

export default async function NovoChamadoPage() {
  const ctx = await requireClientSession();
  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <Headphones className="h-6 w-6" /> Novo chamado
        </h1>
        <p className="text-muted-foreground">
          Vai pra equipe de suporte da {ctx.organization.name}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Descreva sua solicitação</CardTitle>
        </CardHeader>
        <CardContent>
          <NovoChamadoForm
            companyId={ctx.company.id}
            organizationId={ctx.organization.id}
          />
        </CardContent>
      </Card>
    </div>
  );
}
