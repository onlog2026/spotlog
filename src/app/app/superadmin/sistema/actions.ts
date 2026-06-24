"use server";

import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { createAdminClient } from "@/lib/superadmin/admin-client";

export async function reloadPostgrestSchema() {
  await requireSuperAdmin();
  const admin = createAdminClient();
  try {
    // pg_notify('pgrst', 'reload schema') — força PostgREST reler o schema
    // @ts-expect-error rpc não tipado
    const { error } = await admin.rpc("pg_notify", {
      channel: "pgrst",
      payload: "reload schema",
    });
    if (error) {
      // Fallback: via raw SQL não disponível no PostgREST padrão.
      // Documenta a limitação pra ação manual.
      return {
        ok: false,
        message: `RPC pg_notify não disponível. Execute manualmente no SQL editor: NOTIFY pgrst, 'reload schema';`,
      };
    }
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "Erro desconhecido",
    };
  }
}
