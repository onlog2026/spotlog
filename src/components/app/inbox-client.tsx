"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Send, MessageCircle, Loader2, RefreshCw, Plus, Search, Users } from "lucide-react";

type Conv = {
  id: string;
  name: string;
  number: string;
  unread: number;
  lastText: string;
  lastAt: string;
  serviceId: string;
  assigned: boolean;
  isGroup: boolean;
};
type Msg = { id: string; direction: string; body_text: string; created_at: string };
type Tab = "chats" | "fila" | "contatos";
type Counts = { chats: number; fila: number; contatos: number };

const TABS: { key: Tab; label: string }[] = [
  { key: "chats", label: "Chats" },
  { key: "fila", label: "Fila" },
  { key: "contatos", label: "Contatos" },
];

export function InboxClient() {
  const [tab, setTab] = useState<Tab>("fila");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [total, setTotal] = useState(0);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [convErr, setConvErr] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const [sel, setSel] = useState<Conv | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const openIdRef = useRef<string | null>(null);
  const msgsCache = useRef<Map<string, Msg[]>>(new Map());

  // Nova conversa
  const [newOpen, setNewOpen] = useState(false);
  const [nNum, setNNum] = useState("");
  const [nText, setNText] = useState("");
  const [nSending, setNSending] = useState(false);
  const [nErr, setNErr] = useState<string | null>(null);

  const loadCounts = useCallback(async () => {
    try {
      const r = await fetch("/api/inbox/counts");
      const j = await r.json();
      if (j.counts) setCounts(j.counts);
    } catch {
      /* ignore */
    }
  }, []);

  const loadConvs = useCallback(
    async (t: Tab, query: string, off: number, append: boolean, silent = false) => {
      if (append) setLoadingMore(true);
      else if (!silent) setLoadingConvs(true);
      try {
        const r = await fetch(
          `/api/inbox/conversations?tab=${t}&offset=${off}&q=${encodeURIComponent(query)}`,
        );
        const j = await r.json();
        setConvErr(j.error ?? null);
        setTotal(j.total ?? 0);
        setHasMore(!!j.hasMore);
        const incoming: Conv[] = j.conversations ?? [];
        setConvs((prev) => {
          if (append) return [...prev, ...incoming];
          // Merge preservando a referência de linhas idênticas → sem flicker/repaint.
          const prevById = new Map(prev.map((c) => [c.id, c]));
          return incoming.map((c) => {
            const old = prevById.get(c.id);
            if (
              old &&
              old.unread === c.unread &&
              old.lastText === c.lastText &&
              old.lastAt === c.lastAt &&
              old.name === c.name &&
              old.assigned === c.assigned
            )
              return old;
            return c;
          });
        });
      } catch {
        setConvErr("Erro ao carregar conversas.");
      } finally {
        setLoadingConvs(false);
        setLoadingMore(false);
      }
    },
    [],
  );

  const loadMsgs = useCallback(async (id: string) => {
    try {
      const r = await fetch(`/api/inbox/messages?c=${encodeURIComponent(id)}`);
      const j = await r.json();
      const incoming: Msg[] = j.messages ?? [];
      msgsCache.current.set(id, incoming);
      if (openIdRef.current !== id) return;
      setMsgs((prev) => {
        const same =
          prev.length === incoming.length &&
          prev[prev.length - 1]?.id === incoming[incoming.length - 1]?.id;
        return same ? prev : incoming;
      });
    } catch {
      /* ignore */
    }
  }, []);

  // Contagens (badges) no carregamento
  useEffect(() => {
    loadCounts();
  }, [loadCounts]);

  // Recarrega a lista ao trocar de aba ou buscar (debounce na busca)
  useEffect(() => {
    const delay = q ? 350 : 0;
    const t = setTimeout(() => loadConvs(tab, q, 0, false), delay);
    return () => clearTimeout(t);
  }, [tab, q, loadConvs]);

  // Atualiza a aba ativa + badges a cada 15s, em segundo plano (sem flicker), só com a aba visível
  useEffect(() => {
    const iv = setInterval(() => {
      if (!q && document.visibilityState === "visible") {
        loadConvs(tab, "", 0, false, true);
        loadCounts();
      }
    }, 15000);
    return () => clearInterval(iv);
  }, [tab, q, loadConvs, loadCounts]);

  // Polling da conversa aberta (pausa quando a aba não está visível)
  useEffect(() => {
    if (!sel) return;
    const iv = setInterval(() => {
      if (document.visibilityState === "visible") loadMsgs(sel.id);
    }, 8000);
    return () => clearInterval(iv);
  }, [sel, loadMsgs]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  function open(c: Conv) {
    setSel(c);
    openIdRef.current = c.id;
    setErr(null);
    const cached = msgsCache.current.get(c.id);
    if (cached && cached.length) {
      setMsgs(cached);
      setLoadingMsgs(false);
    } else {
      setMsgs([]);
      setLoadingMsgs(true);
    }
    loadMsgs(c.id).finally(() => setLoadingMsgs(false));
  }

  async function send() {
    if (!sel || !draft.trim() || sending) return;
    setSending(true);
    setErr(null);
    const text = draft.trim();
    const convId = sel.id;
    const temp: Msg = {
      id: "tmp-" + Date.now(),
      direction: "outbound",
      body_text: text,
      created_at: new Date().toISOString(),
    };
    setDraft("");
    setMsgs((prev) => [...prev, temp]); // eco otimista (aparece na hora)
    try {
      const r = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId: convId, serviceId: sel.serviceId, text }),
      });
      const j = await r.json();
      if (!j.ok) {
        setErr(j.error ?? "Falha ao enviar.");
        setMsgs((prev) => prev.filter((m) => m.id !== temp.id));
        setDraft(text);
        return;
      }
      await loadMsgs(convId);
    } catch {
      setErr("Erro de rede.");
      setMsgs((prev) => prev.filter((m) => m.id !== temp.id));
      setDraft(text);
    } finally {
      setSending(false);
    }
  }

  async function startNew() {
    const num = nNum.trim();
    const text = nText.trim();
    if (!num || !text || nSending) return;
    setNSending(true);
    setNErr(null);
    try {
      const r = await fetch("/api/inbox/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: num, text }),
      });
      const j = await r.json();
      if (!j.ok) {
        setNErr(j.error ?? "Falha ao iniciar conversa.");
        return;
      }
      setNNum("");
      setNText("");
      setNewOpen(false);
      await loadConvs(tab, q, 0, false);
    } catch {
      setNErr("Erro de rede.");
    } finally {
      setNSending(false);
    }
  }

  const hhmm = (s: string) =>
    s
      ? new Date(s).toLocaleString("pt-BR", {
          day: "2-digit",
          month: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  const badge = (t: Tab) => (counts ? counts[t] : t === tab ? total : null);

  return (
    <div className="flex h-[74vh] rounded-xl border border-white/10 overflow-hidden bg-card/50">
      {/* Lista */}
      <div className="w-[330px] border-r border-white/10 flex flex-col shrink-0">
        {/* Busca */}
        <div className="p-2 border-b border-white/10">
          <div className="relative">
            <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquisar por nome…"
              className="w-full rounded-lg bg-background border border-white/10 pl-8 pr-2 py-2 text-sm"
            />
          </div>
        </div>

        {/* Abas */}
        <div className="flex border-b border-white/10 text-sm">
          {TABS.map((t) => {
            const n = badge(t.key);
            return (
              <button
                key={t.key}
                onClick={() => {
                  setTab(t.key);
                  setQ("");
                }}
                className={`flex-1 py-2.5 flex items-center justify-center gap-1.5 font-medium border-b-2 transition-colors ${
                  tab === t.key
                    ? "border-emerald-500 text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {t.label}
                {n != null && n > 0 && (
                  <span
                    className={`text-[10px] rounded-full px-1.5 py-0.5 ${
                      tab === t.key ? "bg-emerald-500 text-white" : "bg-white/10 text-muted-foreground"
                    }`}
                  >
                    {n > 999 ? "999+" : n}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Nova conversa + atualizar */}
        <div className="flex items-center gap-2 p-2 border-b border-white/10">
          <button
            onClick={() => {
              setNewOpen(true);
              setNErr(null);
            }}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-medium py-2 rounded-lg"
          >
            <Plus className="h-4 w-4" /> Nova conversa
          </button>
          <button
            onClick={() => {
              loadConvs(tab, q, 0, false);
              loadCounts();
            }}
            className="text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-white/5"
            aria-label="Atualizar"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        {/* Lista de conversas */}
        <div className="flex-1 overflow-y-auto">
          {loadingConvs ? (
            <div className="p-6 text-sm text-muted-foreground text-center">
              <Loader2 className="h-4 w-4 animate-spin inline" /> carregando…
            </div>
          ) : convErr ? (
            <div className="p-4 text-sm text-amber-500">{convErr}</div>
          ) : convs.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground text-center">Nenhuma conversa.</div>
          ) : (
            <>
              {convs.map((c) => (
                <button
                  key={c.id}
                  onClick={() => open(c)}
                  className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 flex gap-3 items-center ${
                    sel?.id === c.id ? "bg-white/10" : ""
                  }`}
                >
                  <div className="h-10 w-10 rounded-full bg-emerald-500/20 grid place-items-center text-emerald-300 font-bold shrink-0">
                    {c.isGroup ? <Users className="h-5 w-5" /> : c.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium truncate">{c.name}</div>
                      <div className="text-[10px] text-muted-foreground shrink-0">{hhmm(c.lastAt)}</div>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{c.lastText || c.number}</div>
                  </div>
                  {c.unread > 0 && (
                    <span className="bg-emerald-500 text-white text-[10px] rounded-full px-1.5 py-0.5 shrink-0">
                      {c.unread}
                    </span>
                  )}
                </button>
              ))}
              {hasMore && (
                <button
                  onClick={() => loadConvs(tab, q, convs.length, true)}
                  disabled={loadingMore}
                  className="w-full py-3 text-sm text-emerald-400 hover:bg-white/5 flex items-center justify-center gap-2"
                >
                  {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} Carregar mais
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Conversa */}
      <div className="flex-1 flex flex-col min-w-0">
        {!sel ? (
          <div className="flex-1 grid place-items-center text-muted-foreground text-sm">
            <div className="text-center">
              <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
              Selecione uma conversa
            </div>
          </div>
        ) : (
          <>
            <div className="p-3 border-b border-white/10 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-500/20 grid place-items-center text-emerald-300 font-bold">
                {sel.isGroup ? <Users className="h-5 w-5" /> : sel.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="font-semibold leading-tight">{sel.name}</div>
                <div className="text-xs text-muted-foreground">{sel.number}</div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2" style={{ background: "#0b1424" }}>
              {loadingMsgs ? (
                <div className="text-center text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin inline" /> carregando…
                </div>
              ) : msgs.length === 0 ? (
                <div className="text-center text-muted-foreground text-sm">Sem mensagens.</div>
              ) : (
                msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.direction === "outbound" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                        m.direction === "outbound"
                          ? "bg-emerald-600 text-white rounded-br-sm"
                          : "bg-white/10 text-foreground rounded-bl-sm"
                      }`}
                    >
                      {m.body_text}
                      <div
                        className={`text-[10px] mt-1 ${
                          m.direction === "outbound" ? "text-emerald-100/70" : "text-muted-foreground"
                        }`}
                      >
                        {hhmm(m.created_at)}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={endRef} />
            </div>

            <div className="p-3 border-t border-white/10">
              {err && <div className="text-xs text-red-400 mb-2">{err}</div>}
              <div className="flex gap-2 items-end">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      send();
                    }
                  }}
                  rows={1}
                  placeholder="Escreva uma mensagem…  (Enter envia)"
                  className="flex-1 resize-none rounded-lg bg-background border border-white/10 px-3 py-2 text-sm max-h-32"
                />
                <button
                  onClick={send}
                  disabled={sending || !draft.trim()}
                  className="rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white h-10 w-11 grid place-items-center disabled:opacity-50 shrink-0"
                  aria-label="Enviar"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {newOpen && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4"
          onClick={() => setNewOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-xl border border-white/10 bg-card p-5 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold">Nova conversa</h3>
            <p className="text-xs text-muted-foreground">
              Envie a primeira mensagem para um número de WhatsApp. A conversa aparece na lista.
            </p>
            <div>
              <label className="text-xs text-muted-foreground">Número (com DDD)</label>
              <input
                value={nNum}
                onChange={(e) => setNNum(e.target.value)}
                placeholder="11 99999-9999"
                inputMode="tel"
                className="w-full mt-1 rounded-lg bg-background border border-white/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">Mensagem</label>
              <textarea
                value={nText}
                onChange={(e) => setNText(e.target.value)}
                rows={3}
                placeholder="Olá! Tudo bem?"
                className="w-full mt-1 rounded-lg bg-background border border-white/10 px-3 py-2 text-sm resize-none"
              />
            </div>
            {nErr && <div className="text-xs text-red-400">{nErr}</div>}
            <div className="flex justify-end gap-2 pt-1">
              <button onClick={() => setNewOpen(false)} className="px-3 py-2 text-sm rounded-lg hover:bg-white/5">
                Cancelar
              </button>
              <button
                onClick={startNew}
                disabled={nSending || !nNum.trim() || !nText.trim()}
                className="px-4 py-2 text-sm rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 flex items-center gap-2"
              >
                {nSending && <Loader2 className="h-4 w-4 animate-spin" />} Enviar
              </button>
            </div>
            <p className="text-[11px] text-muted-foreground border-t border-white/10 pt-2">
              ⚠️ O WhatsApp pode bloquear a 1ª mensagem para quem nunca falou com você (regra de
              opt-in). Funciona melhor com quem já te escreveu.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
