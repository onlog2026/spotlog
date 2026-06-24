import "server-only";
import { createClient } from "@/lib/supabase/server";

export type KBCategory =
  | "produto"
  | "servico"
  | "politica"
  | "faq"
  | "contato"
  | "outro";

export const KB_CATEGORIES: { value: KBCategory; label: string }[] = [
  { value: "produto", label: "Produto" },
  { value: "servico", label: "Serviço" },
  { value: "faq", label: "FAQ" },
  { value: "politica", label: "Política" },
  { value: "contato", label: "Contato" },
  { value: "outro", label: "Outro" },
];

export type KBRow = {
  id: string;
  category: KBCategory;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type UnansweredRow = {
  id: string;
  question: string;
  context: string | null;
  resolved: boolean;
  resolved_kb_id: string | null;
  resolved_at: string | null;
  created_at: string;
};

export type SessionRow = {
  id: string;
  session_token: string;
  started_at: string;
  last_activity_at: string;
  converted: boolean;
  lead_id: string | null;
  referrer: string | null;
  visitor_ip: string | null;
};

export type SessionMessageRow = {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  intent: string | null;
  matched_kb_ids: string[] | null;
  created_at: string;
};

export async function listKnowledge(opts?: {
  category?: KBCategory;
  search?: string;
}): Promise<KBRow[]> {
  const supabase = await createClient();
  let q = supabase
    .from("chatbot_knowledge")
    .select("id, category, question, answer, keywords, priority, active, created_at, updated_at")
    .order("priority", { ascending: false })
    .order("updated_at", { ascending: false });
  if (opts?.category) q = q.eq("category", opts.category);
  if (opts?.search) q = q.ilike("question", `%${opts.search}%`);
  const { data, error } = await q;
  if (error) {
    console.error("[chatbot queries] listKnowledge", error);
    return [];
  }
  return (data ?? []) as unknown as KBRow[];
}

export async function getKnowledgeById(id: string): Promise<KBRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chatbot_knowledge")
    .select("id, category, question, answer, keywords, priority, active, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as KBRow | null) ?? null;
}

export async function listUnanswered(resolved = false): Promise<UnansweredRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chatbot_unanswered")
    .select("id, question, context, resolved, resolved_kb_id, resolved_at, created_at")
    .eq("resolved", resolved)
    .order("created_at", { ascending: false })
    .limit(100);
  return ((data ?? []) as unknown as UnansweredRow[]);
}

export async function listSessions(limit = 50): Promise<SessionRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chatbot_sessions")
    .select("id, session_token, started_at, last_activity_at, converted, lead_id, referrer, visitor_ip")
    .order("started_at", { ascending: false })
    .limit(limit);
  return ((data ?? []) as unknown as SessionRow[]);
}

export async function getSessionWithMessages(id: string): Promise<{
  session: SessionRow | null;
  messages: SessionMessageRow[];
}> {
  const supabase = await createClient();
  const { data: session } = await supabase
    .from("chatbot_sessions")
    .select("id, session_token, started_at, last_activity_at, converted, lead_id, referrer, visitor_ip")
    .eq("id", id)
    .maybeSingle();
  const { data: messages } = await supabase
    .from("chatbot_messages")
    .select("id, role, content, intent, matched_kb_ids, created_at")
    .eq("session_id", id)
    .order("created_at", { ascending: true });
  return {
    session: (session as unknown as SessionRow | null) ?? null,
    messages: ((messages ?? []) as unknown as SessionMessageRow[]),
  };
}

export type ChatbotMetrics = {
  totalSessions30d: number;
  convertedSessions30d: number;
  conversionRate: number;
  topIntents: Array<{ intent: string; count: number }>;
  unansweredOpen: number;
  kbActive: number;
};

export async function getChatbotMetrics(): Promise<ChatbotMetrics> {
  const supabase = await createClient();
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: totalSessions30d }, { count: convertedSessions30d }, { count: unansweredOpen }, { count: kbActive }] =
    await Promise.all([
      supabase
        .from("chatbot_sessions")
        .select("id", { count: "exact", head: true })
        .gte("started_at", since),
      supabase
        .from("chatbot_sessions")
        .select("id", { count: "exact", head: true })
        .gte("started_at", since)
        .eq("converted", true),
      supabase
        .from("chatbot_unanswered")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false),
      supabase
        .from("chatbot_knowledge")
        .select("id", { count: "exact", head: true })
        .eq("active", true),
    ]);

  const { data: intentRows } = await supabase
    .from("chatbot_messages")
    .select("intent")
    .not("intent", "is", null)
    .gte("created_at", since)
    .limit(2000);

  const counts = new Map<string, number>();
  for (const r of (intentRows ?? []) as Array<{ intent: string | null }>) {
    if (!r.intent) continue;
    counts.set(r.intent, (counts.get(r.intent) ?? 0) + 1);
  }
  const topIntents = Array.from(counts.entries())
    .map(([intent, count]) => ({ intent, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const total = totalSessions30d ?? 0;
  const conv = convertedSessions30d ?? 0;

  return {
    totalSessions30d: total,
    convertedSessions30d: conv,
    conversionRate: total > 0 ? Math.round((conv / total) * 1000) / 10 : 0,
    topIntents,
    unansweredOpen: unansweredOpen ?? 0,
    kbActive: kbActive ?? 0,
  };
}
