"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function criarRemessaAction(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();

  const recipient_name = String(formData.get("recipient_name") ?? "").trim();
  if (!recipient_name) {
    return { ok: false, error: "Nome do destinatário obrigatório." };
  }

  const company_id = String(formData.get("company_id") ?? "").trim();
  const recipient_phone = String(formData.get("recipient_phone") ?? "").trim();
  const recipient_email = String(formData.get("recipient_email") ?? "").trim();
  const weight_kg = String(formData.get("weight_kg") ?? "").trim();
  const declared_value = String(formData.get("declared_value") ?? "").trim();
  const sla_deadline = String(formData.get("sla_deadline") ?? "").trim();

  const destination_address = {
    street: String(formData.get("street") ?? "").trim() || null,
    number: String(formData.get("number") ?? "").trim() || null,
    city: String(formData.get("city") ?? "").trim() || null,
    uf: String(formData.get("uf") ?? "").trim().toUpperCase() || null,
    cep: String(formData.get("cep") ?? "").trim() || null,
  };

  const { data, error } = await supabase.rpc("op_create_shipment", {
    p_payload: {
      organization_id: ctx.org.id,
      company_id,
      recipient_name,
      recipient_phone,
      recipient_email,
      destination_address,
      weight_kg,
      declared_value,
      sla_deadline,
      status: "criada",
    },
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath("/app/operacao/shipments");
  if (data) redirect(`/app/operacao/shipments/${data}?ok=created`);
  redirect("/app/operacao/shipments?ok=created");
}

export async function addTrackingEvent(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();

  const shipmentId = String(formData.get("shipment_id") ?? "");
  const eventType = String(formData.get("event_type") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const city = String(formData.get("city") ?? "").trim();

  if (!shipmentId || !eventType) {
    return { ok: false, error: "Tipo de evento obrigatório." };
  }

  // valida que a remessa é da org
  const { data: ship } = await supabase
    .from("shipments")
    .select("id, organization_id")
    .eq("id", shipmentId)
    .maybeSingle();
  if (!ship || (ship as { organization_id: string }).organization_id !== ctx.org.id) {
    return { ok: false, error: "Remessa não encontrada." };
  }

  const { error } = await supabase.from("tracking_events").insert({
    shipment_id: shipmentId,
    event_type: eventType,
    description: description || null,
    location_json: city ? { city } : null,
    created_by: ctx.user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/app/operacao/shipments/${shipmentId}`);
  return { ok: true };
}

export async function markShipmentDelivered(formData: FormData) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const shipmentId = String(formData.get("shipment_id") ?? "");
  if (!shipmentId) return { ok: false, error: "ID inválido." };

  const { error } = await supabase
    .from("shipments")
    .update({
      status: "entregue",
      delivered_at: new Date().toISOString(),
    })
    .eq("id", shipmentId)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: error.message };

  // registra evento automaticamente
  await supabase.from("tracking_events").insert({
    shipment_id: shipmentId,
    event_type: "entregue",
    description: "Marcado como entregue pelo painel operacional.",
    created_by: ctx.user.id,
  });

  revalidatePath(`/app/operacao/shipments/${shipmentId}`);
  revalidatePath(`/app/operacao/shipments`);
  return { ok: true };
}
