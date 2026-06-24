/**
 * Spotlog SDR - LGPD Engine
 *
 * Gerencia consentimento, opt-out, suppression list e geração de URLs
 * unsubscribe assinados (HMAC). Não envia outbound sem checar `isSafeToContact`.
 */
import crypto from "crypto";
import { getSdrClient } from "@/lib/sdr/db";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = any;

export type LegalBasis =
  | "consentimento"
  | "interesse_legitimo"
  | "execucao_contrato"
  | "obrigacao_legal";

export type ConsentType =
  | "opt_in"
  | "opt_out"
  | "legitimate_interest"
  | "unsubscribed";

export interface RecordConsentInput {
  orgId: string;
  contactId?: string | null;
  email?: string | null;
  phone?: string | null;
  consentType?: ConsentType;
  legalBasis: LegalBasis;
  source?: string;
  ip?: string | null;
  userAgent?: string | null;
  expiresAt?: string | null;
  notes?: string;
}

export interface RecordOptOutInput {
  orgId: string;
  email?: string | null;
  phone?: string | null;
  reason: string;
  source?: string;
}

const UNSUBSCRIBE_SECRET =
  process.env.UNSUBSCRIBE_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  process.env.SUPABASE_JWT_SECRET ||
  "spotlog-default-unsubscribe-secret-change-me";

/**
 * Registra consentimento (opt-in, interesse legítimo) de um contato.
 */
export async function recordConsent(input: RecordConsentInput) {
  const supabase = await getSdrClient();
  const consentType: ConsentType =
    input.consentType ??
    (input.legalBasis === "interesse_legitimo"
      ? "legitimate_interest"
      : "opt_in");

  const { data, error } = await supabase
    .from("lead_consents")
    .insert({
      organization_id: input.orgId,
      contact_id: input.contactId ?? null,
      email: input.email?.toLowerCase().trim() || null,
      phone: input.phone?.replace(/\D/g, "") || null,
      consent_type: consentType,
      legal_basis: input.legalBasis,
      source: input.source ?? "manual",
      ip_address: input.ip ?? null,
      user_agent: input.userAgent ?? null,
      expires_at: input.expiresAt ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single();

  if (error) throw new Error(`Falha ao registrar consentimento: ${error.message}`);
  return data;
}

/**
 * Registra opt-out e adiciona à suppression list em uma transação lógica.
 */
export async function recordOptOut(input: RecordOptOutInput) {
  const supabase = await getSdrClient();
  const email = input.email?.toLowerCase().trim() || null;
  const phone = input.phone?.replace(/\D/g, "") || null;

  if (!email && !phone) {
    throw new Error("Opt-out exige email ou telefone.");
  }

  // 1. Registra consentimento opt_out
  await supabase.from("lead_consents").insert({
    organization_id: input.orgId,
    email,
    phone,
    consent_type: "opt_out",
    legal_basis: "consentimento",
    source: input.source ?? "user_request",
    notes: input.reason,
  });

  // 2. Adiciona à suppression list (upsert manual via try/catch — unique constraint)
  if (email) {
    await supabase
      .from("suppression_list")
      .upsert(
        {
          organization_id: input.orgId,
          email,
          reason: input.reason,
        },
        { onConflict: "organization_id,email", ignoreDuplicates: true },
      );
  }
  if (phone) {
    await supabase
      .from("suppression_list")
      .upsert(
        {
          organization_id: input.orgId,
          phone,
          reason: input.reason,
        },
        { onConflict: "organization_id,phone", ignoreDuplicates: true },
      );
  }

  return { success: true };
}

/**
 * Checa se contato pode receber outbound — combina suppression + consentimento.
 * Usa RPC `is_outbound_safe` (definida na migration).
 */
export async function isSafeToContact(
  orgId: string,
  email?: string | null,
  phone?: string | null,
): Promise<boolean> {
  if (!email && !phone) return false;
  const supabase = await getSdrClient();
  const { data, error } = await supabase.rpc("is_outbound_safe", {
    p_org: orgId,
    p_email: email?.toLowerCase().trim() ?? null,
    p_phone: phone?.replace(/\D/g, "") ?? null,
  });
  if (error) {
    console.error("[lgpd.isSafeToContact]", error);
    return false;
  }
  return Boolean(data);
}

/**
 * Gera token HMAC-SHA256 para link de unsubscribe 1-clique.
 */
export function signUnsubscribeToken(contactId: string, email?: string): string {
  const payload = `${contactId}:${email ?? ""}`;
  return crypto
    .createHmac("sha256", UNSUBSCRIBE_SECRET)
    .update(payload)
    .digest("hex")
    .slice(0, 32);
}

export function verifyUnsubscribeToken(
  contactId: string,
  email: string | undefined,
  token: string,
): boolean {
  const expected = signUnsubscribeToken(contactId, email);
  // timing-safe compare
  if (token.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

/**
 * Monta URL absoluta de unsubscribe para colocar no rodapé de e-mails.
 */
export function getUnsubscribeUrl(
  contactId: string,
  email?: string,
  baseUrl?: string,
): string {
  const token = signUnsubscribeToken(contactId, email);
  const base =
    baseUrl ||
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://spotlog-nine.vercel.app";
  const params = new URLSearchParams({ c: contactId, t: token });
  if (email) params.set("e", email);
  return `${base.replace(/\/$/, "")}/unsubscribe?${params.toString()}`;
}

/**
 * Resolve contato (pelo id ou pelo email) para o flow público de unsubscribe.
 * Usa admin client (sem RLS) porque o usuário não está autenticado.
 */
export async function publicUnsubscribe(
  contactId: string,
  token: string,
  email?: string,
) {
  // Usa service-role pra contornar RLS (usuário não autenticado)
  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient() as unknown as AnyClient;

  // Busca contato
  const { data: contact } = await supabase
    .from("contacts")
    .select("id, organization_id, email, phone")
    .eq("id", contactId)
    .maybeSingle();

  if (!contact) throw new Error("Contato não encontrado.");

  const resolvedEmail = email ?? contact.email ?? undefined;
  if (!verifyUnsubscribeToken(contactId, resolvedEmail, token)) {
    throw new Error("Token inválido.");
  }

  // Marca contato
  await supabase
    .from("contacts")
    .update({
      do_not_contact: true,
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", contactId);

  // Registra opt-out + suppression (chamada direta evitando RLS)
  await supabase.from("lead_consents").insert({
    organization_id: contact.organization_id,
    contact_id: contactId,
    email: contact.email?.toLowerCase().trim() || null,
    phone: contact.phone?.replace(/\D/g, "") || null,
    consent_type: "opt_out",
    legal_basis: "consentimento",
    source: "unsubscribe_link",
    notes: "Opt-out via link de unsubscribe (1-clique)",
  });

  if (contact.email) {
    await supabase
      .from("suppression_list")
      .upsert(
        {
          organization_id: contact.organization_id,
          email: contact.email.toLowerCase().trim(),
          reason: "Unsubscribe 1-clique (LGPD)",
        },
        { onConflict: "organization_id,email", ignoreDuplicates: true },
      );
  }
  if (contact.phone) {
    await supabase
      .from("suppression_list")
      .upsert(
        {
          organization_id: contact.organization_id,
          phone: contact.phone.replace(/\D/g, ""),
          reason: "Unsubscribe 1-clique (LGPD)",
        },
        { onConflict: "organization_id,phone", ignoreDuplicates: true },
      );
  }

  return { success: true, email: contact.email };
}
