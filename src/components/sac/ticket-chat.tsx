import { formatDateTime } from "@/lib/utils";
import type { TicketMessage } from "@/lib/types/operacao";

type Kind = "cliente" | "operador" | "sistema";

function MessageBubble({
  body,
  kind,
  createdAt,
}: {
  body: string;
  kind: Kind;
  createdAt: string;
}) {
  if (kind === "sistema") {
    return (
      <div
        className="flex justify-center my-2"
        aria-label="Evento do sistema"
      >
        <span className="text-[11px] italic text-muted-foreground bg-muted/50 rounded-full px-3 py-1">
          {body} · {formatDateTime(createdAt)}
        </span>
      </div>
    );
  }
  const isCliente = kind === "cliente";
  return (
    <div
      className={`flex ${isCliente ? "justify-end" : "justify-start"}`}
      aria-label={`Mensagem de ${kind}`}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
          isCliente
            ? "bg-[#BA0102] text-white rounded-br-sm"
            : "bg-white text-[#011960] border border-[#011960]/15 rounded-bl-sm"
        }`}
      >
        <div
          className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${
            isCliente ? "text-white/80" : "text-[#011960]/70"
          }`}
        >
          {isCliente ? "Cliente" : "Atendente"} · {formatDateTime(createdAt)}
        </div>
        <div className="whitespace-pre-wrap break-words">{body}</div>
      </div>
    </div>
  );
}

export function TicketChat({
  messages,
  emptyLabel = "Nenhuma mensagem ainda. Seja o primeiro a responder.",
}: {
  messages: TicketMessage[];
  emptyLabel?: string;
}) {
  return (
    <div
      className="flex-1 p-4 space-y-3 max-h-[60vh] overflow-y-auto bg-[#011960]/[0.02]"
      role="log"
      aria-live="polite"
      aria-label="Conversa do chamado"
    >
      {messages.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {emptyLabel}
        </p>
      ) : (
        messages.map((m) => (
          <MessageBubble
            key={m.id}
            body={m.body}
            kind={m.author_kind as Kind}
            createdAt={m.created_at}
          />
        ))
      )}
    </div>
  );
}
