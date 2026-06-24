"use client";

import { cn } from "@/lib/utils";

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  pending?: boolean;
  cta?: {
    label: string;
    href: string;
    kind?: "convert" | "external" | "internal";
  } | null;
}

export function MessageBubble({
  message,
  onCtaClick,
}: {
  message: ChatMessage;
  onCtaClick?: (msg: ChatMessage) => void;
}) {
  const isUser = message.role === "user";
  if (message.role === "system") return null;
  return (
    <div className={cn("flex w-full", isUser ? "justify-end" : "justify-start")}>
      <div className="flex max-w-[88%] flex-col gap-2">
        <div
          className={cn(
            "rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm whitespace-pre-wrap break-words",
            isUser
              ? "bg-[#BA0102] text-white rounded-br-sm"
              : "bg-white text-[#011960] border border-[#011960]/15 rounded-bl-sm",
          )}
        >
          {message.content || (message.pending ? "..." : "")}
        </div>
        {message.cta && !isUser ? (
          <button
            type="button"
            onClick={() => onCtaClick?.(message)}
            className="self-start inline-flex items-center gap-1.5 rounded-full bg-[#011960] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#011960]/85 active:scale-[0.98]"
          >
            {message.cta.label}
            <span aria-hidden>→</span>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-sm border border-[#011960]/15 bg-white px-3.5 py-2.5 w-fit shadow-sm">
      <span className="size-1.5 rounded-full bg-[#011960]/60 animate-bounce [animation-delay:-0.3s]" />
      <span className="size-1.5 rounded-full bg-[#011960]/60 animate-bounce [animation-delay:-0.15s]" />
      <span className="size-1.5 rounded-full bg-[#011960]/60 animate-bounce" />
    </div>
  );
}
