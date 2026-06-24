"use client";
import { useRef, useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { responderTicketAction } from "@/app/app/sac/actions";

export function ReplyForm({ ticketId }: { ticketId: string }) {
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
            await responderTicketAction(formData);
            formRef.current?.reset();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Erro ao enviar.");
          }
        });
      }}
      className="space-y-3 border-t border-white/10 bg-card/80 p-4 backdrop-blur"
    >
      <input type="hidden" name="ticket_id" value={ticketId} />
      <Textarea
        name="body"
        placeholder="Escreva uma resposta ao cliente..."
        required
        minLength={1}
        rows={3}
        aria-label="Mensagem de resposta"
      />
      {error && (
        <p role="alert" className="text-xs text-spotorange-500">
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
          {isPending ? "Enviando..." : "Responder"}
        </Button>
      </div>
    </form>
  );
}
