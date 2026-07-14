"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin } from "@/lib/superadmin/guard";
import { createAdminClient } from "@/lib/superadmin/admin-client";
import { countOrgsByPlan } from "@/lib/superadmin/entitlements-admin";

const keySchema = z
  .string()
  .trim()
  .min(2)
  .max(40)
  .regex(/^[a-z0-9_]+$/, "Use só minúsculas, números e _");

function db() {
  return createAdminClient() as unknown as { from: (t: string) => any };
}

/** Cria ou edita um plano. */
export async function upsertPlan(formData: FormData) {
  await requireSuperAdmin();
  const key = keySchema.parse(String(formData.get("key") ?? ""));
  const name = z.string().trim().min(1).max(80).parse(String(formData.get("name") ?? ""));
  const priceReais = z
    .number()
    .min(0)
    .parse(Number(String(formData.get("price") ?? "0").replace(",", ".")) || 0);
  const sort = z.number().int().parse(Number(formData.get("sort") ?? 0) || 0);
  const active = String(formData.get("active") ?? "on") !== "off";

  const { error } = await db()
    .from("plans")
    .upsert(
      {
        key,
        name,
        price_cents: Math.round(priceReais * 100),
        sort_order: sort,
        active,
      },
      { onConflict: "key" },
    );
  if (error) throw new Error(`Falha ao salvar plano: ${error.message}`);

  revalidatePath("/app/superadmin/planos");
  return { ok: true };
}

/** Liga/desliga um módulo dentro de um plano (linha em plan_modules). */
export async function togglePlanModule(
  planKey: string,
  moduleKey: string,
  enabled: boolean,
) {
  await requireSuperAdmin();
  keySchema.parse(planKey);
  keySchema.parse(moduleKey);
  const admin = db();

  if (enabled) {
    const { error } = await admin
      .from("plan_modules")
      .upsert({ plan_key: planKey, module_key: moduleKey }, { onConflict: "plan_key,module_key" });
    if (error) throw new Error(`Falha ao ligar módulo no plano: ${error.message}`);
  } else {
    const { error } = await admin
      .from("plan_modules")
      .delete()
      .eq("plan_key", planKey)
      .eq("module_key", moduleKey);
    if (error) throw new Error(`Falha ao desligar módulo do plano: ${error.message}`);
  }

  revalidatePath("/app/superadmin/planos");
  return { ok: true };
}

/** Exclui um plano — bloqueado se alguma org o usa (evita órfã ao ligar enforcement). */
export async function deletePlan(planKey: string) {
  await requireSuperAdmin();
  keySchema.parse(planKey);
  if (planKey === "free") throw new Error("O plano 'free' é o padrão do sistema e não pode ser excluído.");

  const counts = await countOrgsByPlan();
  if ((counts[planKey] ?? 0) > 0) {
    throw new Error(
      `Plano em uso por ${counts[planKey]} organização(ões). Migre-as antes de excluir.`,
    );
  }

  const { error } = await db().from("plans").delete().eq("key", planKey);
  if (error) throw new Error(`Falha ao excluir plano: ${error.message}`);

  revalidatePath("/app/superadmin/planos");
  return { ok: true };
}
