"use client";
import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  atualizarDocumentoAction,
  excluirDocumentoAction,
} from "@/app/app/compliance/actions";
import {
  DOC_STATUS_OPTIONS,
  DOC_TYPE_OPTIONS,
} from "@/components/compliance/badges";
import type { RegulatoryDocument } from "@/lib/queries/compliance";

export function EditarDocumentoForm({ doc }: { doc: RegulatoryDocument }) {
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  return (
    <div className="space-y-4">
      <form
        action={(formData) => {
          setError(null);
          startTransition(async () => {
            try {
              await atualizarDocumentoAction(formData);
            } catch (e) {
              setError(e instanceof Error ? e.message : "Erro ao salvar.");
            }
          });
        }}
        className="space-y-3"
      >
        <input type="hidden" name="id" value={doc.id} />
        <div className="grid md:grid-cols-2 gap-3">
          <div className="md:col-span-2">
            <label htmlFor="title" className="text-xs font-semibold">
              Título *
            </label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={doc.title}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="doc_type" className="text-xs font-semibold">
              Tipo *
            </label>
            <select
              id="doc_type"
              name="doc_type"
              required
              defaultValue={doc.doc_type}
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
              defaultValue={doc.status}
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
            <Input
              id="doc_number"
              name="doc_number"
              defaultValue={doc.doc_number ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="issuer" className="text-xs font-semibold">
              Órgão emissor
            </label>
            <Input
              id="issuer"
              name="issuer"
              defaultValue={doc.issuer ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor="issued_at" className="text-xs font-semibold">
              Emitido em
            </label>
            <Input
              id="issued_at"
              name="issued_at"
              type="date"
              defaultValue={doc.issued_at ?? ""}
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
              defaultValue={doc.expires_at ?? ""}
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
              defaultValue={doc.file_url ?? ""}
              className="mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <label htmlFor="notes" className="text-xs font-semibold">
              Observações
            </label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              defaultValue={doc.notes ?? ""}
              className="mt-1"
            />
          </div>
        </div>
        {error && (
          <p role="alert" className="text-xs text-spotorange-500">
            {error}
          </p>
        )}
        <div className="flex justify-end">
          <Button type="submit" variant="orange" size="sm" disabled={isPending}>
            {isPending ? "Salvando..." : "Salvar alterações"}
          </Button>
        </div>
      </form>

      <form
        action={(formData) => {
          if (
            !window.confirm(
              "Tem certeza? Esta ação não pode ser desfeita.",
            )
          )
            return;
          startDelete(async () => {
            await excluirDocumentoAction(formData);
          });
        }}
        className="border-t border-white/10 pt-4 flex justify-end"
      >
        <input type="hidden" name="id" value={doc.id} />
        <Button
          type="submit"
          variant="destructive"
          size="sm"
          disabled={isDeleting}
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Excluindo..." : "Excluir documento"}
        </Button>
      </form>
    </div>
  );
}
