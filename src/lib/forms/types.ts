export type FieldType =
  | "text"
  | "email"
  | "phone"
  | "textarea"
  | "select"
  | "radio"
  | "checkbox"
  | "number"
  | "date"
  | "url"
  | "hidden"
  | "datetime_slot";

export type FieldWidth = "full" | "half" | "third";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldValidation {
  min_length?: number;
  max_length?: number;
  pattern?: string;
  min?: number;
  max?: number;
}

export interface FormField {
  id: string;
  form_id: string;
  field_key: string;
  type: FieldType;
  label: string;
  placeholder: string | null;
  help_text: string | null;
  required: boolean;
  options: FieldOption[];
  validation: FieldValidation;
  width: FieldWidth;
  sort: number;
  maps_to_lead: string | null;
  active: boolean;
}

export interface FormDefinition {
  id: string;
  organization_id: string;
  slug: string;
  title: string;
  description: string | null;
  submit_label: string;
  success_title: string;
  success_message: string;
  lead_source: string;
  lead_source_detail: string | null;
  redirect_url: string | null;
  notify_emails: string[];
  active: boolean;
  show_consent: boolean;
  consent_text: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface FormSubmission {
  id: string;
  form_id: string;
  organization_id: string;
  lead_id: string | null;
  payload: Record<string, unknown>;
  source_url: string | null;
  ip: string | null;
  user_agent: string | null;
  consent_given: boolean;
  submitted_at: string;
}

export type FormPayload = Record<string, string | number | boolean | string[] | null>;

export const LEAD_COLUMNS = [
  "full_name",
  "email",
  "phone",
  "whatsapp",
  "company_name",
  "job_title",
  "message",
] as const;

export type LeadColumn = (typeof LEAD_COLUMNS)[number];
