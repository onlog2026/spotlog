import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/integrations/email";
import { sendWhatsapp } from "@/lib/integrations/whatsapp";
import { renderEmailLayout } from "@/lib/email/layout";

const schema = z.object({ channel: z.enum(["email", "whatsapp"]) });

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireSession();
  const { id } = await params;
  const { channel } = schema.parse(await req.json());
  const admin = createAdminClient();

  const { data: prop } = await admin
    .from("proposals")
    .select(
      "id, title, total, currency, public_token, contact:contacts(full_name, email, whatsapp, phone)",
    )
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!prop)
    return NextResponse.json({ error: "not found" }, { status: 404 });

  const p = prop as unknown as {
    id: string;
    title: string;
    total: number;
    currency: string;
    public_token: string;
    contact: { full_name: string; email: string; whatsapp: string; phone: string } | null;
  };

  const url = `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/proposta/${p.public_token}`;
  const greet = p.contact?.full_name?.split(" ")[0] ?? "Olá";

  if (channel === "email") {
    if (!p.contact?.email)
      return NextResponse.json({ error: "contato sem e-mail" }, { status: 400 });
    const html = renderEmailLayout({
      heading: `Olá, ${greet}!`,
      bodyHtml: `<p>Segue sua proposta comercial. Dá pra ver os itens, valores e aceitar direto pelo link abaixo.</p>`,
      highlight: {
        label: "PROPOSTA",
        title: p.title,
        subtitle: `Valor total: ${Number(p.total).toLocaleString("pt-BR", { style: "currency", currency: p.currency || "BRL" })}`,
      },
      ctaLabel: "Ver proposta completa",
      ctaUrl: url,
      footerNote: "Qualquer dúvida, é só responder este e-mail.",
    });
    const r = await sendEmail({
      organization_id: ctx.org.id,
      to: p.contact.email,
      subject: `Sua proposta — ${p.title}`,
      html,
      text: `${greet}, veja sua proposta: ${url}`,
    });
    if (!r.ok)
      return NextResponse.json({ error: r.error ?? "erro" }, { status: 500 });
  } else {
    const to = p.contact?.whatsapp ?? p.contact?.phone;
    if (!to)
      return NextResponse.json({ error: "contato sem telefone" }, { status: 400 });
    const text = `Oi ${greet}! 🚀\nSegue sua proposta comercial:\n${p.title}\n${url}\n\nValor: R$ ${Number(p.total).toLocaleString("pt-BR")}`;
    const r = await sendWhatsapp({
      organization_id: ctx.org.id,
      to,
      text,
    });
    if (!r.ok)
      return NextResponse.json({ error: r.error ?? "erro" }, { status: 500 });
  }

  await admin
    .from("proposals")
    .update({
      status: "sent",
      sent_at: new Date().toISOString(),
    })
    .eq("id", id);

  return NextResponse.json({ ok: true });
}
