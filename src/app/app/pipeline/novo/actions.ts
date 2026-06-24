"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const dealSchema = z.object({
  title: z.string().min(1, "Título obrigatório").max(200),
  pipeline_id: z.string().uuid("Pipeline obrigatório"),
  stage_id: z.string().uuid("Etapa obrigatória"),
  amount: z.coerce.number().min(0).optional(),
  currency: z.string().default("BRL"),
  probability: z.coerce.number().int().min(0).max(100).optional(),
  company_id: z.string().uuid().optional().nullable(),
  contact_id: z.string().uuid().optional().nullable(),
  owner_id: z.string().uuid().optional().nullable(),
  expected_close_date: z.string().optional().nullable(),
  source: z.string().optional().nullable(),
  status: z.enum(["open", "won", "lost"]).default("open"),
});

export async function criarDealAction(input: z.infer<typeof dealSchema>) {
  const ctx = await requireSession();
  const parsed = dealSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Dados inválidos",
    };
  }
  const data = parsed.data;
  const supabase = createAdminClient();

  const { data: deal, error } = await supabase
    .from("deals")
    .insert({
      organization_id: ctx.org.id,
      pipeline_id: data.pipeline_id,
      stage_id: data.stage_id,
      title: data.title,
      amount: data.amount ?? null,
      currency: data.currency,
      probability: data.probability ?? null,
      company_id: data.company_id || null,
      contact_id: data.contact_id || null,
      owner_id: data.owner_id || ctx.user.id,
      expected_close_date: data.expected_close_date || null,
      source: data.source || null,
      status: data.status,
    })
    .select("id")
    .single();

  if (error || !deal) {
    return { ok: false as const, error: error?.message ?? "Falha ao criar." };
  }

  revalidatePath("/app/pipeline");
  redirect(`/app/pipeline?created=${(deal as { id: string }).id}`);
}
