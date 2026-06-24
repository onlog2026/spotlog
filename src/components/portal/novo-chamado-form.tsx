"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
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

export function NovoChamadoForm({
  companyId,
  organizationId,
}: {
  companyId: string;
  organizationId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("geral");
  const [priority, setPriority] = useState("normal");
  const [description, setDescription] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      toast.error("Preencha assunto e descrição.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          company_id: companyId,
          organization_id: organizationId,
          subject,
          category,
          priority,
          description,
        }),
      });
      const json = await res.json();
      if (!res.ok || json?.error) {
        toast.error(json?.error ?? "Erro ao abrir chamado.");
        return;
      }
      toast.success(`Chamado #${json.protocol} aberto!`);
      router.push("/portal/chamados");
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
        <Label>Assunto *</Label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Resumo curto do problema"
          required
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Categoria</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="geral">Geral</SelectItem>
              <SelectItem value="entrega">Entrega / Remessa</SelectItem>
              <SelectItem value="coleta">Coleta</SelectItem>
              <SelectItem value="financeiro">Financeiro</SelectItem>
              <SelectItem value="cadastro">Cadastro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Prioridade</Label>
          <Select value={priority} onValueChange={setPriority}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="high">Alta</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Descrição *</Label>
        <Textarea
          rows={6}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Descreva com detalhes o ocorrido, datas, números de remessa, etc."
          required
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
        Abrir chamado
      </Button>
    </form>
  );
}
