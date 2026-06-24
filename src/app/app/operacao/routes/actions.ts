"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function concluirRota(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const id = String(formData.get("route_id") ?? "");
  if (!id) return { ok: false, error: "ID inválido." };

  const { error } = await supabase
    .from("routes")
    .update({
      status: "concluida",
      ended_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/operacao/routes/${id}`);
  revalidatePath("/app/operacao/routes");
  return { ok: true };
}
