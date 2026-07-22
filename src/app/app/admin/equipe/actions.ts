"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { requireRole } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendMagicLinkEmail } from "@/lib/email/send-magic-link";

const ROLES = ["owner", "admin", "manager", "sdr", "closer", "viewer"] as const;
type Role = (typeof ROLES)[number];

const inviteSchema = z.object({
  email: z.string().email("E-mail inválido"),
  full_name: z.string().optional(),
  role: z.enum(ROLES).default("viewer"),
});

/**
 * Convida ou adiciona um membro à organização.
 * - Se o user já existe em auth.users → adiciona em organization_members
 * - Se não existe → envia magic link via inviteUserByEmail + cria membership após aceite
 */
export async function inviteMemberAction(input: {
  email: string;
  full_name?: string;
  role: Role;
}) {
  const ctx = await requireRole(["owner", "admin", "manager"]);
  const parsed = inviteSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false as const, error: parsed.error.issues[0].message };
  }
  const { email, full_name, role } = parsed.data;
  if (role === "owner" && ctx.org.role !== "owner") {
    return { ok: false as const, error: "Só um owner pode convidar outro owner." };
  }
  const supabase = createAdminClient();

  // 1. Busca user existente em auth.users
  const { data: usersData } = await supabase.auth.admin.listUsers({
    page: 1,
    perPage: 200,
  });
  const existing = usersData?.users?.find(
    (u) => (u.email ?? "").toLowerCase() === email.toLowerCase(),
  );

  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.spotlog.com.br"}/login?invited=1`;

  if (existing) {
    // Já existe → verifica se já é membro
    const { data: membership } = await supabase
      .from("organization_members")
      .select("user_id, role")
      .eq("user_id", existing.id)
      .eq("organization_id", ctx.org.id)
      .maybeSingle();
    if (membership) {
      return {
        ok: false as const,
        error: `Este e-mail já é membro como ${(membership as { role: string }).role}.`,
      };
    }
    // Adiciona à org
    const { error: insErr } = await supabase
      .from("organization_members")
      .insert({
        user_id: existing.id,
        organization_id: ctx.org.id,
        role,
        joined_at: new Date().toISOString(),
      });
    if (insErr) {
      return { ok: false as const, error: insErr.message };
    }
    // Garante profile
    await supabase
      .from("profiles")
      .upsert(
        {
          id: existing.id,
          email: existing.email ?? email,
          full_name: full_name ?? existing.user_metadata?.full_name ?? null,
        },
        { onConflict: "id" },
      );

    // Sempre gera magic link pra facilitar acesso (mesmo se já tinha conta)
    let magicLink: string | null = null;
    try {
      const { data: link } = await supabase.auth.admin.generateLink({
        type: "magiclink",
        email,
        options: { redirectTo },
      });
      magicLink = link?.properties?.action_link ?? null;
    } catch (e) {
      console.warn("[invite] magic link generation failed", e);
    }

    // Tenta enviar email via Resend
    let emailStatus: "sent" | "no_provider" | "failed" = "no_provider";
    if (magicLink) {
      const emailRes = await sendMagicLinkEmail({
        to: email,
        subject: `Você foi adicionado à equipe Spotlog (${ctx.org.name})`,
        preheader: "Clique pra acessar o painel",
        greeting: `Olá${full_name ? `, ${full_name}` : ""}!`,
        body_html: `<p><strong>${escapeHtml(ctx.user.full_name ?? ctx.user.email ?? "Um admin")}</strong> te adicionou como <strong>${escapeHtml(role)}</strong> na organização <strong>${escapeHtml(ctx.org.name)}</strong> no Spotlog.</p><p>Clica no botão abaixo pra entrar direto, sem precisar de senha.</p>`,
        cta_label: "Acessar Spotlog",
        cta_url: magicLink,
        footer_note: "Este link funciona por 1 hora. Se precisar de novo, peça outro convite.",
      });
      emailStatus = emailRes.ok ? "sent" : "failed";
    }

    revalidatePath("/app/admin/equipe");
    return {
      ok: true as const,
      status: "added" as const,
      message:
        emailStatus === "sent"
          ? `✅ ${email} adicionado(a) como ${role}. E-mail enviado pelo Resend.`
          : `${email} adicionado(a) como ${role}. Copia o link abaixo e envia pela pessoa (Resend não está configurado ou falhou).`,
      magic_link: magicLink,
      email_status: emailStatus,
    };
  }

  // 2. User não existe → cria + envia magic link
  const { data: invited, error: inviteErr } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name, invited_to_org: ctx.org.id, invited_role: role },
    redirectTo,
  });
  if (inviteErr || !invited?.user) {
    // Fallback: cria magic link manualmente
    const { data: link } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (!link?.user) {
      return {
        ok: false as const,
        error: inviteErr?.message ?? "Não foi possível enviar o convite.",
      };
    }
    // Adiciona à org com o user gerado pelo magic link
    await supabase.from("organization_members").insert({
      user_id: link.user.id,
      organization_id: ctx.org.id,
      role,
      joined_at: new Date().toISOString(),
    });
    await supabase.from("profiles").upsert(
      { id: link.user.id, email, full_name: full_name ?? null },
      { onConflict: "id" },
    );
    const magicLink = link.properties?.action_link ?? null;
    let emailStatus: "sent" | "no_provider" | "failed" = "no_provider";
    if (magicLink) {
      const emailRes = await sendMagicLinkEmail({
        to: email,
        subject: `Convite pra equipe Spotlog (${ctx.org.name})`,
        preheader: "Acesse seu painel com 1 clique",
        greeting: `Olá${full_name ? `, ${full_name}` : ""}!`,
        body_html: `<p><strong>${escapeHtml(ctx.user.full_name ?? ctx.user.email ?? "Um admin")}</strong> te convidou pra fazer parte da equipe <strong>${escapeHtml(ctx.org.name)}</strong> no Spotlog como <strong>${escapeHtml(role)}</strong>.</p><p>Clica no botão abaixo pra acessar — não precisa criar senha agora.</p>`,
        cta_label: "Aceitar convite",
        cta_url: magicLink,
        footer_note: "O link funciona por 1 hora. Se expirar, peça outro convite pro admin.",
      });
      emailStatus = emailRes.ok ? "sent" : "failed";
    }
    revalidatePath("/app/admin/equipe");
    return {
      ok: true as const,
      status: "magic_link" as const,
      message:
        emailStatus === "sent"
          ? `✅ Convite enviado pra ${email}. Resend confirmou o envio.`
          : `Convite gerado pra ${email}. Copia o link abaixo e envia (Resend não está configurado).`,
      magic_link: magicLink,
      email_status: emailStatus,
    };
  }

  // Cria a membership já (o user pode aceitar e logar depois)
  await supabase.from("organization_members").insert({
    user_id: invited.user.id,
    organization_id: ctx.org.id,
    role,
    joined_at: new Date().toISOString(),
  });
  await supabase.from("profiles").upsert(
    {
      id: invited.user.id,
      email,
      full_name: full_name ?? null,
    },
    { onConflict: "id" },
  );

  // Gera magic link manual mesmo se inviteUserByEmail tentou mandar email
  let magicLink: string | null = null;
  try {
    const { data: link } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    magicLink = link?.properties?.action_link ?? null;
  } catch (e) {
    console.warn("[invite] manual magic link failed", e);
  }
  let emailStatus: "sent" | "no_provider" | "failed" = "no_provider";
  if (magicLink) {
    const emailRes = await sendMagicLinkEmail({
      to: email,
      subject: `Convite pra equipe Spotlog (${ctx.org.name})`,
      preheader: "Acesse seu painel com 1 clique",
      greeting: `Olá${full_name ? `, ${full_name}` : ""}!`,
      body_html: `<p><strong>${escapeHtml(ctx.user.full_name ?? ctx.user.email ?? "Um admin")}</strong> te convidou pra fazer parte da equipe <strong>${escapeHtml(ctx.org.name)}</strong> no Spotlog como <strong>${escapeHtml(role)}</strong>.</p><p>Clica no botão abaixo pra acessar — não precisa criar senha agora.</p>`,
      cta_label: "Aceitar convite",
      cta_url: magicLink,
      footer_note: "O link funciona por 1 hora. Se expirar, peça outro convite pro admin.",
    });
    emailStatus = emailRes.ok ? "sent" : "failed";
  }

  revalidatePath("/app/admin/equipe");
  return {
    ok: true as const,
    status: "invited" as const,
    message:
      emailStatus === "sent"
        ? `✅ Convite enviado pra ${email}.`
        : `Convite criado. Copia o link abaixo e envia (Resend não está configurado).`,
    magic_link: magicLink,
    email_status: emailStatus,
  };
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function changeRoleAction(input: { user_id: string; role: Role }) {
  const ctx = await requireRole(["owner", "admin"]);
  if (!ROLES.includes(input.role)) {
    return { ok: false as const, error: "Role inválido" };
  }
  const supabase = createAdminClient();

  // Só outro owner mexe no role de um owner (rebaixar ou promover) —
  // um admin comum não pode tocar em owner, mesmo que role=owner esteja
  // na lista de opções do <select>.
  const { data: target } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", input.user_id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if ((target?.role === "owner" || input.role === "owner") && ctx.org.role !== "owner") {
    return { ok: false as const, error: "Só um owner pode promover/rebaixar outro owner." };
  }
  if (target?.role === "owner" && input.role !== "owner") {
    const { count } = await supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) {
      return { ok: false as const, error: "A organização precisa de pelo menos 1 owner." };
    }
  }

  const { error } = await supabase
    .from("organization_members")
    .update({ role: input.role })
    .eq("user_id", input.user_id)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/app/admin/equipe");
  return { ok: true as const };
}

