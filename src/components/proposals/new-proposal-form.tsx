"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

type Item = {
  product_id?: string;
  name: string;
  description?: string;
  quantity: number;
  unit_price: number;
  discount_pct: number;
};

export function NewProposalForm({
  tables,
  contacts,
  companies,
}: {
  tables: Array<{ id: string; name: string; currency: string }>;
  contacts: Array<{ id: string; full_name: string; email: string | null }>;
  companies: Array<{ id: string; name: string }>;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price_table_id: tables[0]?.id ?? "",
    contact_id: "",
    company_id: "",
    intro_text: "",
    scope: "",
    payment_terms: "À vista no aceite, via PIX ou boleto.",
    delivery_terms: "Início em até 5 dias úteis após o aceite.",
    validity_days: 15,
    discount_pct: 0,
  });
  const [items, setItems] = useState<Item[]>([]);
  const [products, setProducts] = useState<
    Array<{ id: string; name: string; price: number; unit: string; description: string | null }>
  >([]);

  useEffect(() => {
    if (!form.price_table_id) return;
    (async () => {
      const sb = createClient();
      const { data } = await sb
        .from("products")
        .select("id, name, price, unit, description")
        .eq("price_table_id", form.price_table_id)
        .eq("is_active", true)
        .order("name");
      setProducts((data ?? []) as never);
    })();
  }, [form.price_table_id]);

  function addItem(productId?: string) {
    if (productId) {
      const p = products.find((x) => x.id === productId);
      if (!p) return;
      setItems([
        ...items,
        {
          product_id: p.id,
          name: p.name,
          description: p.description ?? undefined,
          quantity: 1,
          unit_price: Number(p.price),
          discount_pct: 0,
        },
      ]);
    } else {
      setItems([
        ...items,
        { name: "", quantity: 1, unit_price: 0, discount_pct: 0 },
      ]);
    }
  }

  function updateItem(i: number, patch: Partial<Item>) {
    setItems(items.map((it, idx) => (idx === i ? { ...it, ...patch } : it)));
  }

  function removeItem(i: number) {
    setItems(items.filter((_, idx) => idx !== i));
  }

  const subtotal = items.reduce(
    (acc, it) =>
      acc +
      it.quantity * it.unit_price * (1 - (it.discount_pct ?? 0) / 100),
    0,
  );
  const discountAmount = subtotal * (form.discount_pct / 100);
  const total = subtotal - discountAmount;

  async function submit() {
    if (!form.title || items.length === 0) {
      toast.error("Informe um título e adicione pelo menos 1 item.");
      return;
    }
    setLoading(true);
    const res = await fetch("/api/proposals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, items, subtotal, total }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Erro");
      return;
    }
    toast.success("Proposta criada!");
    router.push(`/app/propostas/${data.id}`);
  }

  return (
    <div className="space-y-6">
      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Título *</Label>
            <Input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Proposta comercial — Cliente Acme"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Contato</Label>
              <Select
                value={form.contact_id}
                onValueChange={(v) => setForm({ ...form, contact_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar contato" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum</SelectItem>
                  {contacts.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Empresa</Label>
              <Select
                value={form.company_id}
                onValueChange={(v) => setForm({ ...form, company_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar empresa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhuma</SelectItem>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Mensagem de abertura</Label>
            <Textarea
              value={form.intro_text}
              onChange={(e) => setForm({ ...form, intro_text: e.target.value })}
              rows={3}
              placeholder="Apresentação curta. Aparece no topo da proposta."
            />
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Itens</CardTitle>
            <div className="flex items-center gap-2">
              <Select
                value={form.price_table_id}
                onValueChange={(v) => setForm({ ...form, price_table_id: v })}
              >
                <SelectTrigger className="w-48 h-9 text-xs">
                  <SelectValue placeholder="Tabela" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select onValueChange={(v) => addItem(v)}>
                <SelectTrigger className="w-48 h-9 text-xs">
                  <SelectValue placeholder="+ Item da tabela" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} · {formatCurrency(Number(p.price))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="glass" size="sm" onClick={() => addItem()}>
                <Plus className="h-3 w-3" /> Manual
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length === 0 && (
            <div className="text-center py-8 text-sm text-muted-foreground">
              Nenhum item. Selecione da tabela ou adicione manualmente.
            </div>
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
                  onChange={(e) => updateItem(i, { name: e.target.value })}
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Label className="text-[10px]">Qtd</Label>
                <Input
                  type="number"
                  value={it.quantity}
                  onChange={(e) =>
                    updateItem(i, { quantity: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="col-span-5 sm:col-span-2">
                <Label className="text-[10px]">Preço un</Label>
                <Input
                  type="number"
                  value={it.unit_price}
                  onChange={(e) =>
                    updateItem(i, { unit_price: Number(e.target.value) || 0 })
                  }
                />
              </div>
              <div className="col-span-3 sm:col-span-2">
                <Label className="text-[10px]">Desc %</Label>
                <Input
                  type="number"
                  value={it.discount_pct}
                  onChange={(e) =>
                    updateItem(i, {
                      discount_pct: Number(e.target.value) || 0,
                    })
                  }
                />
              </div>
              <div className="col-span-1 flex justify-end">
                <Button variant="ghost" size="icon" onClick={() => removeItem(i)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          ))}

          <div className="pt-4 border-t border-white/10 flex justify-end">
            <div className="text-right space-y-1">
              <div className="text-xs text-muted-foreground">
                Subtotal: {formatCurrency(subtotal)}
              </div>
              <div className="flex items-center gap-2 justify-end">
                <Label className="text-xs">Desconto global (%)</Label>
                <Input
                  type="number"
                  value={form.discount_pct}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      discount_pct: Number(e.target.value) || 0,
                    })
                  }
                  className="w-20 h-8"
                />
              </div>
              <div className="text-2xl font-bold text-gradient">
                Total: {formatCurrency(total)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Termos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Pagamento</Label>
              <Textarea
                value={form.payment_terms}
                onChange={(e) =>
                  setForm({ ...form, payment_terms: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Entrega</Label>
              <Textarea
                value={form.delivery_terms}
                onChange={(e) =>
                  setForm({ ...form, delivery_terms: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Validade (dias)</Label>
            <Input
              type="number"
              value={form.validity_days}
              onChange={(e) =>
                setForm({ ...form, validity_days: Number(e.target.value) || 15 })
              }
              className="w-32"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button
          variant="gradient"
          size="lg"
          onClick={submit}
          disabled={loading}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar proposta
        </Button>
      </div>
    </div>
  );
}
