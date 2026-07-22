import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const regionSchema = z.object({
  uf: z.string().min(1),
  cidade: z.string(),
  regiao: z.string(),
  cep_inicio: z.string().min(1),
  cep_fim: z.string().min(1),
  prazo_entrega: z.string().nullable().optional(),
  precos: z.record(z.number()),
});

const bodySchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  regions: z.array(regionSchema).min(1),
  rules: z.array(z.object({ codigo: z.string(), descricao: z.string() })).default([]),
});

export async function GET() {
  const ctx = await requireSession();
  const admin = createAdminClient();
  const { data } = await admin
    .from("proposal_templates")
    .select("id, name, description, created_at")
    .eq("organization_id", ctx.org.id)
    .order("created_at", { ascending: false });
  return NextResponse.json({ templates: data ?? [] });
}

export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  let body;
  try {
    body = bodySchema.parse(await req.json());
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Payload inválido" },
      { status: 400 },
    );
  }
  const admin = createAdminClient();

  const { data: template, error: tErr } = await admin
    .from("proposal_templates")
    .insert({
      organization_id: ctx.org.id,
      name: body.name,
      description: body.description ?? null,
      created_by: ctx.user.id,
    })
    .select("id")
    .single();
  if (tErr || !template) {
    return NextResponse.json({ error: tErr?.message ?? "Falha ao criar modelo" }, { status: 500 });
  }
  const templateId = (template as { id: string }).id;

  const { error: rErr } = await admin.from("proposal_template_regions").insert(
    body.regions.map((r, idx) => ({
      template_id: templateId,
      uf: r.uf,
      cidade: r.cidade,
      regiao: r.regiao,
      cep_inicio: r.cep_inicio,
      cep_fim: r.cep_fim,
      prazo_entrega: r.prazo_entrega ?? null,
      precos: r.precos,
      position: idx,
    })),
  );
  if (rErr) {
    // limpa o template órfão se as regiões falharem
    await admin.from("proposal_templates").delete().eq("id", templateId);
    return NextResponse.json({ error: rErr.message }, { status: 500 });
  }

  if (body.rules.length > 0) {
    const { error: ruErr } = await admin.from("proposal_template_rules").insert(
      body.rules.map((r, idx) => ({
        template_id: templateId,
        codigo: r.codigo,
        descricao: r.descricao,
        position: idx,
      })),
    );
    if (ruErr) {
      return NextResponse.json({ error: ruErr.message }, { status: 500 });
    }
  }

  return NextResponse.json({ id: templateId });
}
