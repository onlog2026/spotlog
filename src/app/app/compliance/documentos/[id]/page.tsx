import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireSession } from "@/lib/auth";
import { getRegulatoryDocument } from "@/lib/queries/compliance";
import { EditarDocumentoForm } from "@/components/compliance/editar-documento-form";

export const dynamic = "force-dynamic";

export default async function DocumentoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { org } = await requireSession();
  const { id } = await params;
  const doc = await getRegulatoryDocument(org.id, id);
  if (!doc) notFound();

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link href="/app/compliance/documentos" aria-label="Voltar">
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </Button>
        <div>
          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
            Documento
          </p>
          <h2 className="text-xl font-bold">{doc.title}</h2>
        </div>
      </div>

      <Card className="border-transparent bg-card/50">
        <CardHeader>
          <CardTitle className="text-base">Editar documento</CardTitle>
        </CardHeader>
        <CardContent>
          <EditarDocumentoForm doc={doc} />
        </CardContent>
      </Card>
    </div>
  );
}
