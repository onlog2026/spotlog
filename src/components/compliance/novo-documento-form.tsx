"use client";
import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { criarDocumentoAction } from "@/app/app/compliance/actions";
import {
  DOC_STATUS_OPTIONS,
  DOC_TYPE_OPTIONS,
} from "@/components/compliance/badges";

export function NovoDocumentoForm() {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        type="button"
        variant="orange"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Plus className="h-4 w-4" /> Novo documento
      </Button>
    );
  }

  return (
    <form
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await criarDocumentoAction(formData);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Erro ao salvar.");
          }
        });
      }}
      className="space-y-3 rounded-xl border border-white/10 bg-card/60 p-4"
    >
      <div className="grid md:grid-cols-2 gap-3">
        <div className="md:col-span-2">
          <label htmlFor="title" className="text-xs font-semibold">
            Título *
          </label>
          <Input id="title" name="title" required className="mt-1" />
        </div>
        <div>
          <label htmlFor="doc_type" className="text-xs font-semibold">
            Tipo *
          </label>
          <select
            id="doc_type"
            name="doc_type"
            required
            defaultValue="contrato_cliente"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {DOC_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="text-xs font-semibold">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue="vigente"
            className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
          >
            {DOC_STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="doc_number" className="text-xs font-semibold">
            Número
          </label>
          <Input id="doc_number" name="doc_number" className="mt-1" />
        </div>
        <div>
          <label htmlFor="issuer" className="text-xs font-semibold">
            Órgão emissor
          </label>
          <Input id="issuer" name="issuer" className="mt-1" />
        </div>
        <div>
          <label htmlFor="issued_at" className="text-xs font-semibold">
            Emitido em
          </label>
          <Input
            id="issued_at"
            name="issued_at"
            type="date"
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="expires_at" className="text-xs font-semibold">
            Validade
          </label>
          <Input
            id="expires_at"
            name="expires_at"
            type="date"
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="file_url" className="text-xs font-semibold">
            Link do arquivo
          </label>
          <Input
            id="file_url"
            name="file_url"
            type="url"
            placeholder="https://..."
            className="mt-1"
          />
        </div>
        <div className="md:col-span-2">
          <label htmlFor="notes" className="text-xs font-semibold">
            Observações
          </label>
          <Textarea id="notes" name="notes" rows={2} className="mt-1" />
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
          {isPending ? "Salvando..." : "Salvar documento"}
        </Button>
      </div>
    </form>
  );
}
