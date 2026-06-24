import { createClient as createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { FormDefinition, FormField, FormSubmission } from "./types";

export interface FormWithFields {
  definition: FormDefinition;
  fields: FormField[];
}

function normalizeDefinition(row: Record<string, unknown>): FormDefinition {
  return {
    id: row.id as string,
    organization_id: row.organization_id as string,
    slug: row.slug as string,
    title: row.title as string,
    description: (row.description as string | null) ?? null,
    submit_label: row.submit_label as string,
    success_title: row.success_title as string,
    success_message: row.success_message as string,
    lead_source: row.lead_source as string,
    lead_source_detail: (row.lead_source_detail as string | null) ?? null,
    redirect_url: (row.redirect_url as string | null) ?? null,
    notify_emails: (row.notify_emails as string[] | null) ?? [],
    active: Boolean(row.active),
    show_consent: Boolean(row.show_consent),
    consent_text: (row.consent_text as string | null) ?? null,
    created_at: row.created_at as string | undefined,
    updated_at: row.updated_at as string | undefined,
  };
}

function normalizeField(row: Record<string, unknown>): FormField {
  return {
    id: row.id as string,
    form_id: row.form_id as string,
    field_key: row.field_key as string,
    type: row.type as FormField["type"],
    label: row.label as string,
    placeholder: (row.placeholder as string | null) ?? null,
    help_text: (row.help_text as string | null) ?? null,
    required: Boolean(row.required),
    options: Array.isArray(row.options) ? (row.options as FormField["options"]) : [],
    validation:
      row.validation && typeof row.validation === "object"
        ? (row.validation as FormField["validation"])
        : {},
    width: (row.width as FormField["width"]) ?? "full",
    sort: Number(row.sort ?? 0),
    maps_to_lead: (row.maps_to_lead as string | null) ?? null,
    active: row.active === undefined ? true : Boolean(row.active),
  };
}

/**
 * Carrega form pelo slug. Usa RPC `fb_get_form_by_slug` (bypass PostgREST schema cache).
 * Retorna apenas formulários ATIVOS com campos ATIVOS.
 */
export async function getFormBySlug(slug: string): Promise<FormWithFields | null> {
  const supabase = createAdminClient();
  // @ts-expect-error rpc dinâmico não tipado
  const { data, error } = await supabase.rpc("fb_get_form_by_slug", { p_slug: slug });
  if (error || !data) return null;
  const obj = data as { definition?: Record<string, unknown>; fields?: Array<Record<string, unknown>> };
  if (!obj?.definition) return null;
  return {
    definition: normalizeDefinition(obj.definition),
    fields: (obj.fields ?? []).map(normalizeField),
  };
}

/** Admin: carrega form pelo id, mesmo se inativo, com TODOS os campos. */
export async function getFormByIdForAdmin(id: string, orgId: string): Promise<FormWithFields | null> {
  const supabase = await createServerClient();
  // @ts-expect-error rpc dinâmico não tipado
  const { data, error } = await supabase.rpc("fb_get_form_by_id", { p_id: id, p_org: orgId });
  if (error || !data) return null;
  const obj = data as { definition?: Record<string, unknown>; fields?: Array<Record<string, unknown>> };
  if (!obj?.definition) return null;
  return {
    definition: normalizeDefinition(obj.definition),
    fields: (obj.fields ?? []).map(normalizeField),
  };
}

export interface FormListItem extends FormDefinition {
  fields_count: number;
  submissions_total: number;
  submissions_7d: number;
}

export async function listForms(orgId: string): Promise<FormListItem[]> {
  const supabase = await createServerClient();
  // @ts-expect-error rpc dinâmico não tipado
  const { data, error } = await supabase.rpc("fb_list_forms", { p_org: orgId });
  if (error || !data) return [];
  const arr = (data as Array<Record<string, unknown>>) ?? [];
  return arr.map((d) => {
    const def = normalizeDefinition(d);
    return {
      ...def,
      fields_count: Number(d.fields_count ?? 0),
      submissions_total: Number(d.submissions_total ?? 0),
      submissions_7d: Number(d.submissions_7d ?? 0),
    };
  });
}

export interface SubmissionWithLead extends FormSubmission {
  lead?: {
    id: string;
    full_name: string | null;
    email: string | null;
    company_name: string | null;
  } | null;
}

export async function getSubmissions(
  formId: string,
  orgId: string,
  opts: { limit?: number; offset?: number; search?: string; since?: string } = {},
): Promise<SubmissionWithLead[]> {
  const supabase = await createServerClient();
  // @ts-expect-error rpc dinâmico não tipado
  const { data } = await supabase.rpc("fb_get_submissions", {
    p_form_id: formId,
    p_org: orgId,
    p_limit: opts.limit ?? 50,
    p_offset: opts.offset ?? 0,
  });
  let rows = ((data ?? []) as unknown as SubmissionWithLead[]);
  if (opts.search) {
    const s = opts.search.toLowerCase();
    rows = rows.filter((row) => JSON.stringify(row.payload).toLowerCase().includes(s));
  }
  return rows;
}
