"use client";
import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  Plus,
  TrendingUp,
  Calendar,
  User,
  Building2,
  Tag,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formatCurrency, formatDate, cn, initials } from "@/lib/utils";
import type {
  PipelineDeal,
  PipelineStage,
} from "@/lib/queries/pipeline";
import { DealDetailDrawer } from "./deal-detail-drawer";
import { CelebrationOverlay } from "@/components/celebration/confetti-and-fireworks";

type Props = {
  stages: PipelineStage[];
  deals: PipelineDeal[];
  pipelineName: string;
};

const PAGE_SIZE = 50;

export function KanbanBoard({ stages, deals: initial, pipelineName }: Props) {
  const [deals, setDeals] = useState<PipelineDeal[]>(initial);
  const [activeDealId, setActiveDealId] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [perStagePage, setPerStagePage] = useState<Record<string, number>>({});
  const [celebrating, setCelebrating] = useState<{ name: string } | null>(null);

  useEffect(() => setDeals(initial), [initial]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function dealsOf(stageId: string) {
    return deals
      .filter((d) => d.stage_id === stageId)
      .sort((a, b) => a.position - b.position);
  }

  function totalOf(stageId: string) {
    return dealsOf(stageId).reduce((acc, d) => acc + d.amount, 0);
  }

  async function moveDealToStage(dealId: string, targetStage: string) {
    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.stage_id === targetStage) return;

    const previous = deals;
    const optimistic = deals.map((d) =>
      d.id === dealId ? { ...d, stage_id: targetStage } : d,
    );
    setDeals(optimistic);

    try {
      const res = await fetch(`/api/deals/${dealId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stage_id: targetStage }),
      });
      if (!res.ok) throw new Error("move failed");
      const newStage = stages.find((s) => s.id === targetStage);
      if (newStage?.is_won) {
        toast.success(`🎉 Ganhou! ${deal.title}`);
        setCelebrating({ name: deal.title });
      } else if (newStage?.is_lost) {
        toast.info(`Perdido: ${deal.title}`);
      } else {
        toast.success(`Movido para ${newStage?.name ?? "novo estágio"}`);
      }
    } catch {
      setDeals(previous);
      toast.error("Não foi possível mover. Tente novamente.");
    }
  }

  async function onDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over) return;
    const dealId = String(active.id);
    const overId = String(over.id);

    const targetStage =
      stages.find((s) => s.id === overId)?.id ??
      deals.find((d) => d.id === overId)?.stage_id;
    if (!targetStage) return;

    await moveDealToStage(dealId, targetStage);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      {/* Mobile: lista por stage (sem drag-drop). Desktop: kanban horizontal. */}
      <div className="hidden lg:flex gap-4 overflow-x-auto pb-4 scrollbar-thin snap-x">
        {stages.map((stage) => {
          const list = dealsOf(stage.id);
          const page = perStagePage[stage.id] ?? 1;
          const visible = list.slice(0, page * PAGE_SIZE);
          return (
            <KanbanColumn
              key={stage.id}
              stage={stage}
              dealCount={list.length}
              totalValue={totalOf(stage.id)}
            >
              <SortableContext
                items={visible.map((d) => d.id)}
                strategy={verticalListSortingStrategy}
              >
                <DropZone stageId={stage.id} hasItems={list.length > 0}>
                  {visible.map((d) => (
                    <DealCard
                      key={d.id}
                      deal={d}
                      stage={stage}
                      stages={stages}
                      onOpen={() => setActiveDealId(d.id)}
                      onMove={(stageId) => moveDealToStage(d.id, stageId)}
                    />
                  ))}
                  {list.length > visible.length && (
                    <button
                      onClick={() =>
                        setPerStagePage((p) => ({
                          ...p,
                          [stage.id]: page + 1,
                        }))
                      }
                      className="w-full text-xs text-brand-400 hover:text-brand-300 py-2"
                    >
                      Mostrar mais ({list.length - visible.length})
                    </button>
                  )}
                </DropZone>
              </SortableContext>
            </KanbanColumn>
          );
        })}
      </div>

      {/* Mobile lista colapsável */}
      <div className="lg:hidden space-y-3">
        {stages.map((stage) => {
          const list = dealsOf(stage.id);
          const isCollapsed = collapsed[stage.id] ?? false;
          return (
            <div
              key={stage.id}
              className="rounded-xl border border-white/10 bg-card/40 overflow-hidden"
            >
              <button
                onClick={() =>
                  setCollapsed((c) => ({ ...c, [stage.id]: !c[stage.id] }))
                }
                className="w-full flex items-center gap-2 p-3 hover:bg-white/5 text-left"
              >
                <div
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ background: stage.color ?? "#6366f1" }}
                />
                <span className="text-sm font-semibold flex-1">{stage.name}</span>
                <span className="text-xs text-muted-foreground">
                  {list.length} · {formatCurrency(totalOf(stage.id))}
                </span>
                {isCollapsed ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronUp className="h-4 w-4" />
                )}
              </button>
              {!isCollapsed && (
                <div className="p-2 space-y-2 border-t border-white/5">
                  {list.length === 0 ? (
                    <div className="text-xs text-muted-foreground text-center py-6">
                      Nenhum deal neste estágio
                    </div>
                  ) : (
                    list.map((d) => (
                      <DealCard
                        key={d.id}
                        deal={d}
                        stage={stage}
                        stages={stages}
                        onOpen={() => setActiveDealId(d.id)}
                        onMove={(stageId) => moveDealToStage(d.id, stageId)}
                        draggable={false}
                      />
                    ))
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {activeDealId && (
        <DealDetailDrawer
          dealId={activeDealId}
          onClose={() => setActiveDealId(null)}
          pipelineName={pipelineName}
        />
      )}

      <CelebrationOverlay
        show={!!celebrating}
        leadName={celebrating?.name}
        onDone={() => setCelebrating(null)}
      />
    </DndContext>
  );
}

function KanbanColumn({
  stage,
  dealCount,
  totalValue,
  children,
}: {
  stage: PipelineStage;
  dealCount: number;
  totalValue: number;
  children: React.ReactNode;
}) {
  const tone = stage.is_won
    ? "from-emerald-500/80 to-emerald-400/30"
    : stage.is_lost
      ? "from-red-600/80 to-red-400/30"
      : "from-brand-500/80 to-brand-400/30";
  return (
    <div className="min-w-[320px] w-[320px] flex flex-col snap-start">
      <div className="mb-3 px-1">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ background: stage.color ?? "#6366f1" }}
            />
            <span className="text-sm font-semibold truncate">{stage.name}</span>
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 leading-none"
            >
              {dealCount}
            </Badge>
          </div>
          <Button variant="ghost" size="icon" className="h-6 w-6" asChild>
            <Link
              href={`/app/pipeline/novo?stage=${stage.id}`}
              aria-label="Novo deal neste estágio"
            >
              <Plus className="h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
          <TrendingUp className="h-3 w-3" />
          {formatCurrency(totalValue)}
        </div>
        <div
          className={cn(
            "h-1 rounded-full bg-gradient-to-r",
            tone,
          )}
          style={{ background: stage.color ?? undefined }}
        />
      </div>
      {children}
    </div>
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
  const { setNodeRef, isOver } = useDroppable({ id: stageId });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex-1 min-h-[400px] space-y-2 p-2 rounded-lg border transition-colors",
        isOver
          ? "bg-brand-500/10 border-brand-500/40"
          : "bg-card/30 border-white/5",
      )}
    >
      {children}
      {!hasItems && (
        <div className="text-xs text-muted-foreground text-center py-10 border-2 border-dashed border-white/5 rounded-lg">
          Arraste deals pra cá
        </div>
      )}
    </div>
  );
}

function DealCard({
  deal,
  stage,
  stages,
  onOpen,
  onMove,
  draggable = true,
}: {
  deal: PipelineDeal;
  stage: PipelineStage;
  stages: PipelineStage[];
  onOpen: () => void;
  onMove?: (stageId: string) => void;
  draggable?: boolean;
}) {
  const sortable = useSortable({ id: deal.id, disabled: !draggable });
  const sorted = useMemo(
    () => [...stages].sort((a, b) => a.position - b.position),
    [stages],
  );
  const currentIndex = sorted.findIndex((s) => s.id === stage.id);
  const prevStage = currentIndex > 0 ? sorted[currentIndex - 1] : null;
  const nextStage = currentIndex < sorted.length - 1 ? sorted[currentIndex + 1] : null;
  const style = draggable
    ? {
        transform: CSS.Transform.toString(sortable.transform),
        transition: sortable.transition,
        opacity: sortable.isDragging ? 0.4 : 1,
      }
    : undefined;

  const overdue =
    deal.expected_close_date &&
    new Date(deal.expected_close_date) < new Date() &&
    !stage.is_won &&
    !stage.is_lost;

  return (
    <Card
      ref={draggable ? sortable.setNodeRef : undefined}
      style={style}
      onClick={(e) => {
        // Não abrir drawer se clicou no grip
        const t = e.target as HTMLElement;
        if (t.closest("[data-drag-handle]")) return;
        onOpen();
      }}
      className={cn(
        "border-white/10 bg-card hover:bg-card/80 transition-colors group cursor-pointer",
        overdue && "border-red-500/30",
      )}
    >
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start gap-1.5">
          {draggable && (
            <button
              {...sortable.attributes}
              {...sortable.listeners}
              data-drag-handle
              aria-label="Arrastar"
              className="opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing pt-0.5"
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <div className="text-sm font-medium line-clamp-2 leading-snug">
              {deal.title}
            </div>
            {deal.company_name && (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5">
                <Building2 className="h-3 w-3 shrink-0" />
                <span className="truncate">{deal.company_name}</span>
              </div>
            )}
            {deal.contact_name && (
              <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3 shrink-0" />
                <span className="truncate">{deal.contact_name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
            <Badge
              variant="outline"
              className="text-[10px] px-1.5 py-0 h-4 leading-none"
              title="Probabilidade deste negócio"
            >
              {deal.probability ?? stage.probability}%
            </Badge>
            {deal.source && (
              <Badge
                variant="secondary"
                className="text-[10px] px-1.5 py-0 h-4 leading-none"
              >
                <Tag className="h-2.5 w-2.5 mr-0.5" />
                {deal.source}
              </Badge>
            )}
          </div>
          <span className="text-sm font-semibold text-emerald-400 shrink-0">
            {formatCurrency(deal.amount, deal.currency)}
          </span>
        </div>

        <div className="flex items-center justify-between text-[10px]">
          {deal.expected_close_date ? (
            <div
              className={cn(
                "flex items-center gap-1",
                overdue
                  ? "text-red-400 font-semibold"
                  : "text-muted-foreground",
              )}
            >
              <Calendar className="h-3 w-3" />
              {formatDate(deal.expected_close_date)}
              {overdue && " · atrasado"}
            </div>
          ) : (
            <span />
          )}
          {deal.owner_name && (
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[8px] bg-gradient-brand text-white">
                {initials(deal.owner_name)}
              </AvatarFallback>
            </Avatar>
          )}
        </div>

        {/* Setas pra mover entre etapas */}
        {onMove && (prevStage || nextStage) && (
          <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/10">
            {prevStage ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(prevStage.id);
                }}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-spotorange-500 hover:bg-spotorange-50 dark:hover:bg-spotorange-500/10 rounded px-1.5 py-0.5 transition-colors"
                title={`Mover para ${prevStage.name}`}
              >
                <ChevronLeft className="h-3 w-3" />
                <span className="max-w-[60px] truncate">{prevStage.name}</span>
              </button>
            ) : (
              <span />
            )}
            {nextStage ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onMove(nextStage.id);
                }}
                className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-spotorange-500 hover:bg-spotorange-50 dark:hover:bg-spotorange-500/10 rounded px-1.5 py-0.5 transition-colors"
                title={`Mover para ${nextStage.name}`}
              >
                <span className="max-w-[60px] truncate">{nextStage.name}</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            ) : (
              <span />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
