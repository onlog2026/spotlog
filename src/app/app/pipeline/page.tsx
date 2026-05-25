import Link from "next/link";
import { Plus, KanbanSquare } from "lucide-react";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { PipelineBoard } from "@/components/crm/pipeline-board";

export const dynamic = "force-dynamic";

export default async function PipelinePage() {
  const ctx = await requireSession();
  const supabase = await createClient();

  // Encontrar pipeline default
  const { data: pipeline } = await supabase
    .from("pipelines")
    .select("id, name")
    .eq("organization_id", ctx.org.id)
    .eq("is_default", true)
    .maybeSingle();

  if (!pipeline) {
    return <NoPipeline />;
  }

  const [{ data: stages }, { data: deals }] = await Promise.all([
    supabase
      .from("pipeline_stages")
      .select("id, name, position, color, probability, is_won, is_lost")
      .eq("pipeline_id", (pipeline as { id: string }).id)
      .order("position"),
    supabase
      .from("deals")
      .select(
        "id, title, amount, currency, stage_id, owner_id, contact_id, company_id, position, expected_close_date, status",
      )
      .eq("organization_id", ctx.org.id)
      .eq("status", "open")
      .order("position"),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Pipeline</h1>
          <p className="text-muted-foreground mt-1">
            {(pipeline as { name: string }).name} ·{" "}
            {deals?.length ?? 0} oportunidades em aberto
          </p>
        </div>
        <Button variant="gradient" asChild>
          <Link href="/app/pipeline/novo">
            <Plus className="h-4 w-4" />
            Novo deal
          </Link>
        </Button>
      </div>

      <PipelineBoard
        stages={(stages ?? []) as never}
        deals={(deals ?? []) as never}
      />
    </div>
  );
}

function NoPipeline() {
  return (
    <div className="text-center py-24 max-w-md mx-auto">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-gradient-brand/15 mb-4">
        <KanbanSquare className="h-7 w-7 text-brand-400" />
      </div>
      <h3 className="font-semibold text-lg">Pipeline não criado</h3>
      <p className="text-sm text-muted-foreground mt-1 mb-6">
        Algo deu errado ao criar o pipeline padrão. Recrie executando o
        comando no SQL Editor do Supabase:
        <br />
        <code className="text-xs bg-card mt-2 inline-block px-2 py-1 rounded">
          select public.seed_default_pipeline(&apos;SEU_ORG_ID&apos;);
        </code>
      </p>
    </div>
  );
}
