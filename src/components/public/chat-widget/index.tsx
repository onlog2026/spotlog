"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { MessageCircle, Send, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MessageBubble,
  TypingIndicator,
  type ChatMessage,
} from "./message-bubble";
import { QuickReplies, type QuickReply } from "./quick-replies";
import { LeadForm, type LeadFormValues } from "./lead-form";

const TOKEN_KEY = "spotlog.chatbot.token.v1";
const CONSENT_KEY = "spotlog.chatbot.consent.v1";
const GREETING_ID = "greeting";

// Portal de rastreio self-service (Octatracking com o logo da Spotlog).
const RASTREIO_URL =
  "https://octatracking.com.br/prerastreio?logo=aHR0cHM6Ly9zaXN0ZW1hLnNwb3Rsb2cuY29tLmJyL2ltYWdlcy9zcG90bG9nL2xvZ29zL2xvZ282MDEtNDA2LnBuZw==";

type ChatbotIntent =
  | "cotacao"
  | "rastreio"
  | "suporte"
  | "info_produto"
  | "contratar"
  | "saudacao"
  | "outro";

type CTA = {
  label: string;
  href: string;
  kind?: "convert" | "external" | "internal";
};

const GREETING: ChatMessage = {
  id: GREETING_ID,
  role: "assistant",
  content:
    "Oi! Aqui é a Bia, da Spotlog 😊 Me conta: é sobre um pedido que já está a caminho, ou você quer conhecer/orçar um serviço com a gente?",
};

const INITIAL_QUICK_REPLIES: QuickReply[] = [
  { label: "Meu pedido / status da entrega", value: "pedido" },
  { label: "Deu atraso no meu pedido", value: "atraso" },
  { label: "Quero contratar / orçar um serviço", value: "comercial" },
  { label: "Como a Spotlog funciona?", value: "funciona" },
];

