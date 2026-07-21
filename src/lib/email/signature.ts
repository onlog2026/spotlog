// Gerador de assinatura de e-mail — mesma identidade visual do restante da
// Spotlog (renderEmailLayout). Função PURA: usada no preview do admin e na
// rota que gera a versão em imagem.

const NAVY = "#011960";
const RED = "#BA0102";
const WHATSAPP_GREEN = "#25D366";
const DEFAULT_BASE = "https://www.spotlog.com.br";

export type SignatureData = {
  nome: string;
  cargo?: string;
  telefone?: string;
  whatsapp?: string;
  email?: string;
  logoUrl?: string;
};

function esc(s?: string): string {
  return (s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Link direto pro WhatsApp (só dígitos, com DDI 55 se faltar). */
export function whatsappLink(raw: string): string {
  let d = raw.replace(/\D/g, "");
  if (d && !d.startsWith("55")) d = `55${d}`;
  return `https://wa.me/${d}`;
}

/**
 * HTML da assinatura (tabela + estilo inline — compatível com Gmail/Outlook).
 * `baseUrl` só importa pros ícones (precisam ser URL pública, absoluta).
 */
export function renderSignatureHtml(data: SignatureData, baseUrl?: string): string {
  const base = (baseUrl || DEFAULT_BASE).replace(/\/+$/, "");
  const logo = data.logoUrl || `${base}/logo-spotlog.png`;
  const iconPhone = `${base}/icons/signature-phone.png`;
  const iconWhatsapp = `${base}/icons/signature-whatsapp.png`;
  const iconEmail = `${base}/icons/signature-email.png`;

  const row = (icon: string, label: string, href?: string) => {
    if (!label) return "";
    const content = href
      ? `<a href="${href}" style="color:#374151;text-decoration:none;">${esc(label)}</a>`
      : esc(label);
    return `<tr><td style="padding:2px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr>
      <td style="padding-right:7px;"><img src="${icon}" width="14" height="14" alt="" style="display:block;border:0;" /></td>
      <td style="font-size:13px;color:#374151;font-family:Arial,Helvetica,sans-serif;line-height:1.5;">${content}</td>
    </tr></table></td></tr>`;
  };

  return `<table role="presentation" cellpadding="0" cellspacing="0" style="font-family:Arial,Helvetica,sans-serif;border-collapse:collapse;">
<tr>
  <td style="padding-right:18px;border-right:3px solid ${RED};vertical-align:middle;">
    <img src="${logo}" alt="Spotlog" width="86" style="display:block;width:86px;height:auto;border:0;" />
  </td>
  <td style="padding-left:18px;vertical-align:middle;">
    <div style="font-size:16px;font-weight:bold;color:${NAVY};font-family:Arial,Helvetica,sans-serif;">${esc(data.nome)}</div>
    ${data.cargo ? `<div style="font-size:13px;color:#6b7280;font-family:Arial,Helvetica,sans-serif;margin:2px 0 8px;">${esc(data.cargo)}</div>` : `<div style="height:8px;"></div>`}
    <table role="presentation" cellpadding="0" cellspacing="0">
      ${row(iconPhone, data.telefone ?? "")}
      ${row(iconWhatsapp, data.whatsapp ?? "", data.whatsapp ? whatsappLink(data.whatsapp) : undefined)}
      ${row(iconEmail, data.email ?? "", data.email ? `mailto:${data.email}` : undefined)}
    </table>
  </td>
</tr>
</table>`;
}

export const SIGNATURE_COLORS = { NAVY, RED, WHATSAPP_GREEN };
