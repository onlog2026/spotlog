"use client";

import { useState, useTransition } from "react";
import { createForm } from "@/app/app/admin/forms/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export function NewFormClient() {
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [leadSource, setLeadSource] = useState("site");
  const [leadSourceDetail, setLeadSourceDetail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const finalSlug = slug || slugify(title);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError("Informe um titulo");
      return;
    }
    start(async () => {
      try {
        await createForm({
          title: title.trim(),
          slug: finalSlug || undefined,
          description: description.trim() || undefined,
          lead_source: leadSource.trim() || "site",
          lead_source_detail: leadSourceDetail.trim() || undefined,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar");
      }
    });
  }

  return (
    <form onSubmit={submit} className="space-y-5 bg-card/50 border border-white/10 rounded-2xl p-6">
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 p-3 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label>Titulo *</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Ex: Solicitar proposta"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Slug (URL publica)</Label>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-mono">/forms/</span>
          <Input
            value={slug}
            onChange={(e) => setSlug(slugify(e.target.value))}
            placeholder={slugify(title) || "solicitar-proposta"}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          Se vazio, gera automatico do titulo. URL final:{" "}
          <span className="font-mono">/forms/{finalSlug || "..."}</span>
        </p>
      </div>

      <div className="space-y-2">
        <Label>Descricao</Label>
        <Textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Texto curto exibido acima do formulario."
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Lead source</Label>
          <Input
            value={leadSource}
            onChange={(e) => setLeadSource(e.target.value)}
            placeholder="site"
          />
          <p className="text-[11px] text-muted-foreground">
            Valor salvo em leads.source.
          </p>
        </div>
        <div className="space-y-2">
          <Label>Lead source detail</Label>
          <Input
            value={leadSourceDetail}
            onChange={(e) => setLeadSourceDetail(e.target.value)}
            placeholder="landing-x, campanha-y..."
          />
        </div>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="submit" variant="orange" disabled={pending}>
          {pending && <Loader2 className="h-4 w-4 animate-spin" />}
          Criar e abrir editor
        </Button>
      </div>
    </form>
  );
}
