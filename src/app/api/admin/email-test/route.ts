import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireRole } from "@/lib/auth";
import { sendEmail } from "@/lib/integrations/email";
import { renderEmailLayout } from "@/lib/email/layout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({ to: z.string().email() });

/** Envia um e-mail de teste com o layout padrão da Spotlog. */
export async function POST(req: NextRequest) {
  const ctx = await requireRole(["owner", "admin"]);
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success)
    return NextResponse.json({ ok: false, error: "E-mail inválido." }, { status: 400 });

  const html = renderEmailLayout({
    preheader: "Teste de layout de e-mail da Spotlog",
    heading: "Tudo certo!",
    bodyHtml:
      "Este é um e-mail de <b>teste</b> do seu painel Spotlog. Se você está vendo isto com a logo e as cores da marca, o layout e o envio estão funcionando.",
    highlight: {
      label: "TESTE",
      title: "Layout de e-mail Spotlog",
      subtitle: "Propostas e avisos vão sair assim a partir de agora.",
    },
    ctaLabel: "Abrir o painel",
    ctaUrl: "https://www.spotlog.com.br/app",
  });

  const r = await sendEmail({
    organization_id: ctx.org.id,
    to: parsed.data.to,
    subject: "Teste de layout — Spotlog",
    html,
  });
  return NextResponse.json(r);
}
