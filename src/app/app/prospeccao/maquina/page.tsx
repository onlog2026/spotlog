import Link from "next/link";
import { ArrowLeft, Zap } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { MaquinaForm } from "@/components/prospeccao/maquina-form";

export const dynamic = "force-dynamic";
// A busca instantânea roda síncrona ao criar — precisa de tempo.
export const maxDuration = 60;

export default async function MaquinaDeLeadsPage() {
  await requireSession();

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/app/prospeccao"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Prospecção
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <Zap className="h-6 w-6 text-brand-400" />
          Máquina de Leads
        </h1>
        <p className="text-muted-foreground mt-1">
          Diga o que buscar e onde. A máquina varre o Google Maps, entra no
          site de cada empresa e traz e-mail, telefone, WhatsApp e redes
          sociais — tudo sozinha.
        </p>
      </div>
      <MaquinaForm />
    </div>
  );
}
