import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({
  name: z.string().min(2),
  source_filename: z.string().optional(),
  items: z
    .array(
      z.object({
        name: z.string(),
        sku: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        unit: z.string().nullable().optional(),
        category: z.string().nullable().optional(),
        price: z.number(),
      }),
    )
    .min(1),
});

export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  const body = schema.parse(await req.json());
  const admin = createAdminClient();

  const { data: table, error } = await admin
    .from("price_tables")
    .insert({
      organization_id: ctx.org.id,
      name: body.name,
      source_filename: body.source_filename,
      imported_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const tableId = (table as { id: string }).id;
  const validItems = body.items.filter((i) => i.name);
  if (validItems.length) {
    const { error: insertErr } = await admin.from("products").insert(
      validItems.map((i) => ({
        organization_id: ctx.org.id,
        price_table_id: tableId,
        name: i.name,
        sku: i.sku,
        description: i.description,
        unit: i.unit ?? "un",
        category: i.category,
        price: i.price,
      })),
    );
    if (insertErr)
      return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: tableId, imported: validItems.length });
}
