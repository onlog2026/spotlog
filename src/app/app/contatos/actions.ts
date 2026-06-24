"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const ContactSchema = z.object({
  full_name: z.string().min(2, "Nome obrigatório"),
  email: z
    .string()
    .email("E-mail inválido")
    .optional()
    .nullable()
    .or(z.literal("").transform(() => null)),
  phone: z.string().optional().nullable(),
  whatsapp: z.string().optional().nullable(),
  job_title: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  seniority: z.string().optional().nullable(),
  company_id: z.string().uuid().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
  cep: z.string().optional().nullable(),
  street: z.string().optional().nullable(),
  number: z.string().optional().nullable(),
  complement: z.string().optional().nullable(),
  neighborhood: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  state: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  is_decision_maker: z.boolean().optional(),
  do_not_contact: z.boolean().optional(),
});

function parseForm(formData: FormData) {
  const v = (key: string) => {
    const raw = formData.get(key);
    if (raw === null) return null;
    const s = String(raw).trim();
    return s === "" ? null : s;
  };
  const email = v("email");
  return {
    full_name: String(formData.get("full_name") ?? "").trim(),
    email: email,
    phone: v("phone"),
    whatsapp: v("whatsapp"),
    job_title: v("job_title"),
    department: v("department"),
    seniority: v("seniority"),
    company_id: v("company_id"),
    linkedin_url: v("linkedin_url"),
    cep: v("cep"),
    street: v("street"),
    number: v("number"),
    complement: v("complement"),
    neighborhood: v("neighborhood"),
    city: v("city"),
    state: v("state")?.toUpperCase() ?? null,
    country: v("country") ?? "BR",
    is_decision_maker: formData.get("is_decision_maker") === "on",
    do_not_contact: formData.get("do_not_contact") === "on",
  };
}

export async function createContact(formData: FormData) {
  const ctx = await requireSession();
  const parsed = ContactSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    redirect(`/app/contatos/novo?error=${encodeURIComponent(msg)}`);
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contacts")
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
      `/app/contatos/novo?error=${encodeURIComponent(error?.message ?? "Falha ao criar.")}`,
    );
  }

  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "contact",
    entity_id: data.id,
    action: "create",
    diff: parsed.data,
  });

  revalidatePath("/app/contatos");
  redirect(`/app/contatos/${data.id}?created=1`);
}

export async function updateContact(id: string, formData: FormData) {
  const ctx = await requireSession();
  const parsed = ContactSchema.safeParse(parseForm(formData));
  if (!parsed.success) {
    const msg = parsed.error.issues[0]?.message ?? "Dados inválidos.";
    redirect(`/app/contatos/${id}/editar?error=${encodeURIComponent(msg)}`);
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);

  if (error) {
    redirect(
      `/app/contatos/${id}/editar?error=${encodeURIComponent(error.message)}`,
    );
  }
  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "contact",
    entity_id: id,
    action: "update",
    diff: parsed.data,
  });

  revalidatePath("/app/contatos");
  revalidatePath(`/app/contatos/${id}`);
  redirect(`/app/contatos/${id}?updated=1`);
}

export async function deleteContact(id: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    .from("contacts")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id);

  if (error) {
    redirect(`/app/contatos/${id}?error=${encodeURIComponent(error.message)}`);
  }

  await supabase.from("audit_logs").insert({
    organization_id: ctx.org.id,
    user_id: ctx.user.id,
    entity: "contact",
    entity_id: id,
    action: "delete",
  });

  revalidatePath("/app/contatos");
  redirect("/app/contatos?deleted=1");
}
