"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function createVehicle(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();

  const plate = String(formData.get("plate") ?? "").trim().toUpperCase();
  const brand = String(formData.get("brand") ?? "").trim();
  const model = String(formData.get("model") ?? "").trim();
  const year = String(formData.get("year") ?? "").trim();
  const type = String(formData.get("type") ?? "").trim();
  const capacity_kg = String(formData.get("capacity_kg") ?? "").trim();

  if (!plate) return { ok: false, error: "Placa obrigatória." };

  const { error } = await supabase.rpc("op_create_vehicle", {
    p_payload: {
      organization_id: ctx.org.id,
      plate,
      brand,
      model,
      year,
      type,
      capacity_kg,
      status: "disponivel",
    },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/operacao/vehicles");
  redirect("/app/operacao/vehicles?ok=created");
}
