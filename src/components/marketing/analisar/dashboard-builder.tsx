"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, BarChart3, Hash, Table2, Filter as FunnelIcon } from "lucide-react";

type WidgetKind = "kpi" | "chart" | "table" | "funnel";
type Source = "leads" | "deals" | "tickets" | "revenue";

type Widget = {
  widget: WidgetKind;
  source: Source;
  title: string;
};

const WIDGET_ICON: Record<WidgetKind, React.ComponentType<{ className?: string }>> = {
  kpi: Hash,
  chart: BarChart3,
  table: Table2,
  funnel: FunnelIcon,
};

export function DashboardBuilder() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [draft, setDraft] = useState<Widget>({ widget: "kpi", source: "leads", title: "" });

  function add() {
    if (!draft.title.trim()) return;
    setWidgets((w) => [...w, draft]);
    setDraft({ widget: "kpi", source: "leads", title: "" });
  }

  function remove(i: number) {
    setWidgets((w) => w.filter((_, idx) => idx !== i));
  }

  return (
    <div className="space-y-4">
      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-4 space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="d_name">Nome do dashboard *</Label>
              <Input id="d_name" name="name" required placeholder="Ex: Visão geral semanal" />
            </div>
            <div>
              <Label htmlFor="d_desc">Descrição</Label>
              <Input id="d_desc" name="description" placeholder="Opcional" />
            </div>
          </div>
          <label className="inline-flex items-center gap-2 text-sm">
            <input type="checkbox" name="is_default" className="accent-[#BA0102]" />
            Tornar este meu dashboard padrão
          </label>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Adicionar widget</h3>
          <div className="grid sm:grid-cols-4 gap-2">
            <select
              value={draft.widget}
              onChange={(e) => setDraft({ ...draft, widget: e.target.value as WidgetKind })}
              className="h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm"
            >
              <option value="kpi">KPI</option>
              <option value="chart">Gráfico</option>
              <option value="table">Tabela</option>
              <option value="funnel">Funil</option>
            </select>
            <select
              value={draft.source}
              onChange={(e) => setDraft({ ...draft, source: e.target.value as Source })}
              className="h-9 px-2 rounded-md bg-card/80 border border-white/10 text-sm"
            >
              <option value="leads">Leads</option>
              <option value="deals">Negócios</option>
              <option value="tickets">Tickets</option>
              <option value="revenue">Receita</option>
            </select>
            <Input
              placeholder="Título do widget"
              value={draft.title}
              onChange={(e) => setDraft({ ...draft, title: e.target.value })}
              className="sm:col-span-2"
            />
          </div>
          <Button
            type="button"
            onClick={add}
            disabled={!draft.title.trim()}
            className="bg-[#011960] hover:bg-[#011960]/80 text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Adicionar
          </Button>
        </CardContent>
      </Card>

      {widgets.length > 0 && (
        <Card className="border-white/10 bg-card/50">
          <CardContent className="p-4">
            <h3 className="text-sm font-semibold mb-3">Layout ({widgets.length} widgets)</h3>
            <div className="grid sm:grid-cols-2 gap-2">
              {widgets.map((w, i) => {
                const Icon = WIDGET_ICON[w.widget];
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-3 border border-white/10 rounded-md bg-card/80"
                  >
                    <Icon className="h-4 w-4 text-[#BA0102] flex-none" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{w.title}</p>
                      <p className="text-[11px] text-muted-foreground">
                        {w.widget} · {w.source}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Textarea
        name="layout_json"
        readOnly
        value={JSON.stringify(widgets)}
        className="hidden"
      />

      <div className="flex justify-end">
        <Button type="submit" className="bg-[#BA0102] hover:bg-[#a10002] text-white">
          Salvar dashboard
        </Button>
      </div>
    </div>
  );
}
