"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Megaphone } from "lucide-react";
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

type Audience = "all_clients" | "all_orgs" | "specific_company" | "specific_org";

export function BroadcastForm({
  organizations,
  companies,
}: {
  organizations: Array<{ id: string; name: string }>;
  companies: Array<{ id: string; name: string; organization_id: string }>;
}) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Audience>("all_clients");
  const [targetOrg, setTargetOrg] = useState<string>("");
  const [targetCompany, setTargetCompany] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const filteredCompanies = useMemo(() => {
    if (audience !== "specific_company") return companies;
    return companies;
  }, [audience, companies]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      toast.error("Título e mensagem obrigatórios.");
      return;
    }
    if (audience === "specific_company" && !targetCompany) {
      toast.error("Selecione a empresa alvo.");
      return;
    }
    if (audience === "specific_org" && !targetOrg) {
      toast.error("Selecione a transportadora alvo.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/portal/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          audience,
          target_company_id: audience === "specific_company" ? targetCompany : null,
          target_organization_id: audience === "specific_org" ? targetOrg : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json?.error ?? "Erro ao enviar broadcast.");
        return;
      }
      toast.success("Broadcast enviado!");
      setTitle("");
      setBody("");
      setTargetOrg("");
      setTargetCompany("");
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
        <Label className="text-white">Título *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Manutenção programada — sábado às 02h"
          required
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-white">Mensagem *</Label>
        <Textarea
          rows={6}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Conteúdo completo do aviso. Suporta quebras de linha."
          required
          className="bg-white/5 border-white/10 text-white"
        />
      </div>
      <div className="space-y-2">
        <Label className="text-white">Audiência *</Label>
        <div className="grid sm:grid-cols-2 gap-2">
          {(
            [
              { v: "all_clients", l: "Todos os clientes do sistema" },
              { v: "all_orgs", l: "Todas as transportadoras (admins)" },
              { v: "specific_company", l: "Cliente específico" },
              { v: "specific_org", l: "Transportadora específica" },
            ] as Array<{ v: Audience; l: string }>
          ).map((opt) => (
            <label
              key={opt.v}
              className={`flex items-center gap-2 rounded-md border p-3 text-sm cursor-pointer ${
                audience === opt.v
                  ? "border-red-500 bg-red-500/10 text-white"
                  : "border-white/10 hover:bg-white/5 text-white/80"
              }`}
            >
              <input
                type="radio"
                name="audience"
                value={opt.v}
                checked={audience === opt.v}
                onChange={() => setAudience(opt.v)}
              />
              {opt.l}
            </label>
          ))}
        </div>
      </div>

      {audience === "specific_org" && (
        <div className="space-y-1.5">
          <Label className="text-white">Transportadora</Label>
          <Select value={targetOrg} onValueChange={setTargetOrg}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {organizations.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {audience === "specific_company" && (
        <div className="space-y-1.5">
          <Label className="text-white">Empresa cliente</Label>
          <Select value={targetCompany} onValueChange={setTargetCompany}>
            <SelectTrigger className="bg-white/5 border-white/10 text-white">
              <SelectValue placeholder="Selecione..." />
            </SelectTrigger>
            <SelectContent>
              {filteredCompanies.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full bg-[#BA0102] hover:bg-[#a00001] text-white"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <Megaphone className="h-4 w-4 mr-1" />
        )}
        Enviar broadcast
      </Button>
    </form>
  );
}
