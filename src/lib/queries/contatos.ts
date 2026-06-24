import { createClient } from "@/lib/supabase/server";

export type ContactRow = {
  id: string;
  full_name: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  job_title: string | null;
  seniority: string | null;
  department: string | null;
  linkedin_url: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  complement: string | null;
  neighborhood: string | null;
  is_decision_maker: boolean | null;
  do_not_contact: boolean | null;
  email_status: string | null;
  phone_status: string | null;
  tags: string[] | null;
  source: string | null;
  owner_id: string | null;
  company_id: string | null;
  created_at: string | null;
  updated_at: string | null;
  companies?: { id: string; name: string } | null;
};

export async function listContacts(
  orgId: string,
  opts: {
    search?: string;
    companyId?: string;
    state?: string;
    city?: string;
    limit?: number;
  } = {},
) {
  const supabase = await createClient();
  let q = supabase
    .from("contacts")
    .select(
      "id, full_name, email, phone, whatsapp, job_title, department, seniority, is_decision_maker, do_not_contact, company_id, city, state, created_at, companies(id,name)",
    )
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(opts.limit ?? 200);

  if (opts.search && opts.search.trim()) {
    const s = opts.search.trim();
    q = q.or(`full_name.ilike.%${s}%,email.ilike.%${s}%,phone.ilike.%${s}%`);
  }
  if (opts.companyId && opts.companyId.trim()) {
    q = q.eq("company_id", opts.companyId);
  }
  if (opts.state && opts.state.trim()) {
    q = q.eq("state", opts.state.trim().toUpperCase());
  }
  if (opts.city && opts.city.trim()) {
    q = q.eq("city", opts.city.trim());
  }
  const { data } = await q;
  return (data ?? []) as unknown as ContactRow[];
}

export async function getContact(orgId: string, id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("*, companies(id,name)")
    .eq("organization_id", orgId)
    .eq("id", id)
    .maybeSingle();
  return data as ContactRow | null;
}

export async function listContactsByCompany(orgId: string, companyId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("id, full_name, job_title, email, phone, is_decision_maker")
    .eq("organization_id", orgId)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as {
    id: string;
    full_name: string;
    job_title: string | null;
    email: string | null;
    phone: string | null;
    is_decision_maker: boolean | null;
  }[];
}
