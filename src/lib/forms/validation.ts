import { z, type ZodTypeAny } from "zod";
import type { FormField, FormPayload } from "./types";

export function buildZodSchema(fields: FormField[]) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const field of fields) {
    if (!field.active) continue;
    let base: ZodTypeAny;

    switch (field.type) {
      case "email":
        base = z.string().email("E-mail invalido");
        break;
      case "url":
        base = z.string().url("URL invalida");
        break;
      case "number":
        base = z.preprocess(
          (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
          z.number({ invalid_type_error: "Numero invalido" }),
        );
        break;
      case "date":
        base = z.string().regex(/^\d{4}-\d{2}-\d{2}/, "Data invalida");
        break;
      case "phone":
        base = z.string().min(8, "Telefone invalido");
        break;
      case "textarea":
      case "text":
      case "hidden":
        base = z.string();
        break;
      case "select":
      case "radio":
        base = z.string();
        break;
      case "checkbox":
        base = z.union([z.array(z.string()), z.string(), z.boolean()]);
        break;
      default:
        base = z.string();
    }

    if (typeof field.validation?.min_length === "number" && base instanceof z.ZodString) {
      base = base.min(field.validation.min_length, `Minimo de ${field.validation.min_length} caracteres`);
    }
    if (typeof field.validation?.max_length === "number" && base instanceof z.ZodString) {
      base = base.max(field.validation.max_length, `Maximo de ${field.validation.max_length} caracteres`);
    }
    if (field.validation?.pattern && base instanceof z.ZodString) {
      try {
        base = base.regex(new RegExp(field.validation.pattern), "Formato invalido");
      } catch {
        // pattern invalido, ignora
      }
    }

    if (field.required) {
      if (base instanceof z.ZodString) {
        base = base.min(1, `${field.label} e obrigatorio`);
      }
    } else {
      base = base.optional().or(z.literal("").transform(() => undefined));
    }

    shape[field.field_key] = base;
  }
  return z.object(shape);
}

export function validatePayload(fields: FormField[], payload: unknown) {
  const schema = buildZodSchema(fields);
  const result = schema.safeParse(payload);
  if (result.success) return { ok: true as const, data: result.data as FormPayload };
  return {
    ok: false as const,
    errors: result.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
  };
}
