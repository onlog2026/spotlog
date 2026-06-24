import { createClient } from "@/lib/supabase/server";

export type NotificationModule =
  | "leads"
  | "deals"
  | "tickets_sac"
  | "tickets_comercial"
  | "tickets_financeiro"
  | "chatbot_unanswered";

export type NotificationCounts = Partial<Record<NotificationModule, number>>;

/**
 * Server: pega contagens de itens novos por módulo pra a org/user atual.
 * Falha silenciosa — se algo der errado retorna {} pra não quebrar layout.
 */
export async function getNewCounts(
  orgId: string,
  userId: string,
): Promise<NotificationCounts> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("count_new_items", {
      p_user: userId,
      p_org: orgId,
    });
    if (error || !data) return {};
    const out: NotificationCounts = {};
    for (const row of data as Array<{ module: string; new_count: number }>) {
      out[row.module as NotificationModule] = Number(row.new_count) || 0;
    }
    return out;
  } catch {
    return {};
  }
}

/**
 * Server: marca um módulo como visto pelo user atual.
 * Idempotente.
 */
export async function markSeen(module: NotificationModule | string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.rpc("mark_module_seen", { p_module: module });
  } catch {
    // ignore — não pode quebrar UX
  }
}
