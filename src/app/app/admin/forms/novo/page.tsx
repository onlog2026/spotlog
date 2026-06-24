import { NewFormClient } from "@/components/admin/forms/new-form-client";
import { requireSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function NewFormPage() {
  await requireSession();
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Novo formulario</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Comece com as informacoes basicas. Depois adicione os campos no editor visual.
        </p>
      </div>
      <NewFormClient />
    </div>
  );
}
