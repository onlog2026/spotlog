import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { NewCampaignForm } from "@/components/prospeccao/new-campaign-form";

export const dynamic = "force-dynamic";

export default async function NovaCampanhaPage() {
  await requireSession();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/app/prospeccao"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Campanhas
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold">Nova campanha</h1>
        <p className="text-muted-foreground mt-1">
          Use BrasilAPI (gratuita) pra enriquecer uma lista de CNPJs, filtre o
          banco de empresas por segmento, ou cole uma lista de domínios.
        </p>
      </div>
      <NewCampaignForm />
    </div>
  );
}
