"use client";
import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { clienteResponderTicketAction } from "@/app/app/cliente/actions";

export function ChamadoReplyForm({ protocol }: { protocol: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <form
      ref={formRef}
      action={(formData) => {
        setError(null);
        startTransition(async () => {
          try {
            await clienteResponderTicketAction(formData);
            formRef.current?.reset();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Erro ao enviar.");
          }
        });
      }}
      className="space-y-3 border-t border-white/10 bg-card/80 p-4 backdrop-blur"
      aria-label="Responder ao chamado"
    >
      <input type="hidden" name="protocol" value={protocol} />
      <Textarea
        name="body"
        placeholder="Digite sua resposta..."
        required
        minLength={1}
        rows={3}
        aria-label="Mensagem para o atendente"
      />
      {error && (
        <p role="alert" className="text-xs text-[#BA0102]">
          {error}
        </p>
      )}
      <div className="flex items-center justify-end gap-2">
        <Button
          type="submit"
          variant="orange"
          size="sm"
          disabled={isPending}
          aria-label="Enviar resposta"
        >
          <Send className="h-4 w-4" />
          {isPending ? "Enviando..." : "Enviar resposta"}
        </Button>
      </div>
    </form>
  );
}
