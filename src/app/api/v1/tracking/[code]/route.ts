import { type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { v1Json, v1Error, v1Options } from "../../_lib";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/tracking/:code — público, sem auth.
 * Wrapper sobre RPC `get_public_shipment_tracking`. Retorna 404 se a RPC
 * não existir ou se o código não for encontrado.
 */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ code: string }> }) {
  const { code } = await ctx.params;
  if (!code) return v1Error("Código obrigatório.", 400);
  const admin = createAdminClient();
  try {
    // @ts-expect-error RPC pública pode não estar nos types
    const { data, error } = await admin.rpc("get_public_shipment_tracking", {
      p_code: code,
    });
    if (error) return v1Error(error.message, 404, "not_found");
    if (!data) return v1Error("Rastreamento não encontrado.", 404, "not_found");
    return v1Json({ data });
  } catch (e) {
    return v1Error(e instanceof Error ? e.message : "Erro", 500);
  }
}

export { v1Options as OPTIONS };