const QUICK_REPLY_TEXT: Record<string, string> = {
  pedido: "Quero saber o status do meu pedido",
  atraso: "Meu pedido está atrasado, o que faço?",
  comercial: "Quero contratar/orçar um serviço da Spotlog",
  funciona: "Como a Spotlog funciona?",
};

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function ChatWidget() {
  const [mounted, setMounted] = useState(false);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [consentAccepted, setConsentAccepted] = useState(true);
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [defaultFormMessage, setDefaultFormMessage] = useState<string>("");

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    setMounted(true);
    try {
      const t = localStorage.getItem(TOKEN_KEY);
      if (t) setSessionToken(t);
      const consent = localStorage.getItem(CONSENT_KEY);
      setConsentAccepted(consent === "1");
    } catch {
      // ignore
    }
  }, []);

  // Hidrata histórico ao abrir se houver token
  useEffect(() => {
    if (!open || !sessionToken) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/chatbot?session_token=${encodeURIComponent(sessionToken)}`,
        );
        if (!res.ok) return;
        const data = (await res.json()) as {
          messages?: Array<{
            id: string;
            role: "user" | "assistant" | "system";
            content: string;
          }>;
          converted?: boolean;
        };
        if (cancelled) return;
        if (data.messages && data.messages.length) {
          setMessages([
            GREETING,
            ...data.messages
              .filter((m) => m.role !== "system")
              .map((m) => ({
                id: m.id,
                role: m.role,
                content: m.content,
              })),
          ]);
        }
        if (data.converted) setLeadSubmitted(true);
      } catch {
        // ignore
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, sessionToken]);

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, showForm, sending]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 80);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const showInitialQuickReplies =
    messages.length === 1 && messages[0]?.id === GREETING_ID;

  const persistToken = useCallback((token: string) => {
    setSessionToken(token);
    try {
      localStorage.setItem(TOKEN_KEY, token);
    } catch {
      // ignore
    }
  }, []);

  const sendToAgent = useCallback(
    async (userText: string) => {
      const userMsg: ChatMessage = { id: uid(), role: "user", content: userText };
      const assistantId = uid();
      const placeholder: ChatMessage = {
        id: assistantId,
        role: "assistant",
        content: "",
        pending: true,
      };
      setMessages((prev) => [...prev, userMsg, placeholder]);
      setSending(true);

      try {
        const res = await fetch("/api/chatbot", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_token: sessionToken ?? undefined,
            message: userText,
            visitor_meta: {
              referrer: typeof window !== "undefined" ? window.location.href : undefined,
            },
          }),
        });

        if (res.status === 429) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    pending: false,
                    content: "Muitas mensagens em pouco tempo. Aguarde alguns minutos.",
                  }
                : m,
            ),
          );
          return;
        }

        if (!res.ok) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? {
                    ...m,
                    pending: false,
                    content:
                      "Tivemos um problema agora. Tente em instantes ou fale em /contato.",
                  }
                : m,
            ),
          );
          return;
        }

        const data = (await res.json()) as {
          session_token: string;
          reply: string;
          cta?: CTA | null;
          intent: ChatbotIntent;
        };
        persistToken(data.session_token);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  pending: false,
                  content: data.reply,
                  cta: data.cta ?? null,
                }
              : m,
          ),
        );
      } catch (err) {
        console.error("[chat-widget] send error", err);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? {
                  ...m,
                  pending: false,
                  content: "Falha de conexão. Verifique sua internet e tente de novo.",
                }
              : m,
          ),
        );
      } finally {
        setSending(false);
      }
    },
    [sessionToken, persistToken],
  );

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    if (!consentAccepted) {
      try {
        localStorage.setItem(CONSENT_KEY, "1");
      } catch {}
      setConsentAccepted(true);
    }
    void sendToAgent(text);
  }, [input, sending, consentAccepted, sendToAgent]);

  const handleQuickReply = useCallback(
    (reply: QuickReply) => {
      const text = QUICK_REPLY_TEXT[reply.value] ?? reply.label;
      // "Meu pedido / status da entrega" → oferece o portal de rastreio na hora,
      // sem depender da IA classificar (resposta instantânea e sempre certa).
      if (reply.value === "pedido") {
        setMessages((prev) => [
          ...prev,
          { id: uid(), role: "user", content: text },
          {
            id: uid(),
            role: "assistant",
            content:
              "Pra ver onde seu pedido está é rapidinho: clique no botão abaixo pra abrir nosso portal de rastreio e informe o código de rastreio. 📦 Se preferir, me conta que eu te ajudo por aqui também!",
            cta: {
              label: "Rastrear meu pedido",
              href: RASTREIO_URL,
              kind: "external",
            },
          },
        ]);
        return;
      }
      void sendToAgent(text);
    },
    [sendToAgent],
  );

  const handleCtaClick = useCallback((msg: ChatMessage) => {
    if (!msg.cta) return;
    if (msg.cta.kind === "convert") {
      setDefaultFormMessage(
        msg.cta.label.includes("cotação")
          ? "Quero uma cotação personalizada Spotlog."
          : "Quero falar com a Spotlog.",
      );
      setShowForm(true);
      return;
    }
    if (msg.cta.kind === "external" || msg.cta.href.startsWith("http") || msg.cta.href.startsWith("mailto:")) {
      window.open(msg.cta.href, "_blank", "noopener,noreferrer");
      return;
    }
    window.location.href = msg.cta.href;
  }, []);

  const handleLeadSubmit = useCallback(
    async (values: LeadFormValues) => {
      if (!sessionToken) {
        // sem sessão, força mensagem inicial pra criar uma
        try {
          const res = await fetch("/api/chatbot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: "Quero contato com a Spotlog." }),
          });
          const data = (await res.json()) as { session_token: string };
          persistToken(data.session_token);
        } catch {
          // ignore
        }
      }
      const token =
        sessionToken ?? (typeof window !== "undefined" ? localStorage.getItem(TOKEN_KEY) : null);
      if (!token) {
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: "Não consegui registrar seus dados agora. Tente em /contato.",
          },
        ]);
        return;
      }
      try {
        const res = await fetch("/api/chatbot/convert", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_token: token,
            name: values.name,
            email: values.email,
            phone: values.phone || undefined,
            company: values.company || undefined,
            message: values.message || undefined,
          }),
        });
        if (!res.ok) throw new Error(await res.text());
        setLeadSubmitted(true);
        setShowForm(false);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: `Recebemos seus dados, ${values.name.split(" ")[0]}! Nossa equipe vai te chamar em breve. Quer continuar tirando dúvidas por aqui?`,
          },
        ]);
      } catch (err) {
        console.error("[chat-widget] convert error", err);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content:
              "Não consegui registrar agora. Tente novamente ou use /contato.",
          },
        ]);
      }
    },
    [sessionToken, persistToken],
  );

  const handleAcceptConsent = useCallback(() => {
    try {
      localStorage.setItem(CONSENT_KEY, "1");
    } catch {}
    setConsentAccepted(true);
  }, []);

  const headerSubtitle = useMemo(
    () => (sending ? "Digitando…" : "Online agora"),
    [sending],
  );

  if (!mounted) return null;

  return (
    <>
      {/* Botão flutuante */}
      <button
        type="button"
        aria-label={open ? "Fechar chat Spotlog" : "Falar com a Spotlog"}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "fixed bottom-5 right-5 z-[60] inline-flex items-center gap-2 rounded-full text-white shadow-lg transition-transform hover:scale-105 active:scale-95",
          open ? "size-14 justify-center bg-[#011960]" : "px-4 py-3 bg-[#BA0102] animate-pulse-soft",
        )}
        style={{
          boxShadow:
            "0 12px 28px -8px rgba(186,1,2,0.45), 0 4px 10px -4px rgba(0,0,0,0.2)",
        }}
      >
        {open ? (
          <X className="size-6" />
        ) : (
          <>
            <MessageCircle className="size-5" />
            <span className="text-sm font-semibold hidden sm:inline">
              Fale com a Spotlog
            </span>
          </>
        )}
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="false"
          aria-label="Assistente Spotlog"
          className={cn(
            "fixed z-[60] flex flex-col overflow-hidden border border-[#011960]/15 bg-white shadow-2xl",
            "inset-0 sm:inset-auto",
            "sm:bottom-24 sm:right-5 sm:h-[550px] sm:w-[380px] sm:rounded-2xl",
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 bg-[#011960] px-4 py-3 text-white">
            <div className="flex size-9 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/25">
              <span className="text-sm font-extrabold tracking-tight">B</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold leading-tight">
                Bia · Atendimento Spotlog
              </p>
              <p className="flex items-center gap-1.5 text-[11px] text-white/80">
                <span className="size-1.5 rounded-full bg-emerald-400" />
                {headerSubtitle}
              </p>
            </div>
            <button
              type="button"
              aria-label="Fechar chat"
              onClick={() => setOpen(false)}
              className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </div>

          {/* Lista */}
          <div
            ref={listRef}
            className="flex-1 overflow-y-auto bg-gradient-to-b from-[#F5F7FB] to-white px-3 py-3 space-y-2.5"
          >
            {messages.map((m) => (
              <MessageBubble
                key={m.id}
                message={m}
                onCtaClick={handleCtaClick}
              />
            ))}

            {sending ? (
              <div className="flex justify-start">
                <TypingIndicator />
              </div>
            ) : null}

            {showInitialQuickReplies ? (
              <QuickReplies
                replies={INITIAL_QUICK_REPLIES}
                onPick={handleQuickReply}
                disabled={sending}
              />
            ) : null}

            {showForm && !leadSubmitted ? (
              <LeadForm
                onSubmit={handleLeadSubmit}
                onCancel={() => setShowForm(false)}
                defaultMessage={defaultFormMessage}
              />
            ) : null}
          </div>

          {/* Consentimento LGPD */}
          {!consentAccepted ? (
            <div className="border-t border-[#011960]/10 bg-[#F5F7FB] px-3 py-2 text-[11px] text-[#011960]">
              Suas mensagens podem ser revisadas pra melhorar nosso atendimento.{" "}
              <Link href="/privacidade" className="font-medium underline">
                Privacidade
              </Link>
              .
              <button
                type="button"
                onClick={handleAcceptConsent}
                className="ml-2 font-semibold text-[#BA0102] hover:underline"
              >
                Entendi
              </button>
            </div>
          ) : null}

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="border-t border-[#011960]/10 bg-white px-2.5 py-2"
          >
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder="Escreva sua mensagem…"
                rows={1}
                aria-label="Mensagem para o assistente"
                className="flex-1 max-h-28 resize-none rounded-xl border border-[#011960]/20 bg-white px-3 py-2 text-sm text-[#011960] placeholder:text-[#011960]/40 focus:outline-none focus:ring-2 focus:ring-[#BA0102]/30 focus:border-[#BA0102]"
              />
              <button
                type="submit"
                disabled={sending || !input.trim()}
                aria-label="Enviar mensagem"
                className="inline-flex size-10 items-center justify-center rounded-xl bg-[#BA0102] text-white shadow-sm transition-colors hover:bg-[#BA0102]/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Send className="size-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      ) : null}

      <style jsx>{`
        @keyframes pulseSoft {
          0%, 100% {
            transform: scale(1);
            box-shadow:
              0 12px 28px -8px rgba(186, 1, 2, 0.5),
              0 0 0 0 rgba(186, 1, 2, 0.45);
          }
          50% {
            transform: scale(1.04);
            box-shadow:
              0 12px 28px -8px rgba(186, 1, 2, 0.5),
              0 0 0 14px rgba(186, 1, 2, 0);
          }
        }
        .animate-pulse-soft {
          animation: pulseSoft 2.4s ease-in-out infinite;
        }
      `}</style>
    </>
  );
}
