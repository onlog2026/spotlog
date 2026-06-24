import { SiteCardForm } from "@/components/cms/site-card-form";
import { criarCard } from "../actions";

export default function NovoCardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Novo card</h2>
        <p className="text-sm text-muted-foreground">
          Cadastre um novo card editável de qualquer página pública.
        </p>
      </div>
      <SiteCardForm action={criarCard} submitLabel="Criar card" />
    </div>
  );
}
