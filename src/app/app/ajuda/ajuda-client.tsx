"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Search,
  ChevronDown,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Mail,
  HelpCircle,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react";
import { resetTour } from "@/lib/onboarding/storage";
import { OnboardingTour } from "@/components/onboarding/onboarding-tour";

type FaqItem = {
  id: string;
  category: string;
  question: string;
  answer: string;
  keywords: string[];
  helpful_count: number;
  unhelpful_count: number;
  sort: number;
};

const CATEGORIES: { key: string; label: string; color: string }[] = [
  { key: "all", label: "Todas", color: "#011960" },
  { key: "geral", label: "Geral", color: "#475569" },
  { key: "crm", label: "CRM", color: "#3b82f6" },
  { key: "leads", label: "Leads", color: "#3b82f6" },
  { key: "pipeline", label: "Pipeline", color: "#3b82f6" },
  { key: "marketing", label: "Marketing", color: "#f97316" },
  { key: "operacao", label: "Operação", color: "#4338ca" },
  { key: "sac", label: "SAC", color: "#10b981" },
  { key: "cliente", label: "Cliente", color: "#ca8a04" },
  { key: "cms", label: "Conteúdo", color: "#92400e" },
  { key: "compliance", label: "Compliance", color: "#dc2626" },
  { key: "integracoes", label: "Integrações", color: "#8b5cf6" },
  { key: "api", label: "API", color: "#475569" },
  { key: "contas", label: "Contas", color: "#475569" },
  { key: "agenda", label: "Agenda", color: "#475569" },
];

