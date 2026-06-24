import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ExternalLink, MessageSquare, Share2 } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { getFormByIdForAdmin } from "@/lib/forms/queries";
import { FormEditor } from "@/components/admin/forms/form-editor";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function FormEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const ctx = await requireSession();
  const form = await getFormByIdForAdmin(id, ctx.org.id);
  if (!form) notFound();

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/app/admin/forms"
            className="text-muted-foreground hover:text-foreground"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">{form.definition.title}</h1>
            <p className="text-xs text-muted-foreground font-mono">/forms/{form.definition.slug}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href={`/forms/${form.definition.slug}`} target="_blank">
              <ExternalLink className="h-3.5 w-3.5" />
              Preview publico
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/admin/forms/${id}/submissions`}>
              <MessageSquare className="h-3.5 w-3.5" />
              Respostas
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href={`/app/admin/forms/${id}/embed`}>
              <Share2 className="h-3.5 w-3.5" />
              Embed / Link
            </Link>
          </Button>
        </div>
      </div>

      <FormEditor formId={id} initialDefinition={form.definition} initialFields={form.fields} />
    </div>
  );
}
