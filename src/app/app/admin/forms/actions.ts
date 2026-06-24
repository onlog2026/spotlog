"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FieldType } from "@/lib/forms/types";

function slugify(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

// Usa RPCs em vez de .from() pra contornar o schema cache do PostgREST.

export async function createForm(input: {
  title: string;
  slug?: string;
  description?: string;
  lead_source?: string;
  lead_source_detail?: string;
}) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  const slug = slugify(input.slug || input.title);
  if (!slug) throw new Error("Slug invalido");

  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("fb_create_form", {
    p_payload: {
      organization_id: ctx.org.id,
      slug,
      title: input.title,
      description: input.description ?? null,
      lead_source: input.lead_source ?? "site",
      lead_source_detail: input.lead_source_detail ?? null,
    },
  });

  if (error) throw new Error(error.message);
  const id = data as string;
  if (!id) throw new Error("Falha ao criar formulário");
  revalidatePath("/app/admin/forms");
  redirect(`/app/admin/forms/${id}/editor`);
}

export async function saveFormDefinition(
  id: string,
  partial: Record<string, unknown>,
) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("fb_update_form", {
    p_id: id,
    p_org: ctx.org.id,
    p_patch: partial,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/admin/forms");
  revalidatePath(`/app/admin/forms/${id}/editor`);
}

export async function deleteForm(id: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("fb_delete_form", {
    p_id: id,
    p_org: ctx.org.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath("/app/admin/forms");
}

export async function addField(formId: string, type: FieldType = "text") {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data, error } = await supabase.rpc("fb_add_field", {
    p_form_id: formId,
    p_org: ctx.org.id,
    p_type: type,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/admin/forms/${formId}/editor`);
  return data as string;
}

export async function saveField(
  formId: string,
  fieldId: string,
  partial: Record<string, unknown>,
) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("fb_save_field", {
    p_form_id: formId,
    p_field_id: fieldId,
    p_org: ctx.org.id,
    p_patch: partial,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/admin/forms/${formId}/editor`);
}

export async function deleteField(formId: string, fieldId: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("fb_delete_field", {
    p_form_id: formId,
    p_field_id: fieldId,
    p_org: ctx.org.id,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/admin/forms/${formId}/editor`);
}

export async function reorderFields(formId: string, orderedIds: string[]) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { error } = await supabase.rpc("fb_reorder_fields", {
    p_form_id: formId,
    p_org: ctx.org.id,
    p_ids: orderedIds,
  });
  if (error) throw new Error(error.message);
  revalidatePath(`/app/admin/forms/${formId}/editor`);
}

export async function duplicateForm(id: string) {
  const ctx = await requireSession();
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico
  const { data } = await supabase.rpc("fb_get_form_by_id", {
    p_id: id,
    p_org: ctx.org.id,
  });
  if (!data) throw new Error("Form nao encontrado");
  const obj = data as {
    definition: Record<string, unknown>;
    fields: Array<Record<string, unknown>>;
  };
  const d = obj.definition;
  const baseSlug = `${d.slug as string}-copia`;

  // @ts-expect-error rpc dinâmico
  const { data: newId, error } = await supabase.rpc("fb_create_form", {
    p_payload: {
      organization_id: ctx.org.id,
      slug: baseSlug,
      title: `${d.title as string} (cópia)`,
      description: d.description,
      submit_label: d.submit_label,
      success_title: d.success_title,
      success_message: d.success_message,
      lead_source: d.lead_source,
      lead_source_detail: d.lead_source_detail,
      redirect_url: d.redirect_url,
      show_consent: d.show_consent,
      consent_text: d.consent_text,
      active: false,
    },
  });
  if (error) throw new Error(error.message);
  // copia campos via fb_add_field + fb_save_field
  for (const f of obj.fields ?? []) {
    // @ts-expect-error rpc dinâmico
    const { data: newFieldId } = await supabase.rpc("fb_add_field", {
      p_form_id: newId,
      p_org: ctx.org.id,
      p_type: f.type ?? "text",
    });
    if (newFieldId) {
      // @ts-expect-error rpc dinâmico
      await supabase.rpc("fb_save_field", {
        p_form_id: newId,
        p_field_id: newFieldId,
        p_org: ctx.org.id,
        p_patch: {
          field_key: f.field_key,
          label: f.label,
          placeholder: f.placeholder,
          help_text: f.help_text,
          required: f.required,
          options: f.options,
          validation: f.validation,
          width: f.width,
          maps_to_lead: f.maps_to_lead,
          active: f.active,
        },
      });
    }
  }
  revalidatePath("/app/admin/forms");
  return newId as string;
}
