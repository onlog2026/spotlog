"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const kbSchema = z.object({
  id: z.string().uuid().optional(),
  category: z.enum(["produto","servico","politica","faq","contato","outro"]),
  question: z.string().min(3).max(500),
  answer: z.string().min(3).max(4000),
  keywords: z.string().max(800).optional(),
  priority: z.coerce.number().int().min(0).max(1000).default(0),
  active: z.coerce.boolean().default(true),
});

function parseKeywords(raw?: string): string[] {
  if (!raw) return [];
  return raw
    .split(/[,;\n]/)
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 30);
}

export async function saveKnowledgeAction(formData: FormData) {
  const ctx = await requireSession();
  const parsed = kbSchema.safeParse({
    id: formData.get("id") || undefined,
    category: formData.get("category"),
    question: formData.get("question"),
    answer: formData.get("answer"),
    keywords: formData.get("keywords"),
    priority: formData.get("priority") ?? 0,
    active: formData.get("active") === "on" || formData.get("active") === "true",
  });
  if (!parsed.success) {
    throw new Error("Dados inválidos: " + parsed.error.issues.map((i) => i.message).join(", "));
  }
  const data = parsed.data;
  const supabase = await createClient();

  const payload = {
    organization_id: ctx.org.id,
    category: data.category,
    question: data.question,
    answer: data.answer,
    keywords: parseKeywords(data.keywords),
    priority: data.priority,
    active: data.active,
    updated_at: new Date().toISOString(),
  };

  if (data.id) {
    const { error } = await supabase
      .from("chatbot_knowledge")
      .update(payload)
      .eq("id", data.id);
    if (error) throw new Error("Erro ao atualizar: " + error.message);
  } else {
    const { error } = await supabase.from("chatbot_knowledge").insert({
      ...payload,
      created_by: ctx.user.id,
    });
    if (error) throw new Error("Erro ao criar: " + error.message);
  }

  // Se veio de uma "não respondida", marca como resolvida
  const fromUnanswered = formData.get("from_unanswered");
  if (fromUnanswered && typeof fromUnanswered === "string") {
    await supabase
      .from("chatbot_unanswered")
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
      })
      .eq("id", fromUnanswered);
  }

  revalidatePath("/app/admin/chatbot/knowledge");
  revalidatePath("/app/admin/chatbot/unanswered");
  redirect("/app/admin/chatbot/knowledge");
}

export async function deleteKnowledgeAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createClient();
  const { error } = await supabase.from("chatbot_knowledge").delete().eq("id", id);
  if (error) throw new Error("Erro ao excluir: " + error.message);
  revalidatePath("/app/admin/chatbot/knowledge");
}

export async function dismissUnansweredAction(formData: FormData) {
  await requireSession();
  const id = formData.get("id");
  if (typeof id !== "string") return;
  const supabase = await createClient();
  await supabase
    .from("chatbot_unanswered")
    .update({ resolved: true, resolved_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/app/admin/chatbot/unanswered");
}
