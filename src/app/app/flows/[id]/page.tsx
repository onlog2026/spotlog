import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { FlowStatusToggle } from "@/components/flows/flow-actions";
import { FlowCanvas } from "@/components/flows/flow-canvas";
import { TriggerEditor } from "@/components/flows/trigger-editor";

export const dynamic = "force-dynamic";

type FlowFull = {
  id: string;
  name: string;
  status: "draft" | "active" | "paused";
  trigger_type: string;
  trigger_config: { keywords?: unknown; catch_all?: unknown } | null;
  graph: { nodes?: unknown[]; edges?: unknown[] } | null;
};

export default async function FlowEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await requireSession();
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase
    // @ts-expect-error tabela nova fora dos types gerados
    .from("flows")
    .select("id, name, status, trigger_type, trigger_config, graph")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!data) notFound();
  const flow = data as unknown as FlowFull;
  const nodeCount = flow.graph?.nodes?.length ?? 0;
  const kwRaw = flow.trigger_config?.keywords;
  const keywords = Array.isArray(kwRaw)
    ? (kwRaw as unknown[]).map((k) => String(k))
    : typeof kwRaw === "string"
      ? kwRaw.split(",").map((s) => s.trim()).filter(Boolean)
      : [];
  const catchAll = flow.trigger_config?.catch_all === true;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/app/flows"
          className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-3"
        >
          <ArrowLeft className="h-3 w-3" /> Fluxos
        </Link>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl md:text-3xl font-bold">{flow.name}</h1>
          <FlowStatusToggle id={flow.id} status={flow.status} />
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Gatilho: {flow.trigger_type} · {nodeCount} bloco(s) · arraste os blocos da
          esquerda, ligue-os e clique em <strong>Salvar fluxo</strong>.
        </p>
      </div>

      <TriggerEditor
        flowId={flow.id}
        keywords={keywords}
        catchAll={catchAll}
      />

      <FlowCanvas flowId={flow.id} graph={flow.graph} />
    </div>
  );
}
