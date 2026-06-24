"use server";

import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateApiKey } from "@/lib/api-auth";

export type CreateApiKeyResult = {
  ok: true;
  token: string;
  prefix: string;
  name: string;
  id: string;
} | {
  ok: false;
  error: string;
};

export async function createApiKey(input: {
  name: string;
  scopes: string[];
  expires_days?: number | null;
}): Promise<CreateApiKeyResult> {
  const ctx = await requireRole(["owner", "admin"]);

  const name = input.name.trim();
  if (!name) return { ok: false, error: "Nome obrigatório." };

  const scopes = (input.scopes ?? []).filter((s) =>
    ["tickets:read", "tickets:write", "orders:webhook"].includes(s),
  );
  if (scopes.length === 0) {
    return { ok: false, error: "Selecione pelo menos um escopo." };
  }

  const { token, hash, prefix } = generateApiKey();
  const admin = createAdminClient();

  const expiresAt = input.expires_days
    ? new Date(Date.now() + input.expires_days * 86_400_000).toISOString()
    : null;

  const { data, error } = await admin
    .from("integration_api_keys")
    .insert({
      organization_id: ctx.org.id,
      name,
      token_hash: hash,
      token_prefix: prefix,
      scopes,
      active: true,
      created_by: ctx.user.id,
      expires_at: expiresAt,
    })
    .select("id")
    .single();

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Erro ao salvar." };
  }

  revalidatePath("/app/admin/api-keys");
  return { ok: true, token, prefix, name, id: data.id };
}

export async function revokeApiKey(id: string): Promise<{ ok: boolean; error?: string }> {
  const ctx = await requireRole(["owner", "admin"]);
  const admin = createAdminClient();
  const { error } = await admin
    .from("integration_api_keys")
    .update({ active: false })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/app/admin/api-keys");
  return { ok: true };
}
