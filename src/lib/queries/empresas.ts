import { createClient } from "@/lib/supabase/server";

export type CompanyRow = {
  id: string;
  name: string;
  legal_name: string | null;
  cnpj: string | null;
  domain: string | null;
  website: string | null;
  industry: string | null;
  size: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  address: string | null;
  zipcode: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  notes: string | null;
  linkedin_url: string | null;
  description: string | null;
  source: string | null;
  tags: string[] | null;
  owner_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function listCompanies(
  orgId: string,
  opts: {
    search?: string;
    industry?: string;
    state?: string;
    city?: string;
    limit?: number;
  } = {},
) {
  const supabase = await createClient();
  let q = supabase
    .from("companies")
    .select(
      "id, name, legal_name, cnpj, domain, website, industry, size, phone, city, state, country, address, zipcode, linkedin_url, description, source, tags, owner_id, created_at, updated_at",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.search && opts.search.trim()) {
    const s = opts.search.trim();
    q = q.or(
      `name.ilike.%${s}%,cnpj.ilike.%${s}%,domain.ilike.%${s}%,legal_name.ilike.%${s}%`,
    );
  }
  if (opts.industry && opts.industry.trim()) {
    q = q.eq("industry", opts.industry.trim());
  }
  if (opts.state && opts.state.trim()) {
    q = q.eq("state", opts.state.trim().toUpperCase());
  }
  if (opts.city && opts.city.trim()) {
    q = q.eq("city", opts.city.trim());
  }
  const { data } = await q;
  return (data ?? []) as CompanyRow[];
}

export async function getCompany(orgId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("*")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  return data as CompanyRow | null;
}

export async function listCityOptionsByState(orgId: string, state?: string) {
  if (!state) return [] as string[];
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("city")
    .eq("organization_id", orgId)
    .eq("state", state.toUpperCase())
    .not("city", "is", null);
  const set = new Set<string>();
  (data ?? []).forEach((r: { city: string | null }) => {
    if (r.city) set.add(r.city);
  });
  return Array.from(set).sort();
}

export async function listCompanyOptions(orgId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name")
    .eq("organization_id", orgId)
    .order("name", { ascending: true })
    .limit(500);
  return (data ?? []) as { id: string; name: string }[];
}

export async function getCompanyCounts(orgId: string, companyId: string) {
  const supabase = await createClient();
  const [contacts, leadsByName, deals, activities] = await Promise.all([
    supabase
      .from("contacts")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("company_id", companyId),
    // leads don't store company_id, only company_name — best-effort
    supabase
      .from("leads")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId),
    supabase
      .from("deals")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("company_id", companyId),
    supabase
      .from("activities")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", orgId)
      .eq("company_id", companyId),
  ]);
  return {
    contacts: contacts.count ?? 0,
    leads: leadsByName.count ?? 0,
    deals: deals.count ?? 0,
    activities: activities.count ?? 0,
  };
}
