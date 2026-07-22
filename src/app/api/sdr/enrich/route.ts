import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { getSdrClient } from "@/lib/sdr/db";
import { enrichBatchCnpjs, normalizeCnpj } from "@/lib/sdr/enrich";
import { scoreAndPersistLead } from "@/lib/sdr/scoring";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  cnpjs: z.array(z.string().min(11)).min(1).max(50),
  createLeads: z.boolean().default(true),
});

export async function POST(req: NextRequest) {
  try {
    const ctx = await requireSession();
    const json = await req.json().catch(() => null);
    const parsed = bodySchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos.", issues: parsed.error.issues },
        { status: 400 },
      );
    }

    const cnpjs = parsed.data.cnpjs
      .map(normalizeCnpj)
      .filter((c) => c.length === 14);
    if (cnpjs.length === 0) {
      return NextResponse.json({ error: "Nenhum CNPJ válido." }, { status: 400 });
    }

    const enriched = await enrichBatchCnpjs(ctx.org.id, cnpjs);
    const supabase = await getSdrClient();

    const created: string[] = [];
    const failed: { cnpj: string; reason: string }[] = [];

    if (parsed.data.createLeads) {
      for (const item of enriched) {
        if (!item.data) {
          failed.push({ cnpj: item.cnpj, reason: item.error ?? "BrasilAPI sem resposta" });
          continue;
        }
        const data = item.data;
        // Upsert company — requer unique(organization_id, cnpj) no banco
        // (scripts/sql/fix-companies-cnpj-unique.sql); sem essa constraint
        // o Postgres rejeita o ON CONFLICT (42P10) e a empresa não é salva.
        const { data: company, error: companyError } = await supabase
          .from("companies")
          .upsert(
            {
              organization_id: ctx.org.id,
              cnpj: item.cnpj,
              name: data.nome_fantasia || data.razao_social || `CNPJ ${item.cnpj}`,
              legal_name: data.razao_social ?? null,
              industry: data.cnae_descricao ?? null,
              size: data.porte ?? null,
              city: data.endereco?.municipio ?? null,
              state: data.endereco?.uf ?? null,
              address: [data.endereco?.logradouro, data.endereco?.numero]
                .filter(Boolean)
                .join(", ") || null,
              zipcode: data.endereco?.cep ?? null,
              phone: data.telefone ?? null,
              source: "enrichment",
              enrichment_data: data as unknown as Record<string, unknown>,
            },
            { onConflict: "organization_id,cnpj" },
          )
          .select("id, name")
          .single();
        if (companyError) {
          console.warn(`[sdr/enrich] upsert companies falhou (${item.cnpj}):`, companyError.message);
        }

        // Cria lead correspondente (se ainda não houver) — escopado por
        // origem, senão um lead inbound/manual com o mesmo nome de empresa
        // "rouba" o enriquecimento em vez do SDR criar um lead próprio.
        const { data: existingLead } = await supabase
          .from("leads")
          .select("id")
          .eq("organization_id", ctx.org.id)
          .eq("company_name", company?.name ?? "")
          .in("source", ["enrichment", "sdr_outbound", "prospecting"])
          .maybeSingle();

        let leadId = existingLead?.id;
        if (!leadId) {
          const { data: newLead } = await supabase
            .from("leads")
            .insert({
              organization_id: ctx.org.id,
              source: "enrichment",
              source_detail: `BrasilAPI CNPJ ${item.cnpj}`,
              status: "new",
              full_name: data.socios?.[0]?.nome ?? null,
              email: data.email ?? null,
              phone: data.telefone ?? null,
              company_name: company?.name ?? null,
              custom_fields: { cnpj: item.cnpj },
            })
            .select("id")
            .single();
          leadId = newLead?.id;
        }

        if (leadId) {
          await scoreAndPersistLead(leadId);
          created.push(leadId);
        } else {
          failed.push({ cnpj: item.cnpj, reason: "Falhou ao criar lead" });
        }
      }
    }

    return NextResponse.json({
      enriched: enriched.length,
      hits: enriched.filter((e) => e.data).length,
      createdLeadIds: created,
      failed,
    });
  } catch (err) {
    console.error("[/api/sdr/enrich] fatal", err);
    return NextResponse.json({ error: "Erro inesperado." }, { status: 500 });
  }
}
