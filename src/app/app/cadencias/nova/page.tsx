"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

export default function NovaCadenciaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    default_channel: "email",
    ai_prompt:
      "Você é o SDR da Acme. Tom direto, gentil, sem floreios. Cite um insight específico do segmento do contato. Termine com convite pra reunião de 15 min.",
  });

  async function submit() {
    setLoading(true);
    const res = await fetch("/api/sequences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      toast.error(data.error ?? "Erro");
      return;
    }
    toast.success("Cadência criada!");
    router.push(`/app/cadencias/${data.id}`);
    router.refresh();
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold">Nova cadência</h1>
        <p className="text-muted-foreground mt-1">
          Depois você adiciona os passos (e-mail, WhatsApp, esperas, tasks).
        </p>
      </div>

      <Card className="border-white/10 bg-card/50">
        <CardHeader>
          <CardTitle>Identificação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Nome *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Outbound diretor de vendas SaaS"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Descrição</Label>
            <Textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Canal principal</Label>
            <Select
              value={form.default_channel}
              onValueChange={(v) => setForm({ ...form, default_channel: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">E-mail</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">
              Prompt do agente (orienta a IA na hora de personalizar)
            </Label>
            <Textarea
              value={form.ai_prompt}
              onChange={(e) => setForm({ ...form, ai_prompt: e.target.value })}
              rows={5}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="ghost" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button variant="gradient" onClick={submit} disabled={loading || !form.name}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar cadência
        </Button>
      </div>
    </div>
  );
}
