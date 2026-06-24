"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { createAdminClient } from "@/lib/superadmin/admin-client";

const uuidSchema = z.string().uuid();

export async function revokeApiKey(keyId: string) {
  await requireSuperAdmin();
  uuidSchema.parse(keyId);
  const admin = createAdminClient();
  const { error } = await admin
    .from("integration_api_keys")
    .update({ active: false })
    .eq("id", keyId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/superadmin/integracoes");
  return { ok: true };
}

export async function toggleIntegration(integId: string, makeActive: boolean) {
  await requireSuperAdmin();
  uuidSchema.parse(integId);
  const admin = createAdminClient();
  const { error } = await admin
    .from("integrations")
    .update({ is_active: makeActive })
    .eq("id", integId);
  if (error) throw new Error(error.message);
  revalidatePath("/app/superadmin/integracoes");
  return { ok: true };
}
