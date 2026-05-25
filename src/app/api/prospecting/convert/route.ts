import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const schema = z.object({ campaign_id: z.string().uuid() });

/**
 * Converte resultados de prospecção em companies + contacts do CRM.
 * Dedupe por domínio (empresa) e por e-mail (contato).
 * Se a campanha tem `auto_enroll` e uma `sequence_id`, já inscreve.
 */
export async function POST(req: NextRequest) {
  const ctx = await requireSession();
  const { campaign_id } = schema.parse(await req.json());
  const admin = createAdminClient();

  const { data: camp } = await admin
    .from("prospecting_campaigns")
    .select("id, auto_enroll, sequence_id")
    .eq("id", campaign_id)
    .eq("organization_id", ctx.org.id)
    .single();
  if (!camp) return NextResponse.json({ error: "campanha" }, { status: 404 });

  const { data: results } = await admin
    .from("prospecting_results")
    .select("*")
    .eq("campaign_id", campaign_id)
    .eq("status", "new");

  let converted = 0;

  for (const r of results ?? []) {
    const re = r as unknown as {
      id: string;
      company_data: Record<string, string | undefined>;
      contact_data: Record<string, string | boolean | undefined> | null;
    };
    const c = re.company_data;
    const p = re.contact_data;

    let companyId: string | null = null;
    if (c?.name) {
      const { data: existingCo } = await admin
        .from("companies")
        .select("id")
        .eq("organization_id", ctx.org.id)
        .or(`domain.eq.${c.domain ?? "_none_"},name.eq.${c.name}`)
        .maybeSingle();
      if (existingCo) companyId = (existingCo as { id: string }).id;
      else {
        const { data: newCo } = await admin
          .from("companies")
          .insert({
            organization_id: ctx.org.id,
            name: c.name,
            domain: c.domain,
            website: c.website,
            industry: c.industry,
            size: c.size,
            country: c.country,
            state: c.state,
            city: c.city,
            address: c.address,
            phone: c.phone,
            linkedin_url: c.linkedin_url,
            description: c.description,
            source: "prospecting",
          })
          .select("id")
          .single();
        companyId = (newCo as { id: string } | null)?.id ?? null;
      }
    }

    let contactId: string | null = null;
    if (p?.full_name) {
      const { data: existingCt } = await admin
        .from("contacts")
        .select("id")
        .eq("organization_id", ctx.org.id)
        .eq("email", (p.email as string) ?? "__none__")
        .maybeSingle();
      if (existingCt) contactId = (existingCt as { id: string }).id;
      else {
        const { data: newCt } = await admin
          .from("contacts")
          .insert({
            organization_id: ctx.org.id,
            company_id: companyId,
            full_name: p.full_name,
            email: p.email,
            job_title: p.job_title,
            seniority: p.seniority,
            linkedin_url: p.linkedin_url,
            is_decision_maker: p.is_decision_maker === true,
            source: "prospecting",
          })
          .select("id")
          .single();
        contactId = (newCt as { id: string } | null)?.id ?? null;
      }
    }

    await admin
      .from("prospecting_results")
      .update({
        status: "converted",
        converted_company_id: companyId,
        converted_contact_id: contactId,
      })
      .eq("id", re.id);

    if (
      contactId &&
      (camp as { auto_enroll: boolean; sequence_id: string | null })
        .auto_enroll &&
      (camp as { sequence_id: string | null }).sequence_id
    ) {
      await admin
        .from("sequence_enrollments")
        .insert({
          organization_id: ctx.org.id,
          sequence_id: (camp as { sequence_id: string }).sequence_id,
          contact_id: contactId,
        })
        .select("id");
    }

    converted++;
  }

  return NextResponse.json({ ok: true, converted });
}
