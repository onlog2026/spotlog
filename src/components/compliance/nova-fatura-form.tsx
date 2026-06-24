"use client";
import { useMemo, useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { criarFaturaAction } from "@/app/app/compliance/actions";

type Company = { id: string; name: string };
type Shipment = { id: string; code: string };

type Item = {
  key: number;
  description: string;
  quantity: number;
  unit_price: number;
  shipment_id: string;
};

let nextKey = 1;
function newItem(): Item {
  return {
    key: nextKey++,
    description: "",
    quantity: 1,
    unit_price: 0,
    shipment_id: "none",
  };
}

function formatBRL(v: number) {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function NovaFaturaForm({
  companies,
  shipments,
}: {
  companies: Company[];
  shipments: Shipment[];
}) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Item[]>(() => [newItem()]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const total = useMemo(
    () => items.reduce((acc, it) => acc + it.quantity * it.unit_price, 0),
    [items],
  );

  if (!open) {
    return (
      <Button
        type="button"
        variant="orange"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" /> Nova fatura
      </Button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await criarFaturaAction(formData);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Erro ao salvar.");
          }
        });
      }}
      className="space-y-4 rounded-xl border border-white/10 bg-card/60 p-4"
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <label htmlFor="company_id" className="text-xs font-semibold">
            Empresa *
          </label>
          <select
            id="company_id"
            name="company_id"
            required
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">Selecione...</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="number" className="text-xs font-semibold">
            Número *
          </label>
          <Input id="number" name="number" required className="mt-1" />
        </div>
        <div>
          <label htmlFor="competence" className="text-xs font-semibold">
            Competência
          </label>
          <Input
            id="competence"
            name="competence"
            type="date"
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="due_date" className="text-xs font-semibold">
            Vencimento
          </label>
          <Input id="due_date" name="due_date" type="date" className="mt-1" />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="notes" className="text-xs font-semibold">
            Observações
          </label>
          <Textarea id="notes" name="notes" rows={2} className="mt-1" />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Itens da fatura *</h4>
          <Button
            type="button"
            size="sm"
            variant="soft"
            onClick={() => setItems((prev) => [...prev, newItem()])}
          >
            <Plus className="h-3 w-3" /> Adicionar item
          </Button>
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div
              key={it.key}
              className="grid grid-cols-1 md:grid-cols-12 gap-2 items-end rounded-lg border border-white/10 bg-background/40 p-3"
            >
              <div className="md:col-span-5">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Descrição
                </label>
                <Input
                  name="item_description"
                  required
                  value={it.description}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, description: e.target.value } : p,
                      ),
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-3">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Remessa (opcional)
                </label>
                <select
                  name="item_shipment_id"
                  value={it.shipment_id}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p, i) =>
                        i === idx ? { ...p, shipment_id: e.target.value } : p,
                      ),
                    )
                  }
                  className="mt-1 h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                >
                  <option value="none">—</option>
                  {shipments.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.code}
                    </option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-1">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Qtde
                </label>
                <Input
                  name="item_quantity"
                  type="number"
                  min={1}
                  step={1}
                  value={it.quantity}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p, i) =>
                        i === idx
                          ? { ...p, quantity: Number(e.target.value) || 1 }
                          : p,
                      ),
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Preço unit.
                </label>
                <Input
                  name="item_unit_price"
                  type="number"
                  min={0}
                  step={0.01}
                  value={it.unit_price}
                  onChange={(e) =>
                    setItems((prev) =>
                      prev.map((p, i) =>
                        i === idx
                          ? { ...p, unit_price: Number(e.target.value) || 0 }
                          : p,
                      ),
                    )
                  }
                  className="mt-1"
                />
              </div>
              <div className="md:col-span-1 flex justify-end">
                {items.length > 1 && (
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    aria-label="Remover item"
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2 text-sm">
          <div className="rounded-lg border border-white/10 bg-background/40 px-4 py-2">
            <span className="text-muted-foreground text-xs mr-2">Total</span>
            <span className="font-bold text-navy-900 dark:text-white">
              {formatBRL(total)}
            </span>
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs text-spotorange-500">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
        <Button type="submit" variant="orange" size="sm" disabled={isPending}>
          {isPending ? "Salvando..." : "Criar fatura"}
        </Button>
      </div>
    </form>
  );
}
