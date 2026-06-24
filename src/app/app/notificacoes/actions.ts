"use server";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function marcarTodasLidas() {
  const ctx = await requireSession();
  const supabase = await createClient();

  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("organization_id", ctx.org.id)
      .eq("user_id", ctx.user.id)
      .eq("is_read", false);
    if (error) throw new Error(error.message);
  } catch {
    try {
      await supabase.rpc("notif_mark_all_read", {
        p_org: ctx.org.id,
        p_user: ctx.user.id,
      });
    } catch {
      // ignore
    }
  }

  revalidatePath("/app/notificacoes");
  revalidatePath("/app");
}
