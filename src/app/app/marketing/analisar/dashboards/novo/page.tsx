import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { DashboardBuilder } from "@/components/marketing/analisar/dashboard-builder";
import { saveDashboardForm } from "../../actions";

export const dynamic = "force-dynamic";

export default function NovoDashboardPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        href="/app/marketing/analisar/dashboards"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> Voltar
      </Link>
      <div>
        <h2 className="text-xl font-bold">Novo dashboard</h2>
        <p className="text-sm text-muted-foreground">
          Adicione widgets pra montar seu painel. Você pode editar depois.
        </p>
      </div>

      <form action={saveDashboardForm}>
        <DashboardBuilder />
      </form>
    </div>
  );
}
