import Link from "next/link";
import { Plus, KanbanSquare } from "lucide-react";
import { requireOrgModule } from "@/lib/entitlements";
import { Button } from "@/components/ui/button";
import { KanbanBoard } from "@/components/pipeline/kanban-board";
import { PipelineSummary } from "@/components/pipeline/pipeline-summary";
import { PipelineFilters } from "@/components/pipeline/pipeline-filters";
import { MarkSeenOnMount } from "@/components/notifications/mark-seen-on-mount";
import {
  getDealOwnersForOrg,
  getDealsForPipeline,
  getOrCreateDefaultPipeline,
  getPipelineConversionStats,
  getPipelineStages,
} from "@/lib/queries/pipeline";

export const dynamic = "force-dynamic";

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const ctx = await requireOrgModule("pipeline"); // Eixo A — neutro enquanto enforcement OFF
  const sp = await searchParams;

  const pipeline = await getOrCreateDefaultPipeline(ctx.org.id);
  if (!pipeline) return <NoPipeline />;

  const filters = {
    ownerId: typeof sp.owner === "string" ? sp.owner : undefined,
    source: typeof sp.source === "string" ? sp.source : undefined,
    minAmount:
      typeof sp.min === "string" && sp.min ? Number(sp.min) : undefined,
    fromDate: typeof sp.from === "string" ? sp.from : undefined,
    toDate: typeof sp.to === "string" ? sp.to : undefined,
    q: typeof sp.q === "string" ? sp.q : undefined,
  };

  const [stages, deals, owners, conversionStats] = await Promise.all([
    getPipelineStages(ctx.org.id, pipeline.id),
    getDealsForPipeline(ctx.org.id, pipeline.id, filters),
    getDealOwnersForOrg(ctx.org.id),
    getPipelineConversionStats(ctx.org.id, pipeline.id),
  ]);

  const sources = Array.from(
    new Set(deals.map((d) => d.source).filter((s): s is string => !!s)),
  );

  return (
    <div className="space-y-6">
      <MarkSeenOnMount module="deals" />

      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
            <KanbanSquare className="h-7 w-7 text-brand-400" />
            Pipeline
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {pipeline.name} · {deals.length} oportunidades em aberto
          </p>
        </div>
        <Button variant="orange" asChild>
          <Link href="/app/pipeline/novo">
            <Plus className="h-4 w-4" />
            Novo deal
          </Link>
        </Button>
      </div>

      <PipelineSummary stages={stages} deals={deals} conversionStats={conversionStats} />

      <PipelineFilters owners={owners} sources={sources} />

      {stages.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          Pipeline sem estágios. Configure em <code>/app/admin</code>.
        </div>
      ) : (
        <KanbanBoard
          stages={stages}
          deals={deals}
          pipelineName={pipeline.name}
        />
      )}
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
        Não conseguimos criar o pipeline padrão automaticamente. Tente recarregar
        ou execute manualmente no SQL Editor do Supabase:
      </p>
      <code className="text-xs bg-card mt-2 inline-block px-2 py-1 rounded">
        select public.seed_default_pipeline(&apos;SEU_ORG_ID&apos;);
      </code>
    </div>
  );
}