export function AjudaClient() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("all");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, "up" | "down" | undefined>>({});
  const [runTour, setRunTour] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    setLoading(true);
    const url = new URL("/api/faq", window.location.origin);
    if (q) url.searchParams.set("q", q);
    if (category !== "all") url.searchParams.set("category", category);
    fetch(url.toString(), { signal: ctrl.signal })
      .then((r) => r.json())
      .then((d) => setItems(d.items ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
    return () => ctrl.abort();
  }, [q, category]);

  // Ctrl+K atalho
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        document.getElementById("faq-search")?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const grouped = useMemo(() => {
    const map: Record<string, FaqItem[]> = {};
    for (const it of items) {
      (map[it.category] ||= []).push(it);
    }
    return map;
  }, [items]);

  async function vote(id: string, helpful: boolean) {
    setVotes((v) => ({ ...v, [id]: helpful ? "up" : "down" }));
    try {
      await fetch("/api/faq/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, helpful }),
      });
    } catch {
      // ignore
    }
  }

  function startTour() {
    resetTour();
    setRunTour(true);
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <OnboardingTour run={runTour} onFinish={() => setRunTour(false)} />

      <div>
        <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
          <HelpCircle className="h-7 w-7" style={{ color: "#011960" }} />
          Central de Ajuda
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tire suas dúvidas sobre o Spotlog ou fale direto com a gente.
        </p>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <input
          id="faq-search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar pergunta... (Ctrl+K)"
          className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-card text-base outline-none focus:ring-2"
          style={{ outlineColor: "#011960" }}
        />
      </div>

      {/* Ações rápidas */}
      <div className="grid sm:grid-cols-3 gap-3">
        <button
          onClick={startTour}
          className="rounded-xl p-4 text-left border border-border bg-card hover:shadow-md transition flex items-start gap-3"
        >
          <div
            className="h-10 w-10 rounded-lg grid place-items-center text-white shrink-0"
            style={{ background: "#011960" }}
          >
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Refazer tour</div>
            <div className="text-xs text-muted-foreground">Reveja os passos em 2 min</div>
          </div>
        </button>
        <a
          href="https://wa.me/5511978348288?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20no%20Spotlog"
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-xl p-4 text-left border border-border bg-card hover:shadow-md transition flex items-start gap-3"
        >
          <div
            className="h-10 w-10 rounded-lg grid place-items-center text-white shrink-0"
            style={{ background: "#BA0102" }}
          >
            <MessageCircle className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Falar com suporte</div>
            <div className="text-xs text-muted-foreground">WhatsApp (11) 97834-8288</div>
          </div>
        </a>
        <a
          href="mailto:sac@spotlogoficial.com.br"
          className="rounded-xl p-4 text-left border border-border bg-card hover:shadow-md transition flex items-start gap-3"
        >
          <div
            className="h-10 w-10 rounded-lg grid place-items-center text-white shrink-0"
            style={{ background: "#011960" }}
          >
            <Mail className="h-5 w-5" />
          </div>
          <div>
            <div className="font-semibold">Email suporte</div>
            <div className="text-xs text-muted-foreground break-all">sac@spotlogoficial.com.br</div>
          </div>
        </a>
      </div>

      {/* Filtros categoria */}
      <div className="flex gap-2 flex-wrap">
        {CATEGORIES.map((c) => (
          <button
            key={c.key}
            onClick={() => setCategory(c.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium border transition"
            style={
              category === c.key
                ? { background: c.color, color: "#fff", borderColor: c.color }
                : { borderColor: "rgba(0,0,0,0.15)" }
            }
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-border rounded-xl">
          <p className="text-muted-foreground mb-3">
            Não achou o que procura?
          </p>
          <a
            href="https://wa.me/5511978348288?text=Ol%C3%A1%2C%20preciso%20de%20ajuda%20no%20Spotlog"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-white font-medium"
            style={{ background: "#BA0102" }}
          >
            <MessageCircle className="h-4 w-4" />
            Fala com a gente
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, list]) => {
            const meta = CATEGORIES.find((c) => c.key === cat);
            return (
              <div key={cat} className="space-y-2">
                <div className="flex items-center gap-2">
                  <span
                    className="inline-block h-2 w-2 rounded-full"
                    style={{ background: meta?.color ?? "#475569" }}
                  />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                    {meta?.label ?? cat}
                  </h2>
                  <span className="text-xs text-muted-foreground">({list.length})</span>
                </div>
                <div className="rounded-xl border border-border bg-card divide-y divide-border overflow-hidden">
                  {list.map((it) => {
                    const open = expanded === it.id;
                    return (
                      <div key={it.id}>
                        <button
                          onClick={() => setExpanded(open ? null : it.id)}
                          className="w-full text-left p-4 flex items-center gap-3 hover:bg-muted/40 transition"
                        >
                          <HelpCircle
                            className="h-4 w-4 shrink-0"
                            style={{ color: meta?.color ?? "#475569" }}
                          />
                          <span className="flex-1 font-medium text-sm md:text-base">
                            {it.question}
                          </span>
                          {open ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </button>
                        {open && (
                          <div className="px-4 pb-4 pl-11">
                            <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {it.answer}
                              </ReactMarkdown>
                            </div>
                            <div className="mt-4 flex items-center gap-2 text-xs">
                              <span className="text-muted-foreground">Foi útil?</span>
                              <button
                                onClick={() => vote(it.id, true)}
                                disabled={!!votes[it.id]}
                                className="px-3 py-1 rounded-full border border-border hover:bg-emerald-50 dark:hover:bg-emerald-950 inline-flex items-center gap-1 disabled:opacity-60"
                              >
                                <ThumbsUp className="h-3 w-3" />
                                Sim
                              </button>
                              <button
                                onClick={() => vote(it.id, false)}
                                disabled={!!votes[it.id]}
                                className="px-3 py-1 rounded-full border border-border hover:bg-red-50 dark:hover:bg-red-950 inline-flex items-center gap-1 disabled:opacity-60"
                              >
                                <ThumbsDown className="h-3 w-3" />
                                Não
                              </button>
                              {votes[it.id] && (
                                <span className="text-muted-foreground">Obrigado pelo feedback!</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
