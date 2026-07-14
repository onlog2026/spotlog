"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { createAdminClient } from "@/lib/superadmin/admin-client";

const keySchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9_]+$/, "Use só minúsculas, números e _");

function db() {
  return createAdminClient() as unknown as { from: (t: string) => any };
}

/**
 * LIGA/DESLIGA o enforcement de módulos (Eixo A) para toda a plataforma.
 * DESLIGADO (padrão): as escolhas por org ficam salvas mas não bloqueiam nada.
 * LIGADO: cada org passa a ver só os módulos liberados (override → plano).
 * Antes de ligar, as orgs devem estar semeadas pra não perder acesso.
 */
export async function setEnforcement(on: boolean) {
  await requireSuperAdmin();
  const { error } = await db()
    .from("platform_settings")
    .upsert(
      { key: "entitlements_enforced", value: on },
      { onConflict: "key" },
    );
  if (error) throw new Error(`Falha ao ${on ? "ligar" : "desligar"} enforcement: ${error.message}`);
  revalidatePath("/app/superadmin/modulos");
  revalidatePath("/app/superadmin/planos");
  revalidatePath("/app/superadmin/organizacoes", "layout");
  return { ok: true, enforced: on };
}

/** Cria ou edita um módulo do catálogo (fonte da verdade da venda). */
export async function upsertModule(formData: FormData) {
  await requireSuperAdmin();
  const key = keySchema.parse(String(formData.get("key") ?? ""));
  const label = z.string().trim().min(1).max(80).parse(String(formData.get("label") ?? ""));
  const group = z.string().trim().max(40).parse(String(formData.get("group") ?? "")) || null;
  const description =
    z.string().trim().max(280).parse(String(formData.get("description") ?? "")) || null;
  const sort = z.number().int().parse(Number(formData.get("sort") ?? 0) || 0);
  const isAddon = String(formData.get("is_addon") ?? "off") === "on";

  const { error } = await db()
    .from("modules")
    .upsert(
      {
        key,
        label,
        module_group: group,
        description,
        sort_order: sort,
        is_addon: isAddon,
      },
      { onConflict: "key" },
    );
  if (error) throw new Error(`Falha ao salvar módulo: ${error.message}`);

  revalidatePath("/app/superadmin/modulos");
  revalidatePath("/app/superadmin/planos");
  return { ok: true };
}

/** Ativa/desativa um módulo no catálogo. Desativado → has_org_module retorna false. */
export async function toggleModuleActive(key: string, active: boolean) {
  await requireSuperAdmin();
  keySchema.parse(key);
  const { error } = await db().from("modules").update({ active }).eq("key", key);
  if (error) throw new Error(`Falha ao atualizar módulo: ${error.message}`);

  revalidatePath("/app/superadmin/modulos");
  revalidatePath("/app/superadmin/planos");
  return { ok: true };
}

/**
 * Exclui um módulo do catálogo. As linhas em plan_modules/org_modules caem
 * junto (FK ON DELETE CASCADE). ATENÇÃO: se a chave é usada no código
 * (nav + requireOrgModule), o módulo passa a ser "não gerenciado" → liberado
 * pra todos. Por isso a exclusão exige dupla confirmação no botão.
 */
export async function deleteModule(key: string) {
  await requireSuperAdmin();
  keySchema.parse(key);
  const { error } = await db().from("modules").delete().eq("key", key);
  if (error) throw new Error(`Falha ao excluir módulo: ${error.message}`);

  revalidatePath("/app/superadmin/modulos");
  revalidatePath("/app/superadmin/planos");
  return { ok: true };
}
