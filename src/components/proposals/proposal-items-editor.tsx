"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/utils";

type Item = {
  product_id?: string | null;
  name: string;
  description?: string | null;
  quantity: number;
  unit_price: number;
  discount_pct: number;
};

export function ProposalItemsEditor({
  proposalId,
  initialItems,
  initialDiscountPct,
  readOnly,
}: {
  proposalId: string;
  initialItems: Item[];
  initialDiscountPct: number;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const [items, setItems] = useState<Item[]>(
    initialItems.length > 0
      ? initialItems
      : [{ name: "", quantity: 1, unit_price: 0, discount_pct: 0 }],
  );
  const [discountPct, setDiscountPct] = useState(initialDiscountPct);
  const [saving, setSaving] = useState(false);

  function updateItem(i: number, patch: Partial<Item>) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems([...items, { name: "", quantity: 1, unit_price: 0, discount_pct: 0 }]);
  }
  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  const subtotal = items.reduce(
    (acc, it) => acc + it.quantity * it.unit_price * (1 - (it.discount_pct ?? 0) / 100),
    0,
  );
  const total = subtotal * (1 - discountPct / 100);

  async function save() {
    const validItems = items.filter((it) => it.name.trim());
    if (validItems.length === 0) {
      toast.error("Adicione pelo menos 1 item com nome.");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/proposals/${proposalId}/items`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: validItems, discount_pct: discountPct }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      toast.error(data.error ?? "Erro ao salvar itens.");
      return;
    }
    toast.success("Itens salvos — total atualizado.");
    router.refresh();
  }

  return (
    <Card className="border-white/10 bg-card/50">
      <CardHeader>
        <CardTitle>Itens</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {readOnly && (
          <p className="text-xs text-amber-500 mb-2">
            Proposta já aceita pelo cliente — itens não podem mais ser editados.
          </p>
        )}
        {items.map((it, i) => (
          <div
            key={i}
            className="grid grid-cols-12 gap-2 items-end border-b border-white/5 pb-3"
          >
            <div className="col-span-12 sm:col-span-5">
              <Label className="text-[10px]">Item</Label>
              <Input
                value={it.name}
                disabled={readOnly}
                onChange={(e) => updateItem(i, { name: e.target.value })}
              />
            </div>
            <div className="col-span-3 sm:col-span-2">
              <Label className="text-[10px]">Qtd</Label>
              <Input
                type="number"
                value={it.quantity}
                disabled={readOnly}
                onChange={(e) => updateItem(i, { quantity: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-5 sm:col-span-2">
              <Label className="text-[10px]">Preço un</Label>
              <Input
                type="number"
                value={it.unit_price}
                disabled={readOnly}
                onChange={(e) => updateItem(i, { unit_price: Number(e.target.value) || 0 })}
              />
            </div>
            <div className="col-span-3 sm:col-span-2">
              <Label className="text-[10px]">Desc %</Label>
              <Input
                type="number"
                value={it.discount_pct}
                disabled={readOnly}
                onChange={(e) => updateItem(i, { discount_pct: Number(e.target.value) || 0 })}
              />
            </div>
            {!readOnly && (
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </div>
        ))}

        {!readOnly && (
          <Button variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-3 w-3" /> Adicionar item
          </Button>
        )}

        <div className="pt-4 border-t border-white/10 flex flex-col items-end gap-1">
          <div className="text-xs text-muted-foreground">
            Subtotal: {formatCurrency(subtotal)}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-xs">Desconto global (%)</Label>
            <Input
              type="number"
              value={discountPct}
              disabled={readOnly}
              onChange={(e) => setDiscountPct(Number(e.target.value) || 0)}
              className="w-20 h-8"
            />
          </div>
          <div className="text-2xl font-bold text-gradient">
            Total: {formatCurrency(total)}
          </div>
        </div>

        {!readOnly && (
          <div className="flex justify-end pt-2">
            <Button variant="orange" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Salvar itens
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
