"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Trash2 } from "lucide-react";
import { duplicateForm, deleteForm } from "@/app/app/admin/forms/actions";
import { Button } from "@/components/ui/button";

export function FormActions({ formId, formTitle }: { formId: string; formTitle: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const newId = await duplicateForm(formId);
            router.push(`/app/admin/forms/${newId}/editor`);
          })
        }
        title="Duplicar"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        disabled={pending}
        onClick={() => {
          if (
            confirm(
              `Excluir o formulario "${formTitle}"? Todas as respostas tambem serao removidas.`,
            )
          ) {
            start(async () => {
              await deleteForm(formId);
              router.refresh();
            });
          }
        }}
        title="Excluir"
      >
        <Trash2 className="h-3.5 w-3.5 text-red-400" />
      </Button>
    </div>
  );
}
