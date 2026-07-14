"use server";
/**
 * Ações da fila "Conversas da IA" (agente SDR conversacional).
 * Assumir = humano toma a conversa (a IA silencia na hora).
 * Devolver = IA volta a responder.
 * Estado em leads.custom_fields.sdr.mode ('ai' | 'human').
 */
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

async function setMode(leadId: string, mode: "ai" | "human") {
  const ctx = await requireSession();
  if (!leadId) throw new Error("lead obrigatório");
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("leads")
    .select("id, custom_fields")
    .eq("id", leadId)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!row) throw new Error("Lead não encontrado");
  const cf = ((row as { custom_fields: Record<string, unknown> | null })
    .custom_fields ?? {}) as Record<string, unknown>;
  const sdr = { ...((cf.sdr as Record<string, unknown> | undefined) ?? {}), mode };
  const { error } = await admin
    .from("leads")
    .update({ custom_fields: { ...cf, sdr } })
    .eq("id", leadId)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/sdr");
  return { ok: true };
}

export async function assumirConversa(leadId: string) {
  return setMode(leadId, "human");
}

export async function devolverConversa(leadId: string) {
  return setMode(leadId, "ai");
}
