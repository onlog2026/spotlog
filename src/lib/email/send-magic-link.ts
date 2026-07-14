import "server-only";

/**
 * Envia magic link / convite por email via Resend.
 * Fallback gracioso: se sem Resend ou erro, retorna ok:false (caller mostra link em UI pra cópia).
 */
export async function sendMagicLinkEmail(input: {
  to: string;
  subject: string;
  preheader?: string;
  greeting?: string;
  body_html: string;
  cta_label: string;
  cta_url: string;
  footer_note?: string;
}): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return { ok: false, error: "resend_not_configured" };
  }
  const from = process.env.RESEND_FROM_EMAIL ?? "Spotlog <onboarding@resend.dev>";

  const html = renderEmail(input);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: input.to,
        subject: input.subject,
        html,
      }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 200)}` };
    }
    const json = (await res.json()) as { id?: string };
    return { ok: true, id: json.id ?? "sent" };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : "unknown",
    };
  }
}

function renderEmail(input: {
  subject: string;
  preheader?: string;
  greeting?: string;
  body_html: string;
  cta_label: string;
  cta_url: string;
  footer_note?: string;
}): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(input.subject)}</title></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b2438;">
  ${input.preheader ? `<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(input.preheader)}</div>` : ""}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fb;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(1,25,96,0.08);">
        <tr>
          <td style="background:#011960;padding:24px;text-align:center;">
            <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
              <span>SPOT</span><span style="color:#ff3a3a;">LOG</span>
            </div>
            <div style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Logística inteligente</div>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px;">
            ${input.greeting ? `<p style="margin:0 0 16px;font-size:16px;">${escapeHtml(input.greeting)}</p>` : ""}
            <div style="font-size:15px;line-height:1.6;color:#374863;">${input.body_html}</div>
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 24px;text-align:center;">
            <a href="${escapeAttr(input.cta_url)}" style="display:inline-block;background:#BA0102;color:#ffffff;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;">${escapeHtml(input.cta_label)}</a>
            <p style="margin:16px 0 0;font-size:11px;color:#8aa0bf;word-break:break-all;">Ou cole no navegador:<br/><span style="color:#465a78;">${escapeHtml(input.cta_url)}</span></p>
          </td>
        </tr>
        ${input.footer_note ? `<tr><td style="padding:16px 32px;border-top:1px solid #eef3fa;font-size:12px;color:#8aa0bf;text-align:center;">${escapeHtml(input.footer_note)}</td></tr>` : ""}
        <tr>
          <td style="padding:16px 32px;background:#f8faff;text-align:center;font-size:11px;color:#8aa0bf;">
            Spotlog · São Paulo, SP · <a href="https://www.spotlog.com.br" style="color:#011960;text-decoration:none;">spotlogoficial.com.br</a><br/>
            Dúvidas? <a href="mailto:sac@spotlogoficial.com.br" style="color:#011960;text-decoration:none;">sac@spotlogoficial.com.br</a> · WhatsApp (11) 97834-8288
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
