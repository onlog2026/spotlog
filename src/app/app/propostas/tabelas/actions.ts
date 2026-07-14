"use server";
import { revalidatePath } from "next/cache";
import { requireOrgModule } from "@/lib/entitlements";
import { createClient } from "@/lib/supabase/server";

export async function excluirItemAction(formData: FormData) {
  const ctx = await requireOrgModule("propostas");
  const productId = String(formData.get("product_id") ?? "");
  const tableId = String(formData.get("table_id") ?? "");
  if (!productId || !tableId) throw new Error("Dados obrigatórios faltando.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/app/propostas/tabelas/${tableId}`);
}

export async function adicionarItemAction(formData: FormData) {
  const ctx = await requireOrgModule("propostas");
  const tableId = String(formData.get("table_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const priceRaw = String(formData.get("price") ?? "").replace(",", ".");
  const price = Number(priceRaw);
  if (!tableId || !name || Number.isNaN(price)) {
    throw new Error("Preencha nome e preço válidos.");
  }
  const unit = String(formData.get("unit") ?? "un").trim() || "un";
  const sku = String(formData.get("sku") ?? "").trim() || null;
  const category = String(formData.get("category") ?? "").trim() || null;

  const supabase = await createClient();
  const { error } = await supabase.from("products").insert({
    organization_id: ctx.org.id,
    price_table_id: tableId,
    name,
    sku,
    unit,
    category,
    price,
  });
  if (error) throw new Error(error.message);

  revalidatePath(`/app/propostas/tabelas/${tableId}`);
}

export async function renomearTabelaAction(formData: FormData) {
  const ctx = await requireOrgModule("propostas");
  const tableId = String(formData.get("table_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!tableId || !name) throw new Error("Nome obrigatório.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("price_tables")
    .update({ name })
    .eq("id", tableId)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/app/propostas/tabelas/${tableId}`);
  revalidatePath("/app/propostas/tabelas");
}
