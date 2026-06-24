import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { CaseForm } from "@/components/cms/case-form";
import { getCaseAdmin } from "@/lib/queries/cms";
import { atualizarCase, excluirCase } from "../../../actions";

export default async function EditarCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await requireSession();
  const item = await getCaseAdmin(ctx.org.id, id);
  if (!item) notFound();

  const updateAction = atualizarCase.bind(null, item.id);
  const deleteAction = excluirCase.bind(null, item.id);

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold">Editar case</h2>
        <p className="text-sm text-muted-foreground">
          /{item.slug} · atualizado em {new Date(item.updated_at).toLocaleString("pt-BR")}
        </p>
      </div>
      <CaseForm initial={item} action={updateAction} excluirAction={deleteAction} submitLabel="Salvar alterações" />
    </div>
  );
}
