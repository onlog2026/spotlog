"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function resolverOcorrencia(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();

  const id = String(formData.get("occurrence_id") ?? "");
  const notes = String(formData.get("resolution_notes") ?? "").trim();
  if (!id) return { ok: false, error: "ID inválido." };

  const { error } = await supabase
    .from("occurrences")
    .update({
      status: "resolvida",
      resolution_notes: notes || null,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/operacao/ocorrencias");
  return { ok: true };
}

export async function criarOcorrencia(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();

  const shipment_id = String(formData.get("shipment_id") ?? "").trim();
  const category = String(formData.get("category") ?? "outro").trim();
  const severity = String(formData.get("severity") ?? "media").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!description) {
    return { ok: false, error: "Descrição obrigatória." };
  }

  const { error } = await supabase.rpc("op_create_occurrence", {
    p_payload: {
      organization_id: ctx.org.id,
      shipment_id,
      category,
      severity,
      description,
      status: "aberta",
    },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/operacao/ocorrencias");
  redirect("/app/operacao/ocorrencias?ok=created");
}
