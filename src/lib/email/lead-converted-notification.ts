import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/integrations/email";

type ConvertedEmailResult = {
  ok: boolean;
  sent: number;
  skipped?: string;
  errors?: string[];
};

/**
 * Envia email "Parabéns! Lead X foi convertido por Y" para owners/admins/managers
 * da organização. Best-effort — nunca lança.
 *
 * Requer integração Resend configurada na org (admin/integrações).
 * Se não houver, loga "would_send" e retorna ok:false com skipped.
 */
export async function sendConvertedEmail(
  orgId: string,
  leadId: string,
): Promise<ConvertedEmailResult> {
  try {
    const admin = createAdminClient();

    const { data: lead } = await admin
      .from("leads")
      .select(
        "id, full_name, email, company_name, assigned_to, converted_at, organization_id",
      )
      .eq("id", leadId)
      .eq("organization_id", orgId)
      .maybeSingle();
    if (!lead) return { ok: false, skipped: "lead not found", sent: 0 };

    const leadRow = lead as {
      id: string;
      full_name: string | null;
      email: string | null;
      company_name: string | null;
      assigned_to: string | null;
      converted_at: string | null;
    };

    // Owner / responsável
    let ownerName: string | null = null;
    if (leadRow.assigned_to) {
      const { data: ownerProfile } = await admin
        .from("profiles")
        .select("full_name, email")
        .eq("id", leadRow.assigned_to)
        .maybeSingle();
      ownerName =
        (ownerProfile as { full_name?: string | null } | null)?.full_name ??
        (ownerProfile as { email?: string | null } | null)?.email ??
        null;
    }

    // Destinatários: owners/admins/managers da org
    const { data: members } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("organization_id", orgId)
      .in("role", ["owner", "admin", "manager"]);
    const ids = (members ?? []).map((m: { user_id: string }) => m.user_id);
    if (ids.length === 0) return { ok: false, skipped: "no admins", sent: 0 };

    const { data: profiles } = await admin
      .from("profiles")
      .select("email, full_name")
      .in("id", ids);

    const recipients = (profiles ?? [])
      .map((p: { email?: string | null }) => p.email)
      .filter((e): e is string => typeof e === "string" && e.includes("@"));
    if (recipients.length === 0)
      return { ok: false, skipped: "no recipient emails", sent: 0 };

    const leadDisplay =
      leadRow.full_name ?? leadRow.email ?? leadRow.company_name ?? "Lead";
    const ownerDisplay = ownerName ?? "um membro do time";

    const subject = `🎉 Lead convertido: ${leadDisplay}`;
    const html = `
<!DOCTYPE html>
<html><body style="margin:0;padding:0;font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;background:#f6f7fb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f6f7fb;padding:24px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(1,25,96,0.08);">
        <tr><td style="background:linear-gradient(135deg,#011960 0%,#BA0102 100%);padding:32px 32px 28px;color:#fff;">
          <div style="font-size:48px;line-height:1;">🎉</div>
          <h1 style="margin:12px 0 4px;font-size:24px;font-weight:800;">Lead convertido!</h1>
          <p style="margin:0;opacity:.92;font-size:14px;">Mais um cliente fechado no Spotlog</p>
        </td></tr>
        <tr><td style="padding:28px 32px;color:#1f2937;font-size:15px;line-height:1.55;">
          <p style="margin:0 0 12px;">Parabéns, time! <strong>${escapeHtml(ownerDisplay)}</strong> acabou de converter um lead em cliente:</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-radius:12px;padding:16px;margin:8px 0 20px;">
            <tr><td>
              <div style="font-size:18px;font-weight:700;color:#011960;">${escapeHtml(leadDisplay)}</div>
              ${leadRow.company_name ? `<div style="font-size:13px;color:#4b5563;margin-top:4px;">🏢 ${escapeHtml(leadRow.company_name)}</div>` : ""}
              ${leadRow.email ? `<div style="font-size:13px;color:#4b5563;margin-top:2px;">✉ ${escapeHtml(leadRow.email)}</div>` : ""}
            </td></tr>
          </table>
          <p style="margin:0 0 20px;color:#4b5563;font-size:13px;">Veja o histórico completo do lead no CRM e mantenha o follow-up afiado.</p>
          <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/app/leads/${leadRow.id}" style="display:inline-block;background:#BA0102;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:600;font-size:14px;">Abrir lead no Spotlog →</a>
        </td></tr>
        <tr><td style="padding:18px 32px;background:#f9fafb;color:#9ca3af;font-size:11px;text-align:center;">
          Spotlog · CRM e prospecção · enviado automaticamente
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
    const text = `Lead convertido! ${ownerDisplay} acabou de converter ${leadDisplay}${leadRow.company_name ? ` (${leadRow.company_name})` : ""}.`;

    const results = await Promise.all(
      recipients.map((to) =>
        sendEmail({ organization_id: orgId, to, subject, html, text }).catch(
          (e: unknown) => ({
            ok: false,
            error: e instanceof Error ? e.message : "send failed",
          }),
        ),
      ),
    );

    const sent = results.filter((r) => r.ok).length;
    const errors = results
      .filter((r) => !r.ok)
      .map((r) => (r as { error?: string }).error ?? "unknown");
    if (sent === 0) {
      console.warn("[lead-converted-notification] would_send", {
        leadId,
        recipients: recipients.length,
        errors,
      });
      return { ok: false, sent: 0, skipped: "send failed", errors };
    }
    return { ok: true, sent, errors: errors.length ? errors : undefined };
  } catch (err) {
    console.warn("[lead-converted-notification] failed", err);
    return {
      ok: false,
      sent: 0,
      skipped: err instanceof Error ? err.message : "unexpected error",
    };
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
