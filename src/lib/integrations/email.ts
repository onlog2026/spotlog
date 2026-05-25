import { Resend } from "resend";
import { getIntegration, requireIntegration } from "./index";

export type SendEmailOptions = {
  organization_id: string;
  to: string;
  subject: string;
  html?: string;
  text?: string;
  reply_to?: string;
  from?: string;
};

export type EmailSendResult = {
  ok: boolean;
  provider_message_id?: string;
  error?: string;
};

export async function sendEmail(
  opts: SendEmailOptions,
): Promise<EmailSendResult> {
  const resend = await getIntegration(opts.organization_id, "resend");
  requireIntegration(resend, "resend");

  const client = new Resend(resend.credentials.api_key);
  const from = opts.from ?? resend.credentials.from_email;
  if (!from)
    return {
      ok: false,
      error: "Remetente (from_email) não configurado no Resend.",
    };

  const { data, error } = await client.emails.send({
    from,
    to: opts.to,
    subject: opts.subject,
    html: opts.html,
    text: opts.text,
    replyTo: opts.reply_to,
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, provider_message_id: data?.id };
}
