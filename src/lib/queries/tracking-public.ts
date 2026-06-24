import { createClient } from "@/lib/supabase/server";

export type PublicTrackingEvent = {
  event_type: string;
  description: string | null;
  occurred_at: string;
};

export type PublicTrackingShipment = {
  code: string;
  status: string;
  recipient_name_masked: string;
  destination_city: string | null;
  destination_uf: string | null;
  sla_deadline: string | null;
  delivered_at: string | null;
  created_at: string;
  org_name: string | null;
  org_logo_url: string | null;
  events: PublicTrackingEvent[];
};

/**
 * Busca dados públicos de rastreio.
 * Usa a function security definer `get_public_shipment_tracking`
 * que mascara nome do destinatário e expõe só city/UF.
 */
export async function getPublicShipmentTracking(
  code: string,
): Promise<PublicTrackingShipment | null> {
  if (!code || !code.trim()) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_public_shipment_tracking", {
    p_code: code.trim(),
  });
  if (error) {
    console.error("[tracking-public] rpc error", error);
    return null;
  }
  if (!data) return null;
  return data as PublicTrackingShipment;
}

/**
 * Lista os 3 últimos shipments só com code+status pra demo.
 * Usado pelo form de rastreamento como sugestão.
 * TODO: remover quando sair do demo.
 */
export async function getDemoShipmentCodes(): Promise<
  Array<{ code: string; status: string }>
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("shipments")
    .select("code, status")
    .order("created_at", { ascending: false })
    .limit(3);
  if (error || !data) return [];
  return data as Array<{ code: string; status: string }>;
}
