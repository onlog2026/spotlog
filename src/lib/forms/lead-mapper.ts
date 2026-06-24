import type { FormField, FormPayload, LeadColumn } from "./types";
import { LEAD_COLUMNS } from "./types";

export interface MappedLead {
  columns: Partial<Record<LeadColumn, string>>;
  custom_fields: Record<string, unknown>;
}

const LEAD_SET = new Set<string>(LEAD_COLUMNS);

export function mapPayloadToLead(fields: FormField[], payload: FormPayload): MappedLead {
  const columns: Partial<Record<LeadColumn, string>> = {};
  const custom_fields: Record<string, unknown> = {};

  for (const field of fields) {
    const value = payload[field.field_key];
    if (value === undefined || value === null || value === "") continue;

    const mapping = field.maps_to_lead;
    if (mapping && LEAD_SET.has(mapping)) {
      const str = Array.isArray(value) ? value.join(", ") : String(value);
      columns[mapping as LeadColumn] = str;
    } else {
      custom_fields[field.field_key] = value;
    }
  }

  return { columns, custom_fields };
}
