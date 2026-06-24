import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Sparkles } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AssistantPanel } from "@/components/propostas/ia/assistant-panel";

export const dynamic = "force-dynamic";

export default async function ProposalIaEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const supabase = await createClient();

  const { data: prop } = await supabase
    .from("proposals")
    .select("id, number, title, intro_text, scope, status")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();

  if (!prop) notFound();

  const p = prop as unknown as {
    id: string;
    number: number;
    title: string;
    intro_text: string | null;
    scope: string | null;
    status: string;
  };

  return (
    <div className="space-y-6">
      <Link
        href={`/app/propostas/${p.id}`}
        className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1"
      >
        <ArrowLeft className="h-3 w-3" /> Voltar para a proposta
      </Link>

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <div className="text-xs text-muted-foreground">#{p.number}</div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-[#BA0102]" />
            Editor IA — {p.title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Reescreva blocos com 1 clique, gere follow-up e sugira itens.
          </p>
        </div>
      </div>

      <AssistantPanel
        proposalId={p.id}
        initialIntro={p.intro_text ?? ""}
        initialScope={p.scope ?? ""}
        proposalTitle={p.title}
      />
    </div>
  );
}
