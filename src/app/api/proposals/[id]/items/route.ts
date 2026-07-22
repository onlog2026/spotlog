import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const itemSchema = z.object({
  product_id: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  quantity: z.number().positive(),
  unit_price: z.number().min(0),
  discount_pct: z.number().min(0).max(100).default(0),
});

const bodySchema = z.object({
  items: z.array(itemSchema).min(1, "A proposta precisa de pelo menos 1 item."),
  discount_pct: z.number().min(0).max(100).default(0),
});

/**
 * Salva os itens de uma proposta já existente. Sem essa rota, a proposta
 * gerada por IA nascia com 1 item de R$0 e não tinha como ser editada —
 * ficava travada pra sempre. Recalcula subtotal/total no servidor (nunca
 * confia no valor agregado que o navegador manda).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const ctx = await requireSession();
  const { id } = await params;
  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payload inválido";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: proposal } = await admin
    .from("proposals")
    .select("id, status")
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!proposal) {
    return NextResponse.json({ error: "Proposta não encontrada." }, { status: 404 });
  }
  if (proposal.status === "accepted") {
    return NextResponse.json(
      { error: "Proposta já aceita pelo cliente — não pode mais editar os itens." },
      { status: 409 },
    );
  }

  const itemsWithTotal = body.items.map((it, idx) => {
    const lineTotal = it.quantity * it.unit_price * (1 - it.discount_pct / 100);
    return {
      organization_id: ctx.org.id,
      proposal_id: id,
      product_id: it.product_id || null,
      position: idx,
      name: it.name,
      description: it.description || null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      discount_pct: it.discount_pct,
      total: lineTotal,
    };
  });

  const subtotal = itemsWithTotal.reduce((acc, it) => acc + it.total, 0);
  const discountAmount = subtotal * (body.discount_pct / 100);
  const total = subtotal - discountAmount;

  // Substitui todos os itens (mesmo padrão já usado pra passos de cadência).
  const { error: delError } = await admin
    .from("proposal_items")
    .delete()
    .eq("proposal_id", id)
    .eq("organization_id", ctx.org.id);
  if (delError) return NextResponse.json({ error: delError.message }, { status: 500 });

  const { error: insError } = await admin.from("proposal_items").insert(itemsWithTotal);
  if (insError) return NextResponse.json({ error: insError.message }, { status: 500 });

  const { error: updError } = await admin
    .from("proposals")
    .update({
      discount_pct: body.discount_pct,
      subtotal,
      discount_amount: discountAmount,
      total,
    })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (updError) return NextResponse.json({ error: updError.message }, { status: 500 });

  return NextResponse.json({ ok: true, subtotal, total });
}
