import { requireSession } from "@/lib/auth";
import { KbForm } from "@/components/admin/chatbot/kb-form";
import { listUnanswered } from "@/lib/queries/chatbot";

export const dynamic = "force-dynamic";

export default async function NewKnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string }>;
}) {
  await requireSession();
  const sp = await searchParams;

  let initialQuestion = "";
  let fromUnansweredId: string | undefined;

  if (sp.from) {
    const items = await listUnanswered(false);
    const found = items.find((u) => u.id === sp.from);
    if (found) {
      initialQuestion = found.question;
      fromUnansweredId = found.id;
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Nova entrada de conhecimento</h2>
      </div>
      {fromUnansweredId ? (
        <p className="text-xs text-spotorange-300">
          Respondendo pergunta capturada do chatbot — ao salvar ela será marcada como resolvida.
        </p>
      ) : null}
      <KbForm
        initial={{ question: initialQuestion }}
        fromUnansweredId={fromUnansweredId}
      />
    </div>
  );
}
