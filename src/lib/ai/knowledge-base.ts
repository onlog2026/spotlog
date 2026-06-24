import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type KBCategory =
  | "produto"
  | "servico"
  | "politica"
  | "faq"
  | "contato"
  | "outro";

export type KBEntry = {
  id: string;
  organization_id: string | null;
  category: KBCategory;
  question: string;
  answer: string;
  keywords: string[];
  priority: number;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type KBHit = {
  entry: KBEntry;
  score: number;
};

const STOPWORDS = new Set([
  "a","o","as","os","de","da","do","das","dos","e","ou","em","no","na","nos","nas",
  "um","uma","uns","umas","para","pra","por","com","sem","que","se","é","sou","ser",
  "eu","você","voce","tu","ele","ela","nós","vós","eles","elas","me","te","lhe",
  "qual","quais","como","onde","quando","quanto","quantos","quanta","quantas","quem",
  "isso","isto","aquilo","esse","essa","esta","este","aquele","aquela","tem","tinha",
  "the","of","and","for","in","on","at","to","is","are","what","how","where","when",
]);

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

/**
 * Busca na KB por similaridade léxica simples (BM25-lite).
 * Top 5 por score, descartando hits com score < 1.
 */
export async function searchKnowledge(query: string): Promise<KBHit[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chatbot_knowledge")
    .select("*")
    .eq("active", true);

  if (error || !data) {
    console.error("[knowledge-base] fetch error", error);
    return [];
  }

  const entries = data as unknown as KBEntry[];
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return [];

  const hits: KBHit[] = entries.map((entry) => {
    const haystackQuestion = normalize(entry.question);
    const haystackAnswer = normalize(entry.answer);
    const keywordsNorm = (entry.keywords ?? []).map((k) => normalize(k));

    let score = 0;
    for (const token of queryTokens) {
      // pergunta vale mais
      if (haystackQuestion.includes(token)) score += 3;
      // resposta vale menos
      if (haystackAnswer.includes(token)) score += 1;
      // keywords valem MUITO
      for (const kw of keywordsNorm) {
        if (kw.includes(token) || token.includes(kw)) {
          score += 4;
          break;
        }
      }
    }
    // priority como tie-break suave
    score += (entry.priority ?? 0) / 200;
    return { entry, score };
  });

  return hits
    .filter((h) => h.score >= 2)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}

export async function getKnowledgeByCategory(
  category: KBCategory,
): Promise<KBEntry[]> {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("chatbot_knowledge")
    .select("*")
    .eq("category", category)
    .eq("active", true)
    .order("priority", { ascending: false });
  if (error || !data) return [];
  return data as unknown as KBEntry[];
}

export async function logUnansweredQuestion(
  sessionId: string,
  question: string,
  context: string | null,
  organizationId: string | null,
): Promise<void> {
  const supabase = createAdminClient();
  const { error } = await supabase.from("chatbot_unanswered").insert({
    session_id: sessionId,
    question,
    context,
    organization_id: organizationId,
  });
  if (error) {
    console.error("[knowledge-base] log unanswered error", error);
  }
}
