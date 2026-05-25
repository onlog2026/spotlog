-- ============================================================
-- 003 — CRM Core: empresas (companies), contatos (contacts), leads
-- ============================================================

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  legal_name text,
  cnpj text,
  domain text,
  website text,
  industry text,
  size_range text,
  employees_count int,
  annual_revenue numeric,
  phone text,
  email text,
  linkedin_url text,
  instagram_url text,
  description text,
  address_street text,
  address_number text,
  address_complement text,
  address_neighborhood text,
  address_city text,
  address_state text,
  address_zip text,
  address_country text default 'BR',
  latitude numeric,
  longitude numeric,
  source text,
  tags text[] default '{}',
  custom_fields jsonb default '{}'::jsonb,
  owner_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_companies_org on public.companies(organization_id);
create index if not exists idx_companies_owner on public.companies(owner_id);
create index if not exists idx_companies_domain on public.companies(domain);
create index if not exists idx_companies_name_trgm
  on public.companies using gin (name gin_trgm_ops);

create trigger trg_companies_updated
  before update on public.companies
  for each row execute function public.set_updated_at();

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  full_name text not null,
  first_name text,
  last_name text,
  email text,
  phone text,
  whatsapp text,
  job_title text,
  seniority text,
  department text,
  linkedin_url text,
  is_decision_maker boolean default false,
  email_status text default 'unknown',
  whatsapp_status text default 'unknown',
  opted_out boolean default false,
  opted_out_at timestamptz,
  source text,
  tags text[] default '{}',
  custom_fields jsonb default '{}'::jsonb,
  owner_id uuid references public.profiles(id) on delete set null,
  last_contacted_at timestamptz,
  last_replied_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_contacts_org on public.contacts(organization_id);
create index if not exists idx_contacts_company on public.contacts(company_id);
create index if not exists idx_contacts_email on public.contacts(email);
create index if not exists idx_contacts_owner on public.contacts(owner_id);
create index if not exists idx_contacts_name_trgm
  on public.contacts using gin (full_name gin_trgm_ops);

create trigger trg_contacts_updated
  before update on public.contacts
  for each row execute function public.set_updated_at();

-- ============================================================
-- Leads: entrada inicial (form, prospecção). Vira contact/deal depois.
-- ============================================================
create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  whatsapp text,
  company_name text,
  job_title text,
  website text,
  message text,
  source text not null,        -- 'form', 'apollo', 'google_places', 'linkedin', 'manual'
  source_metadata jsonb default '{}'::jsonb,
  score int default 0,
  status public.lead_status default 'new',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  user_agent text,
  ip_address text,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_leads_org on public.leads(organization_id);
create index if not exists idx_leads_status on public.leads(status);
create index if not exists idx_leads_assigned on public.leads(assigned_to);
create index if not exists idx_leads_email on public.leads(email);
create index if not exists idx_leads_created on public.leads(created_at desc);

create trigger trg_leads_updated
  before update on public.leads
  for each row execute function public.set_updated_at();
