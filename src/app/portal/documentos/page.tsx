import { FileText } from "lucide-react";
import { requireClientSession } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function DocumentosPage() {
  await requireClientSession();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <FileText className="h-6 w-6" /> Documentos
        </h1>
        <p className="text-muted-foreground">
          Contratos, faturas e comprovantes
        </p>
      </div>

      <Card>
        <CardContent className="p-12 text-center text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          Nenhum documento publicado pela sua transportadora ainda.
        </CardContent>
      </Card>
    </div>
  );
}
