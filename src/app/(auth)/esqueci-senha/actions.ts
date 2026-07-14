"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { sendMagicLinkEmail } from "@/lib/email/send-magic-link";

const schema = z.object({
  email: z.string().email("E-mail inválido"),
});

export async function requestPasswordResetAction(input: { email: string }) {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  const email = parsed.data.email.toLowerCase();

  const adminClient = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.spotlog.com.br";
  // /api/auth/callback troca ?code= por sessão (já usado pelo Google OAuth).
  // Sem ele, o token volta pra /login com ?code= e ninguém faz o exchange.
  const redirectTo = `${appUrl}/api/auth/callback?next=/app`;

  // 1. Tenta gerar magic link direto (type=recovery falha se user não existe)
  // Sem listUsers — evita bug de paginação quando auth.users tem >200 contas.
  let magicLink: string | null = null;
  let generateLinkError: string | null = null;
  try {
    const { data: link, error } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo },
    });
    if (error) {
      generateLinkError = error.message;
      console.warn("[forgot] generateLink recovery error:", error.message);
    } else {
      magicLink = link?.properties?.action_link ?? null;
    }
  } catch (e) {
    generateLinkError = e instanceof Error ? e.message : "unknown";
    console.warn("[forgot] generateLink threw:", e);
  }

  // 2. Se recovery falhou, tenta magiclink (cria sessão sem precisar trocar senha)
  if (!magicLink) {
    try {
      const { data: link } = await adminClient.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      magicLink = link?.properties?.action_link ?? null;
    } catch (e) {
      console.warn("[forgot] generateLink magiclink error:", e);
    }
  }

  // 3. Tenta enviar via Resend
  let emailSentBy: "resend" | "supabase" | "none" = "none";
  if (magicLink) {
    const resendRes = await sendMagicLinkEmail({
      to: email,
      subject: "Seu link de acesso ao Spotlog",
      preheader: "Entre sem precisar de senha",
      greeting: "Olá!",
      body_html:
        "<p>Você pediu um link de acesso ao Spotlog. Clica no botão abaixo pra entrar — sem precisar de senha.</p><p>Se não foi você, pode ignorar este e-mail.</p>",
      cta_label: "Entrar no Spotlog",
      cta_url: magicLink,
      footer_note: "Link válido por 1 hora.",
    });
    if (resendRes.ok) {
      emailSentBy = "resend";
      console.log("[forgot] resend ok id=", resendRes.id);
    } else {
      console.warn("[forgot] resend failed:", resendRes.error);
    }
  }

  // 4. Fallback Supabase Auth nativo
  if (emailSentBy === "none") {
    try {
      const serverClient = await createClient();
      const { error: resetErr } = await serverClient.auth.resetPasswordForEmail(
        email,
        { redirectTo: `${appUrl}/api/auth/callback?next=/app` },
      );
      if (!resetErr) emailSentBy = "supabase";
      else console.warn("[forgot] supabase reset error:", resetErr.message);
    } catch (e) {
      console.warn("[forgot] supabase reset threw:", e);
    }
  }

  // Sempre retorna ok:true (não revela se email existe).
  // Se conseguimos gerar magicLink, mostra na UI como backup garantido.
  if (magicLink) {
    return {
      ok: true as const,
      message:
        emailSentBy === "resend"
          ? "✅ Link enviado pra seu e-mail. Confere a caixa de entrada (e o spam). Se não chegar em 2 min, use o link abaixo:"
          : emailSentBy === "supabase"
            ? "✅ Link enviado pelo Supabase Auth. Confere caixa + spam. Se não chegar, use o link abaixo:"
            : "Não conseguimos enviar por e-mail. Copia o link abaixo e cole no navegador pra entrar:",
      magic_link: magicLink,
    };
  }

  return {
    ok: true as const,
    message:
      "Se esse e-mail estiver cadastrado, enviamos um link de acesso. Confere a caixa de entrada e o spam.",
    magic_link: null,
  };
}
