// Layout de e-mail padrão da Spotlog — usado em todos os envios (propostas, avisos, etc.).
// Função PURA (sem imports de servidor) → pode ser usada no preview do admin e nas rotas.

const NAVY = "#011960";
const RED = "#BA0102";
const DEFAULT_BASE = "https://www.spotlog.com.br";

export type EmailLayoutOpts = {
  baseUrl?: string;
  preheader?: string;
  heading?: string;
  bodyHtml: string;
  highlight?: { label?: string; title?: string; subtitle?: string };
  ctaLabel?: string;
  ctaUrl?: string;
  footerNote?: string;
};

/** Monta o HTML completo de um e-mail com a identidade da Spotlog. */
export function renderEmailLayout(opts: EmailLayoutOpts): string {
  const base = (opts.baseUrl || DEFAULT_BASE).replace(/\/+$/, "");
  const logo = `${base}/logo-spotlog.png`;

  const highlight = opts.highlight
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;border-radius:12px;margin:0 0 22px;"><tr><td style="padding:16px 18px;">
        ${opts.highlight.label ? `<div style="font-size:12px;color:#6b7280;letter-spacing:1px;">${opts.highlight.label}</div>` : ""}
        ${opts.highlight.title ? `<div style="font-size:17px;color:${NAVY};font-weight:bold;margin-top:2px;">${opts.highlight.title}</div>` : ""}
        ${opts.highlight.subtitle ? `<div style="font-size:13px;color:#6b7280;margin-top:6px;">${opts.highlight.subtitle}</div>` : ""}
      </td></tr></table>`
    : "";

  const cta =
    opts.ctaLabel && opts.ctaUrl
      ? `<table role="presentation" align="center" cellpadding="0" cellspacing="0" style="margin:0 auto 8px;"><tr><td style="border-radius:8px;background:${RED};">
          <a href="${opts.ctaUrl}" style="display:inline-block;padding:13px 32px;color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;font-family:Arial,Helvetica,sans-serif;">${opts.ctaLabel}</a>
        </td></tr></table>`
      : "";

  const footerNote =
    opts.footerNote ??
    "Este é um e-mail automático enviado por nao-responda@spotlog.com.br";

  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#eef1f6;">
${opts.preheader ? `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>` : ""}
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f6;padding:24px 0;font-family:Arial,Helvetica,sans-serif;"><tr><td align="center">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;">
    <tr><td style="background:${NAVY};padding:22px 28px;text-align:center;">
      <img src="${logo}" alt="Spotlog" height="34" style="height:34px;display:inline-block;border:0;" />
    </td></tr>
    <tr><td style="padding:28px;">
      ${opts.heading ? `<p style="font-size:16px;color:#111827;margin:0 0 14px;">${opts.heading}</p>` : ""}
      <div style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 18px;">${opts.bodyHtml}</div>
      ${highlight}
      ${cta}
    </td></tr>
    <tr><td style="background:#0b1230;padding:20px 28px;text-align:center;">
      <div style="font-size:13px;color:#cbd5e1;font-weight:bold;">Spotlog · Soluções em Logística</div>
      <div style="font-size:12px;color:#8595bb;margin-top:6px;line-height:1.6;">Tecnologia que conecta. Pessoas que entregam.<br/>${footerNote}</div>
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;
}
