"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function atualizarPerfilAction(formData: FormData) {
  const ctx = await requireSession();
  const fullName = String(formData.get("full_name") ?? "").trim();
  if (!fullName) throw new Error("Nome é obrigatório.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName })
    .eq("id", ctx.user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/app/perfil");
}
