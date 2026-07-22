import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  intro_text: z.string().max(20000).optional(),
  scope: z.string().max(20000).optional(),
  payment_terms: z.string().max(2000).optional(),
  delivery_terms: z.string().max(2000).optional(),
  title: z.string().min(2).max(240).optional(),
  template_id: z.string().uuid().nullable().optional(),
  reajuste_pct: z.number().min(0).max(1).optional(),
});

/**
 * PATCH parcial dos campos textuais de uma proposta.
 * Usado pelo editor IA (/app/propostas/[id]/ia).
 * Não mexe em itens, total, status ou tokens — apenas conteúdo textual.
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const ctx = await requireSession();
    const { id } = await context.params;

    const json = await req.json().catch(() => null);
    if (!json) {
      return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
    }
    const parsed = patchSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const patch = parsed.data;
    if (Object.keys(patch).length === 0) {
      return NextResponse.json({ ok: true });
    }

    const admin = createAdminClient();
    const { error } = await admin
      .from("proposals")
      .update(patch)
      .eq("id", id)
      .eq("organization_id", ctx.org.id);

    if (error) {
      console.error("[/api/proposals/[id]] update error", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/proposals/[id]] fatal", err);
    return NextResponse.json(
      { error: "Erro inesperado ao atualizar proposta." },
      { status: 500 },
    );
  }
}
