import { CaseForm } from "@/components/cms/case-form";
import { criarCase } from "../../actions";

export default function NovoCasePage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Novo case</h2>
        <p className="text-sm text-muted-foreground">Conte o desafio, a solução e os resultados. Adicione KPIs pra dar prova.</p>
      </div>
      <CaseForm action={criarCase} submitLabel="Criar case" />
    </div>
  );
}
