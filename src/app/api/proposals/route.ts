import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const itemSchema = z.object({
  product_id: z.string().uuid().optional(),
  name: z.string(),
  description: z.string().optional(),
  quantity: z.number(),
  unit_price: z.number(),
  discount_pct: z.number().default(0),
});

const schema = z.object({
  title: z.string().min(2),
  price_table_id: z.string().uuid().nullable().optional(),
  contact_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  deal_id: z.string().uuid().nullable().optional(),
  intro_text: z.string().optional(),
  scope: z.string().optional(),
  payment_terms: z.string().optional(),
  delivery_terms: z.string().optional(),
  validity_days: z.number().int().default(15),
  discount_pct: z.number().default(0),
  items: z.array(itemSchema).min(1),
  subtotal: z.number(),
  total: z.number(),
});

export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  const body = schema.parse(await req.json());
  const admin = createAdminClient();

  const expiresAt = new Date(
    Date.now() + body.validity_days * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { data: prop, error } = await admin
    .from("proposals")
    .insert({
      organization_id: ctx.org.id,
      title: body.title,
      price_table_id: body.price_table_id || null,
      contact_id: body.contact_id || null,
      company_id: body.company_id || null,
      deal_id: body.deal_id || null,
      intro_text: body.intro_text,
      scope: body.scope,
      payment_terms: body.payment_terms,
      delivery_terms: body.delivery_terms,
      validity_days: body.validity_days,
      discount_pct: body.discount_pct,
      subtotal: body.subtotal,
      discount_amount: body.subtotal - body.total,
      total: body.total,
      expires_at: expiresAt,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  const proposalId = (prop as { id: string }).id;

  const { error: itemsErr } = await admin.from("proposal_items").insert(
    body.items.map((i, idx) => ({
      organization_id: ctx.org.id,
      proposal_id: proposalId,
      product_id: i.product_id ?? null,
      position: idx,
      name: i.name,
      description: i.description,
      quantity: i.quantity,
      unit_price: i.unit_price,
      discount_pct: i.discount_pct,
      total:
        i.quantity * i.unit_price * (1 - (i.discount_pct ?? 0) / 100),
    })),
  );
  if (itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 });

  return NextResponse.json({ id: proposalId });
}
