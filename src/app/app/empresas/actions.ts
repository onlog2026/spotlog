"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const CompanySchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  legal_name: z.string().optional().nullable(),
  cnpj: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  size: z.string().optional().nullable(),
  domain: z.string().optional().nullable(),
  website: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  email: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  zipcode: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

function parseForm(formData: FormData) {
  const v = (key: string) => {
    const raw = formData.get(key);
    if (raw === null) return null;
    const s = String(raw).trim();
    return s === "" ? null : s;
  };
  return {
    name: String(formData.get("name") ?? "").trim(),
    legal_name: v("legal_name"),
    cnpj: v("cnpj"),
    industry: v("industry"),
    size: v("size"),
    domain: v("domain"),
    website: v("website"),
    phone: v("phone"),
    email: v("email"),
    address: v("address"),
    cep: v("cep"),
    street: v("street"),
    number: v("number"),
    complement: v("complement"),
    neighborhood: v("neighborhood"),
    city: v("city"),
    state: v("state")?.toUpperCase() ?? null,
    zipcode: v("cep") ?? v("zipcode"),
    country: v("country") ?? "BR",
    linkedin_url: v("linkedin_url"),
    description: v("description"),
    notes: v("notes"),
  };
}

export async function createCompany(formData: FormData) {
  const ctx = await requireSession();
  const parsed = CompanySchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    redirect(`/app/empresas/nova?error=${encodeURIComponent(msg)}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({
      organization_id: ctx.org.id,
      owner_id: ctx.user.id,
      source: "manual",
      ...parsed.data,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(
      `/app/empresas/nova?error=${encodeURIComponent(error?.message ?? "Falha ao criar.")}`,
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "company",
    entity_id: data.id,
    action: "create",
    diff: parsed.data,
  });

  revalidatePath("/app/empresas");
  redirect(`/app/empresas/${data.id}?created=1`);
}

export async function updateCompany(id: string, formData: FormData) {
  const ctx = await requireSession();
  const parsed = CompanySchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    redirect(`/app/empresas/${id}/editar?error=${encodeURIComponent(msg)}`);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);

  if (error) {
    redirect(
      `/app/empresas/${id}/editar?error=${encodeURIComponent(error.message)}`,
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "company",
    entity_id: id,
    action: "update",
    diff: parsed.data,
  });

  revalidatePath("/app/empresas");
  revalidatePath(`/app/empresas/${id}`);
  redirect(`/app/empresas/${id}?updated=1`);
}

export async function deleteCompany(id: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id);

  if (error) {
    redirect(`/app/empresas/${id}?error=${encodeURIComponent(error.message)}`);
  }
  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "company",
    entity_id: id,
    action: "delete",
  });

  revalidatePath("/app/empresas");
  redirect("/app/empresas?deleted=1");
}
