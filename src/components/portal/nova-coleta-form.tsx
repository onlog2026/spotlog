"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function NovaColetaForm({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    address: "",
    window_start: "",
    window_end: "",
    volumes: "1",
    weight_kg: "",
    notes: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.address.trim() || !form.window_start) {
      toast.error("Endereço e janela inicial obrigatórios.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/pickups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          organization_id: organizationId,
          ...form,
          volumes: Number(form.volumes) || 1,
          weight_kg: form.weight_kg ? Number(form.weight_kg) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.error) {
        toast.error(json?.error ?? "Erro ao solicitar coleta.");
        return;
      }
      toast.success("Coleta solicitada! Vamos confirmar em breve.");
      router.push("/portal");
      router.refresh();
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="space-y-1.5">
        <Label>Endereço de coleta *</Label>
        <Textarea
          rows={2}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          placeholder="Rua, número, bairro, cidade/UF, CEP, ponto de referência"
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Janela início *</Label>
          <Input
            type="datetime-local"
            value={form.window_start}
            onChange={(e) => setForm({ ...form, window_start: e.target.value })}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label>Janela fim</Label>
          <Input
            type="datetime-local"
            value={form.window_end}
            onChange={(e) => setForm({ ...form, window_end: e.target.value })}
          />
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Volumes</Label>
          <Input
            type="number"
            min={1}
            value={form.volumes}
            onChange={(e) => setForm({ ...form, volumes: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Peso total (kg)</Label>
          <Input
            type="number"
            step="0.1"
            value={form.weight_kg}
            onChange={(e) => setForm({ ...form, weight_kg: e.target.value })}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Observações</Label>
        <Textarea
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Algo que a equipe deveria saber?"
        />
      </div>
      <Button
        type="submit"
        variant="orange"
        size="lg"
        className="w-full"
        disabled={loading}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
        Solicitar coleta
      </Button>
    </form>
  );
}