export async function removeMemberAction(input: { user_id: string }) {
  const ctx = await requireRole(["owner", "admin"]);
  if (input.user_id === ctx.user.id) {
    return { ok: false as const, error: "Você não pode remover a si mesmo." };
  }
  const supabase = createAdminClient();

  // Só outro owner remove um owner — e nunca o último owner da org.
  const { data: target } = await supabase
    .from("organization_members")
    .select("role")
    .eq("user_id", input.user_id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (target?.role === "owner") {
    if (ctx.org.role !== "owner") {
      return { ok: false as const, error: "Só um owner pode remover outro owner." };
    }
    const { count } = await supabase
      .from("organization_members")
      .select("user_id", { count: "exact", head: true })
      .eq("organization_id", ctx.org.id)
      .eq("role", "owner");
    if ((count ?? 0) <= 1) {
      return { ok: false as const, error: "A organização precisa de pelo menos 1 owner." };
    }
  }

  const { error } = await supabase
    .from("organization_members")
    .delete()
    .eq("user_id", input.user_id)
    .eq("organization_id", ctx.org.id);
  if (error) return { ok: false as const, error: error.message };
  revalidatePath("/app/admin/equipe");
  return { ok: true as const };
}

export async function resendInviteAction(input: { email: string }) {
  const ctx = await requireRole(["owner", "admin", "manager"]);
  const supabase = createAdminClient();
  const redirectTo = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://www.spotlog.com.br"}/login?invited=1`;
  const { data: link, error } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: input.email,
    options: { redirectTo },
  });
  if (error) return { ok: false as const, error: error.message };
  const magicLink = link?.properties?.action_link ?? null;
  if (magicLink) {
    await sendMagicLinkEmail({
      to: input.email,
      subject: `Seu link de acesso ao Spotlog (${ctx.org.name})`,
      preheader: "Link de acesso rápido",
      body_html: `<p>Aqui está seu link de acesso ao painel do Spotlog. Clica no botão pra entrar.</p>`,
      cta_label: "Entrar no Spotlog",
      cta_url: magicLink,
      footer_note: "Link válido por 1 hora.",
    });
  }
  return {
    ok: true as const,
    magic_link: magicLink,
  };
}
