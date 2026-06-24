"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createDriver(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();

  const full_name = String(formData.get("full_name") ?? "").trim();
  const cpf = String(formData.get("cpf") ?? "").trim();
  const cnh_numero = String(formData.get("cnh_numero") ?? "").trim();
  const cnh_validade = String(formData.get("cnh_validade") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();

  if (!full_name) return { ok: false, error: "Nome obrigatório." };

  const { error } = await supabase.rpc("op_create_driver", {
    p_payload: {
      organization_id: ctx.org.id,
      full_name,
      cpf,
      cnh_numero,
      cnh_validade,
      phone,
      email,
      status: "ativo",
    },
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/operacao/drivers");
  redirect("/app/operacao/drivers?ok=created");
}
