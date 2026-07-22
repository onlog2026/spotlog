"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * Ativa/pausa a cadência. Sem isso o badge "Ativa/Pausada" era só
 * decorativo — o cron de envio nunca checava essa coluna.
 */
export async function toggleSequenceActive(sequenceId: string, nextActive: boolean) {
  const ctx = await requireSession();
  const admin = createAdminClient();
  await admin
    .from("sequences")
    .update({ is_active: nextActive })
    .eq("id", sequenceId)
    .eq("organization_id", ctx.org.id);
  revalidatePath("/app/cadencias");
  revalidatePath(`/app/cadencias/${sequenceId}`);
}

/**
 * Tira um contato específico da cadência (pedido dele, sem ser opt-out
 * geral de LGPD). Usa status 'finished' — o enum do banco não tem um
 * valor dedicado de "cancelado", e criar um exigiria migration.
 */
export async function cancelEnrollment(enrollmentId: string, sequenceId: string) {
  const ctx = await requireSession();
  const admin = createAdminClient();
  await admin
    .from("sequence_enrollments")
    .update({ status: "finished", finished_at: new Date().toISOString() })
    .eq("id", enrollmentId)
    .eq("organization_id", ctx.org.id);
  revalidatePath(`/app/cadencias/${sequenceId}`);
}
