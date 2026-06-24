"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { runCampaign, type CampaignType } from "@/lib/prospeccao/engine";

const createSchema = z.object({
  name: z.string().min(2, "Nome muito curto"),
  type: z.enum(["cnpj_list", "segmento", "domain_list"]),
  cnpjs_raw: z.string().optional(),
  domains_raw: z.string().optional(),
  industries: z.string().optional(),
  states: z.string().optional(),
  cities: z.string().optional(),
  ai_persona: z.string().optional(),
});

function splitLines(raw: string | undefined): string[] {
  if (!raw) return [];
  return raw
    .split(/[\n,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function criarCampanha(formData: FormData) {
  const ctx = await requireSession();
  const parsed = createSchema.safeParse({
    name: formData.get("name"),
    type: formData.get("type"),
    cnpjs_raw: formData.get("cnpjs_raw") ?? "",
    domains_raw: formData.get("domains_raw") ?? "",
    industries: formData.get("industries") ?? "",
    states: formData.get("states") ?? "",
    cities: formData.get("cities") ?? "",
    ai_persona: formData.get("ai_persona") ?? "",
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues.map((i) => i.message).join("; "));
  }
  const v = parsed.data;
  const type = v.type as CampaignType;
  const cnpjs = splitLines(v.cnpjs_raw);
  const domains = splitLines(v.domains_raw);
  const industries = splitLines(v.industries);
  const states = splitLines(v.states);
  const cities = splitLines(v.cities);

  const icp: Record<string, unknown> = {
    type,
    cnpjs: type === "cnpj_list" ? cnpjs : [],
    domains: type === "domain_list" ? domains : [],
    industries,
    states,
    cities,
  };

  const totalTarget =
    type === "cnpj_list"
      ? cnpjs.length || 1
      : type === "domain_list"
        ? domains.length || 1
        : 100;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("prospecting_campaigns")
    .insert({
      organization_id: ctx.org.id,
      name: v.name,
      icp,
      sources: [type],
      daily_limit: Math.min(500, totalTarget),
      total_target: totalTarget,
      ai_persona: v.ai_persona ?? null,
      status: "running",
      created_by: ctx.user.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    throw new Error(error?.message ?? "Erro ao criar campanha");
  }
  const id = (data as { id: string }).id;

  // Fire and forget — engine atualiza job + campaign quando termina
  void runCampaign(id).catch((e) =>
    console.warn("[criarCampanha] runCampaign falhou", e),
  );

  revalidatePath("/app/prospeccao");
  redirect(`/app/prospeccao/${id}`);
}

export async function excluirCampanha(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id obrigatório");

  const admin = createAdminClient();
  // Cascata: results, jobs, campaign
  await admin
    .from("prospecting_results")
    .delete()
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", id);
  await admin
    .from("prospecting_jobs")
    .delete()
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", id);
  await admin
    .from("prospecting_campaigns")
    .delete()
    .eq("organization_id", ctx.org.id)
    .eq("id", id);

  revalidatePath("/app/prospeccao");
  redirect("/app/prospeccao");
}

export async function reexecutarCampanha(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id obrigatório");
  const admin = createAdminClient();
  await admin
    .from("prospecting_campaigns")
    .update({ status: "running" })
    .eq("organization_id", ctx.org.id)
    .eq("id", id);
  void runCampaign(id).catch((e) =>
    console.warn("[reexecutarCampanha]", e),
  );
  revalidatePath(`/app/prospeccao/${id}`);
}

export async function converterResultadoEmLead(formData: FormData) {
  const ctx = await requireSession();
  const resultId = String(formData.get("result_id") ?? "");
  if (!resultId) throw new Error("result_id obrigatório");

  const admin = createAdminClient();
  const { data: rData } = await admin
    .from("prospecting_results")
    .select("*")
    .eq("id", resultId)
    .eq("organization_id", ctx.org.id)
    .maybeSingle();
  if (!rData) throw new Error("Resultado não encontrado");

  await convertSingleResult(ctx.org.id, rData);
  revalidatePath(
    `/app/prospeccao/${(rData as { campaign_id: string }).campaign_id}`,
  );
}

export async function converterTodosResultados(formData: FormData) {
  const ctx = await requireSession();
  const campaignId = String(formData.get("campaign_id") ?? "");
  if (!campaignId) throw new Error("campaign_id obrigatório");

  const admin = createAdminClient();
  const { data: results } = await admin
    .from("prospecting_results")
    .select("*")
    .eq("organization_id", ctx.org.id)
    .eq("campaign_id", campaignId)
    .eq("status", "new");

  for (const r of (results ?? []) as Array<Record<string, unknown>>) {
    await convertSingleResult(ctx.org.id, r);
  }
  revalidatePath(`/app/prospeccao/${campaignId}`);
}

export async function descartarResultado(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("result_id") ?? "");
  if (!id) throw new Error("result_id obrigatório");

  const admin = createAdminClient();
  const { data } = await admin
    .from("prospecting_results")
    .update({ status: "discarded" })
    .eq("id", id)
    .eq("organization_id", ctx.org.id)
    .select("campaign_id")
    .single();
  const campaignId = (data as { campaign_id?: string } | null)?.campaign_id;
  if (campaignId) revalidatePath(`/app/prospeccao/${campaignId}`);
}

async function convertSingleResult(
  orgId: string,
  result: Record<string, unknown>,
): Promise<void> {
  const admin = createAdminClient();
  const cd = (result.company_data ?? {}) as Record<string, string | undefined>;
  const pd = result.contact_data as Record<string, string | undefined> | null;
  const resultId = result.id as string;

  let companyId: string | null = null;
  if (cd?.name) {
    // Dedupe por CNPJ ou domain ou name
    const orParts: string[] = [];
    if (cd.cnpj) orParts.push(`cnpj.eq.${cd.cnpj}`);
    if (cd.domain) orParts.push(`domain.eq.${cd.domain}`);
    orParts.push(`name.eq.${cd.name.replace(/,/g, " ")}`);
    const { data: existing } = await admin
      .from("companies")
      .select("id")
      .eq("organization_id", orgId)
      .or(orParts.join(","))
      .maybeSingle();

    if (existing) {
      companyId = (existing as { id: string }).id;
    } else {
      const { data: newCo } = await admin
        .from("companies")
        .insert({
          organization_id: orgId,
          name: cd.name,
          legal_name: cd.legal_name ?? cd.name,
          cnpj: cd.cnpj ?? null,
          domain: cd.domain ?? null,
          website: cd.website ?? null,
          industry: cd.industry ?? null,
          size: cd.size ?? null,
          city: cd.city ?? null,
          state: cd.state ?? null,
          address: cd.address ?? null,
          phone: cd.phone ?? null,
          description: cd.description ?? null,
          source: "prospecting",
        })
        .select("id")
        .single();
      companyId = (newCo as { id: string } | null)?.id ?? null;
    }
  }

  // Cria lead na primeira stage da pipeline default
  const { data: lead } = await admin
    .from("leads")
    .insert({
      organization_id: orgId,
      source: "prospecting",
      source_detail: (result.source as string) ?? "prospeccao",
      status: "new",
      full_name: pd?.full_name ?? cd?.name ?? "Lead",
      email: pd?.email ?? null,
      phone: pd?.phone ?? cd?.phone ?? null,
      company_name: cd?.name ?? null,
      job_title: pd?.job_title ?? null,
      score: Number(result.match_score ?? 50),
      custom_fields: {
        cnpj: cd?.cnpj,
        domain: cd?.domain,
        industry: cd?.industry,
        city: cd?.city,
        state: cd?.state,
        prospecting_result_id: resultId,
      },
    })
    .select("id")
    .single();
  const leadId = (lead as { id: string } | null)?.id ?? null;

  await admin
    .from("prospecting_results")
    .update({
      status: "converted",
      converted_company_id: companyId,
      converted_contact_id: leadId,
    })
    .eq("id", resultId);
}
