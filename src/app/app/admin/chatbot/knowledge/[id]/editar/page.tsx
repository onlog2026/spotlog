import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { getKnowledgeById } from "@/lib/queries/chatbot";
import { KbForm } from "@/components/admin/chatbot/kb-form";

export const dynamic = "force-dynamic";

export default async function EditKnowledgePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireSession();
  const { id } = await params;
  const entry = await getKnowledgeById(id);
  if (!entry) notFound();

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Editar entrada</h2>
      <KbForm
        initial={{
          id: entry.id,
          category: entry.category,
          question: entry.question,
          answer: entry.answer,
          keywords: entry.keywords,
          priority: entry.priority,
          active: entry.active,
        }}
      />
    </div>
  );
}
