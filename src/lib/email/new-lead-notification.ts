import "server-only";

export interface NewLeadPayload {
  id: string;
  full_name: string;
  email: string;
  whatsapp?: string;
  company_name?: string;
  message?: string;
  source_detail?: string;
  custom_fields?: Record<string, string>;
}

export async function sendNewLeadNotification(
  lead: NewLeadPayload,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return;

  const to =
    process.env.LEAD_NOTIFICATION_EMAIL ?? "comercial@spotlogoficial.com.br";
  const from = process.env.RESEND_FROM_EMAIL ?? "Spotlog <onboarding@resend.dev>";
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.spotlog.com.br";

  const segmentLabels: Record<string, string> = {
    ecommerce: "E-commerce",
    farma: "Farmácia",
    manipulacao: "Farmácia de manipulação",
    correlatos: "Correlatos / Dermocosméticos",
    b2b: "B2B / Indústria",
    outro: "Outro",
  };
  const volumeLabels: Record<string, string> = {
    ate_50: "Até 50/mês",
    "50_200": "50 a 200/mês",
    "200_500": "200 a 500/mês",
    "500_1000": "500 a 1.000/mês",
    "1000_5000": "1.000 a 5.000/mês",
    mais_5000: "Mais de 5.000/mês",
  };

  const cf = lead.custom_fields ?? {};
  const rows = [
    ["Nome", lead.full_name],
    ["Empresa", lead.company_name],
    ["E-mail", lead.email],
    ["WhatsApp", lead.whatsapp],
    ["Segmento", cf.segment ? (segmentLabels[cf.segment] ?? cf.segment) : undefined],
    ["Volume mensal", cf.volume ? (volumeLabels[cf.volume] ?? cf.volume) : undefined],
    ["Região", cf.regiao],
    ["Tipo de operação", cf.tipo_operacao],
    ["Mensagem", lead.message],
  ].filter(([, v]) => v) as [string, string][];

  const rowsHtml = rows
    .map(
      ([k, v]) => `
      <tr>
        <td style="padding:8px 12px;font-weight:600;color:#011960;font-size:13px;white-space:nowrap;vertical-align:top;">${k}</td>
        <td style="padding:8px 12px;color:#374863;font-size:13px;">${escapeHtml(v)}</td>
      </tr>`,
    )
    .join("");

  const ctaUrl = `${appUrl}/app/leads/${lead.id}`;

  const html = `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f7fb;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#1b2438;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f7fb;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(1,25,96,0.08);">
        <tr>
          <td style="background:#011960;padding:24px;text-align:center;">
            <div style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:-0.3px;">
              <span>SPOT</span><span style="color:#ff3a3a;">LOG</span>
            </div>
            <div style="color:rgba(255,255,255,0.7);font-size:11px;text-transform:uppercase;letter-spacing:2px;margin-top:4px;">Novo lead recebido</div>
          </td>
        </tr>
        <tr>
          <td style="padding:28px 32px 8px;">
            <p style="margin:0 0 4px;font-size:20px;font-weight:700;color:#011960;">🔔 Novo lead do site</p>
            <p style="margin:0 0 20px;font-size:14px;color:#8aa0bf;">Via formulário "Solicitar proposta"</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #eef3fa;border-radius:12px;overflow:hidden;">
              ${rowsHtml}
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;text-align:center;">
            <a href="${escapeAttr(ctaUrl)}" style="display:inline-block;background:#BA0102;color:#ffffff;font-weight:700;text-decoration:none;padding:14px 32px;border-radius:12px;font-size:15px;">Ver lead no CRM →</a>
          </td>
        </tr>
        <tr>
          <td style="padding:16px 32px;background:#f8faff;text-align:center;font-size:11px;color:#8aa0bf;">
            Spotlog · São Paulo, SP · <a href="https://www.spotlog.com.br" style="color:#011960;text-decoration:none;">spotlog.com.br</a>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body></html>`;

  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to,
        subject: `🔔 Novo lead: ${lead.full_name}${lead.company_name ? ` — ${lead.company_name}` : ""}`,
        html,
      }),
    });
  } catch {
    // best-effort — não bloqueia o fluxo principal
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

function escapeAttr(s: string): string {
  return escapeHtml(s);
}
