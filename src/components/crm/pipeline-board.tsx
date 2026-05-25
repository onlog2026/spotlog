"use client";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Plus, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";

type Stage = {
  id: string;
  name: string;
  position: number;
  color: string | null;
  probability: number;
  is_won: boolean;
  is_lost: boolean;
};
type Deal = {
  id: string;
  title: string;
  amount: number;
  currency: string;
  stage_id: string;
  position: number;
  expected_close_date: string | null;
};

export function PipelineBoard({
  stages: initialStages,
  deals: initialDeals,
}: {
  stages: Stage[];
  deals: Deal[];
}) {
  const [stages] = useState(initialStages);
  const [deals, setDeals] = useState(initialDeals);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  function dealsOf(stage: string) {
    return deals
      .filter((d) => d.stage_id === stage)
      .sort((a, b) => a.position - b.position);
  }

  function totalOf(stage: string) {
    return dealsOf(stage).reduce((acc, d) => acc + Number(d.amount), 0);
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const dealId = String(active.id);
    const overId = String(over.id);

    // overId pode ser ID de stage (drop em coluna vazia) ou de deal
    const targetStage =
      stages.find((s) => s.id === overId)?.id ??
      deals.find((d) => d.id === overId)?.stage_id;
    if (!targetStage) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === targetStage) return;

    const optimistic = deals.map((d) =>
      d.id === dealId ? { ...d, stage_id: targetStage } : d,
    );
    setDeals(optimistic);

    const res = await fetch(`/api/deals/${dealId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_id: targetStage }),
    });
    if (!res.ok) {
      setDeals(deals);
      toast.error("Não foi possível mover.");
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {stages.map((stage) => {
          const stageDeals = dealsOf(stage.id);
          return (
            <div
              key={stage.id}
              className="min-w-[300px] w-[300px] flex flex-col"
            >
              <div className="mb-3 px-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: stage.color ?? "#6366f1" }}
                    />
                    <span className="text-sm font-semibold">{stage.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {stageDeals.length}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6">
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  {formatCurrency(totalOf(stage.id))}
                </div>
              </div>

              <SortableContext
                items={stageDeals.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <DropZone stageId={stage.id} hasItems={stageDeals.length > 0}>
                  {stageDeals.map((d) => (
                    <DealCard key={d.id} deal={d} stage={stage} />
                  ))}
                </DropZone>
              </SortableContext>
            </div>
          );
        })}
      </div>
    </DndContext>
  );
}

function DropZone({
  stageId,
  hasItems,
  children,
}: {
  stageId: string;
  hasItems: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      id={stageId}
      className="flex-1 min-h-[400px] space-y-2 p-2 rounded-lg bg-card/30 border border-white/5"
    >
      {children}
      {!hasItems && (
        <div className="text-xs text-muted-foreground text-center py-12">
          Arraste deals pra cá
        </div>
      )}
    </div>
  );
}

function DealCard({ deal, stage }: { deal: Deal; stage: Stage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: deal.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="border-white/10 bg-card hover:bg-card/80 transition-colors group"
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-1.5">
          <button
            {...attributes}
            {...listeners}
            className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing"
          >
            <GripVertical className="h-3 w-3 text-muted-foreground" />
          </button>
          <Link
            href={`/app/pipeline/${deal.id}`}
            className="flex-1 text-sm font-medium hover:underline line-clamp-2"
          >
            {deal.title}
          </Link>
        </div>
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-[10px]">
            {stage.probability}%
          </Badge>
          <span className="text-sm font-semibold text-emerald-400">
            {formatCurrency(Number(deal.amount), deal.currency)}
          </span>
        </div>
        {deal.expected_close_date && (
          <div className="text-[10px] text-muted-foreground">
            Fecha {formatDate(deal.expected_close_date)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
