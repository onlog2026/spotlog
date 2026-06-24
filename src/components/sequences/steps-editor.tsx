"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mail, MessageCircle, Clock, Trash2, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Step = {
  id?: string;
  position: number;
  kind: string;
  wait_days: number;
  wait_hours: number;
  subject: string | null;
  body: string | null;
};

export function SequenceStepsEditor({
  sequenceId,
  defaultChannel,
  initialSteps,
}: {
  sequenceId: string;
  defaultChannel: "email" | "whatsapp";
  initialSteps: Step[];
}) {
  const router = useRouter();
  const [steps, setSteps] = useState<Step[]>(initialSteps);
  const [saving, setSaving] = useState(false);

  function add(kind: string) {
    setSteps([
      ...steps,
      {
        position: steps.length,
        kind,
        wait_days: kind === "wait" ? 1 : 0,
        wait_hours: 0,
        subject: kind === "email" ? "Assunto da mensagem" : null,
        body:
          kind === "email"
            ? "Olá {{first_name}},\n\n... seu texto base ..."
            : kind === "whatsapp"
              ? "Oi {{first_name}}! Tudo bem? ..."
              : null,
      },
    ]);
  }

  function update(i: number, patch: Partial<Step>) {
    setSteps(steps.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }

  function remove(i: number) {
    setSteps(steps.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, position: idx })));
  }

  async function save() {
    setSaving(true);
    const res = await fetch(`/api/sequences/${sequenceId}/steps`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ steps }),
    });
    setSaving(false);
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      toast.error(e.error ?? "Erro ao salvar");
      return;
    }
    toast.success("Passos salvos!");
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {steps.length === 0 && (
        <div className="text-center py-8 text-sm text-muted-foreground">
          Sem passos ainda. Adicione abaixo.
        </div>
      )}

      {steps.map((s, i) => (
        <div
          key={i}
          className="rounded-lg border border-white/10 bg-card p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-brand text-white text-xs font-bold">
                {i + 1}
              </div>
              <Select
                value={s.kind}
                onValueChange={(v) => update(i, { kind: v })}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">
                    <Mail className="h-3 w-3 inline mr-1" /> E-mail
                  </SelectItem>
                  <SelectItem value="whatsapp">
                    <MessageCircle className="h-3 w-3 inline mr-1" /> WhatsApp
                  </SelectItem>
                  <SelectItem value="wait">
                    <Clock className="h-3 w-3 inline mr-1" /> Espera
                  </SelectItem>
                  <SelectItem value="manual_task">Tarefa manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="ghost" size="icon" onClick={() => remove(i)}>
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Esperar (dias)</Label>
              <Input
                type="number"
                value={s.wait_days}
                onChange={(e) =>
                  update(i, { wait_days: Number(e.target.value) || 0 })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Esperar (horas adicionais)</Label>
              <Input
                type="number"
                value={s.wait_hours}
                onChange={(e) =>
                  update(i, { wait_hours: Number(e.target.value) || 0 })
                }
              />
            </div>
          </div>

          {s.kind === "email" && (
            <div className="space-y-1.5">
              <Label className="text-xs">Assunto</Label>
              <Input
                value={s.subject ?? ""}
                onChange={(e) => update(i, { subject: e.target.value })}
              />
            </div>
          )}

          {(s.kind === "email" || s.kind === "whatsapp") && (
            <div className="space-y-1.5">
              <Label className="text-xs">
                Mensagem · use variáveis{" "}
                <code className="text-[10px] bg-card-foreground/10 px-1 rounded">
                  {"{{first_name}}"}
                </code>{" "}
                <code className="text-[10px] bg-card-foreground/10 px-1 rounded">
                  {"{{company}}"}
                </code>
              </Label>
              <Textarea
                rows={6}
                value={s.body ?? ""}
                onChange={(e) => update(i, { body: e.target.value })}
              />
            </div>
          )}
        </div>
      ))}

      <div className="flex flex-wrap gap-2 pt-2">
        <Button variant="outline" size="sm" onClick={() => add(defaultChannel)}>
          <Plus className="h-3 w-3" /> {defaultChannel === "email" ? "E-mail" : "WhatsApp"}
        </Button>
        <Button variant="outline" size="sm" onClick={() => add("wait")}>
          <Plus className="h-3 w-3" /> Espera
        </Button>
        <Button variant="outline" size="sm" onClick={() => add("manual_task")}>
          <Plus className="h-3 w-3" /> Tarefa
        </Button>
        <div className="flex-1" />
        <Button variant="orange" onClick={save} disabled={saving}>
          <Save className="h-4 w-4" /> Salvar
        </Button>
      </div>
    </div>
  );
}
