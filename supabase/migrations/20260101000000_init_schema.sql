-- =====================================================================
-- SDR.AI — Schema inicial
-- Multi-tenant baseado em organizations.
-- Todas as tabelas com RLS. Acesso por papel do membro da organização.
-- =====================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- =====================================================================
-- ENUMS
-- =====================================================================
do $$
begin
  create type org_role as enum ('owner','admin','manager','sdr','closer','viewer');
exception when duplicate_object then null; end $$;

do $$
begin
  create type lead_status as enum (
    'new','contacted','qualified','disqualified','converted','recycled'
  );
exception when duplicate_object then null; end $$;

do $$
begin
  create type deal_status as enum ('open','won','lost','archived');
exception when duplicate_object then null; end $$;

do $$
begin
  create type activity_type as enum (
    'note','call','meeting','task','email','whatsapp','sms','linkedin'
  );
exception when duplicate_object then null; end $$;

do $$
begin
  create type activity_status as enum ('pending','done','canceled');
exception when duplicate_object then null; end $$;

do $$
begin
  create type message_channel as enum ('email','whatsapp','sms','linkedin');
exception when duplicate_object then null; end $$;

do $$
begin
  create type message_direction as enum ('outbound','inbound');
exception when duplicate_object then null; end $$;

do $$
begin
  create type message_status as enum (
    'queued','sending','sent','delivered','opened','clicked','replied','bounced','failed'
  );
exception when duplicate_object then null; end $$;

do $$
begin
  create type sequence_step_kind as enum ('email','whatsapp','wait','manual_task','linkedin');
exception when duplicate_object then null; end $$;

do $$
begin
  create type enrollment_status as enum ('active','paused','finished','replied','bounced','opted_out');
exception when duplicate_object then null; end $$;

do $$
begin
  create type proposal_status as enum ('draft','sent','viewed','accepted','rejected','expired');
exception when duplicate_object then null; end $$;

do $$
begin
  create type prospecting_status as enum ('draft','running','paused','completed','error');
exception when duplicate_object then null; end $$;

do $$
begin
  create type integration_provider as enum (
    'openai','anthropic','resend','sendgrid','evolution','zapi',
    'apollo','google_places','linkedin','hubspot','rd_station','pipedrive','webhook'
  );
exception when duplicate_object then null; end $$;

-- =====================================================================
-- ORGANIZATIONS / USERS / MEMBERSHIP
-- =====================================================================
create table if not exists public.organizations (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  logo_url text,
  domain text,
  plan text default 'free',
  trial_ends_at timestamptz,
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_organizations_slug on public.organizations(slug);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  avatar_url text,
  phone text,
  job_title text,
  current_org_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.organization_members (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role org_role not null default 'sdr',
  invited_by uuid references auth.users(id),
  joined_at timestamptz default now(),
  unique (organization_id, user_id)
);
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);

-- =====================================================================
-- HELPER FUNCTIONS para RLS
-- =====================================================================
create or replace function public.user_orgs(uid uuid)
returns setof uuid
language sql stable security definer
set search_path = public
as $$
  select organization_id from public.organization_members where user_id = uid
$$;

create or replace function public.is_org_member(org uuid, uid uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = uid
  )
$$;

create or replace function public.has_org_role(org uuid, roles org_role[], uid uuid default auth.uid())
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_members
    where organization_id = org and user_id = uid and role = any(roles)
  )
$$;

-- =====================================================================
-- COMPANIES (contas / empresas do prospect)
-- =====================================================================
create table if not exists public.companies (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  legal_name text,
  cnpj text,
  domain text,
  website text,
  industry text,
  size text,
  revenue_range text,
  country text default 'BR',
  state text,
  city text,
  address text,
  zipcode text,
  phone text,
  linkedin_url text,
  description text,
  tags text[] default '{}',
  source text,
  enrichment_data jsonb default '{}'::jsonb,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_companies_org on public.companies(organization_id);
create index if not exists idx_companies_name_trgm on public.companies using gin (name gin_trgm_ops);

-- =====================================================================
-- CONTACTS (pessoas / decisores)
-- =====================================================================
create table if not exists public.contacts (
  id uuid primary key default uuid_generate_v4(),
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
  city text,
  state text,
  country text default 'BR',
  is_decision_maker boolean default false,
  email_status text,
  phone_status text,
  do_not_contact boolean default false,
  unsubscribed_at timestamptz,
  tags text[] default '{}',
  source text,
  enrichment_data jsonb default '{}'::jsonb,
  owner_id uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_contacts_org on public.contacts(organization_id);
create index if not exists idx_contacts_company on public.contacts(company_id);
create index if not exists idx_contacts_email on public.contacts(organization_id, email);
create index if not exists idx_contacts_name_trgm on public.contacts using gin (full_name gin_trgm_ops);

-- =====================================================================
-- LEADS (entradas brutas que ainda não viraram contact qualificado)
-- =====================================================================
create table if not exists public.leads (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  source text not null default 'form',
  source_detail text,
  status lead_status not null default 'new',
  score int default 0,
  full_name text,
  email text,
  phone text,
  whatsapp text,
  company_name text,
  job_title text,
  message text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  page_url text,
  ip text,
  user_agent text,
  custom_fields jsonb default '{}'::jsonb,
  assigned_to uuid references auth.users(id) on delete set null,
  converted_contact_id uuid references public.contacts(id) on delete set null,
  converted_deal_id uuid,
  converted_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_leads_org on public.leads(organization_id);
create index if not exists idx_leads_status on public.leads(organization_id, status);
create index if not exists idx_leads_assigned on public.leads(assigned_to);

-- =====================================================================
-- PIPELINES + STAGES + DEALS
-- =====================================================================
create table if not exists public.pipelines (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  is_default boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_pipelines_org on public.pipelines(organization_id);

create table if not exists public.pipeline_stages (
  id uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  position int not null default 0,
  probability int default 0,
  color text,
  is_won boolean default false,
  is_lost boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_stages_pipeline on public.pipeline_stages(pipeline_id, position);

create table if not exists public.deals (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  pipeline_id uuid not null references public.pipelines(id) on delete restrict,
  stage_id uuid not null references public.pipeline_stages(id) on delete restrict,
  title text not null,
  amount numeric(14,2) default 0,
  currency text default 'BRL',
  probability int default 0,
  status deal_status not null default 'open',
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  expected_close_date date,
  closed_at timestamptz,
  lost_reason text,
  source text,
  tags text[] default '{}',
  custom_fields jsonb default '{}'::jsonb,
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_deals_org on public.deals(organization_id);
create index if not exists idx_deals_stage on public.deals(stage_id, position);
create index if not exists idx_deals_owner on public.deals(owner_id);
create index if not exists idx_deals_status on public.deals(organization_id, status);

-- FK depois de criar deals
alter table public.leads
  drop constraint if exists leads_converted_deal_fk,
  add constraint leads_converted_deal_fk
    foreign key (converted_deal_id) references public.deals(id) on delete set null;

-- =====================================================================
-- ACTIVITIES (notas, ligações, tarefas, reuniões)
-- =====================================================================
create table if not exists public.activities (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  type activity_type not null,
  status activity_status not null default 'pending',
  subject text,
  content text,
  contact_id uuid references public.contacts(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  deal_id uuid references public.deals(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete cascade,
  due_at timestamptz,
  completed_at timestamptz,
  duration_minutes int,
  outcome text,
  owner_id uuid references auth.users(id) on delete set null,
  created_by uuid references auth.users(id) on delete set null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_activities_org on public.activities(organization_id);
create index if not exists idx_activities_deal on public.activities(deal_id);
create index if not exists idx_activities_contact on public.activities(contact_id);
create index if not exists idx_activities_owner on public.activities(owner_id);
create index if not exists idx_activities_due on public.activities(organization_id, status, due_at);

-- =====================================================================
-- SEQUENCES / CADÊNCIAS
-- =====================================================================
create table if not exists public.sequences (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  is_active boolean default true,
  default_channel message_channel default 'email',
  ai_prompt text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_sequences_org on public.sequences(organization_id);

create table if not exists public.sequence_steps (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  position int not null,
  kind sequence_step_kind not null,
  wait_days int default 0,
  wait_hours int default 0,
  subject text,
  body text,
  template_variables jsonb default '{}'::jsonb,
  send_window_start text,
  send_window_end text,
  ai_personalize boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_seq_steps_sequence on public.sequence_steps(sequence_id, position);

create table if not exists public.sequence_enrollments (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  sequence_id uuid not null references public.sequences(id) on delete cascade,
  contact_id uuid not null references public.contacts(id) on delete cascade,
  current_step int default 0,
  status enrollment_status not null default 'active',
  next_action_at timestamptz default now(),
  enrolled_by uuid references auth.users(id) on delete set null,
  enrolled_at timestamptz default now(),
  finished_at timestamptz,
  unique (sequence_id, contact_id)
);
create index if not exists idx_enrollments_org on public.sequence_enrollments(organization_id);
create index if not exists idx_enrollments_status on public.sequence_enrollments(status, next_action_at);

-- =====================================================================
-- MESSAGES / THREADS (inbox unificada)
-- =====================================================================
create table if not exists public.conversations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  channel message_channel not null,
  contact_id uuid references public.contacts(id) on delete cascade,
  subject text,
  last_message_at timestamptz default now(),
  unread_count int default 0,
  assigned_to uuid references auth.users(id) on delete set null,
  is_open boolean default true,
  created_at timestamptz default now()
);
create index if not exists idx_conversations_org on public.conversations(organization_id);
create index if not exists idx_conversations_contact on public.conversations(contact_id);

create table if not exists public.messages (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  channel message_channel not null,
  direction message_direction not null,
  status message_status not null default 'queued',
  from_address text,
  to_address text,
  subject text,
  body_text text,
  body_html text,
  contact_id uuid references public.contacts(id) on delete set null,
  deal_id uuid references public.deals(id) on delete set null,
  sequence_id uuid references public.sequences(id) on delete set null,
  sequence_step_id uuid references public.sequence_steps(id) on delete set null,
  enrollment_id uuid references public.sequence_enrollments(id) on delete set null,
  sent_by uuid references auth.users(id) on delete set null,
  provider_message_id text,
  provider text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  clicked_at timestamptz,
  replied_at timestamptz,
  error text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);
create index if not exists idx_messages_org on public.messages(organization_id);
create index if not exists idx_messages_conversation on public.messages(conversation_id, created_at);
create index if not exists idx_messages_status on public.messages(status, scheduled_for);

-- =====================================================================
-- PRODUCTS / PRICE TABLES (catálogo + tabelas Excel importadas)
-- =====================================================================
create table if not exists public.price_tables (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  currency text default 'BRL',
  is_default boolean default false,
  source_filename text,
  imported_by uuid references auth.users(id) on delete set null,
  imported_at timestamptz default now(),
  created_at timestamptz default now()
);
create index if not exists idx_price_tables_org on public.price_tables(organization_id);

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  price_table_id uuid references public.price_tables(id) on delete cascade,
  sku text,
  name text not null,
  description text,
  unit text default 'un',
  price numeric(14,2) not null default 0,
  cost numeric(14,2),
  tax_rate numeric(6,3) default 0,
  discount_pct numeric(6,3) default 0,
  category text,
  is_active boolean default true,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_products_org on public.products(organization_id);
create index if not exists idx_products_table on public.products(price_table_id);
create index if not exists idx_products_name_trgm on public.products using gin (name gin_trgm_ops);

-- =====================================================================
-- PROPOSALS
-- =====================================================================
create table if not exists public.proposals (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  number serial,
  title text not null,
  status proposal_status not null default 'draft',
  deal_id uuid references public.deals(id) on delete set null,
  contact_id uuid references public.contacts(id) on delete set null,
  company_id uuid references public.companies(id) on delete set null,
  price_table_id uuid references public.price_tables(id) on delete set null,
  intro_text text,
  scope text,
  payment_terms text,
  delivery_terms text,
  validity_days int default 15,
  discount_pct numeric(6,3) default 0,
  subtotal numeric(14,2) default 0,
  discount_amount numeric(14,2) default 0,
  tax_amount numeric(14,2) default 0,
  total numeric(14,2) default 0,
  currency text default 'BRL',
  public_token text unique default encode(gen_random_bytes(16), 'hex'),
  signed_by_name text,
  signed_by_email text,
  signed_at timestamptz,
  signed_ip text,
  sent_at timestamptz,
  viewed_at timestamptz,
  rejected_at timestamptz,
  expires_at timestamptz,
  template text default 'modern',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_proposals_org on public.proposals(organization_id);
create index if not exists idx_proposals_deal on public.proposals(deal_id);
create index if not exists idx_proposals_token on public.proposals(public_token);

create table if not exists public.proposal_items (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  proposal_id uuid not null references public.proposals(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  position int default 0,
  sku text,
  name text not null,
  description text,
  quantity numeric(14,3) default 1,
  unit text default 'un',
  unit_price numeric(14,2) default 0,
  discount_pct numeric(6,3) default 0,
  total numeric(14,2) default 0,
  created_at timestamptz default now()
);
create index if not exists idx_proposal_items_prop on public.proposal_items(proposal_id, position);

-- =====================================================================
-- PROSPECTING CAMPAIGNS (ICP + jobs)
-- =====================================================================
create table if not exists public.prospecting_campaigns (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  status prospecting_status not null default 'draft',
  description text,
  icp jsonb not null default '{}'::jsonb,
  -- icp shape:
  --   industries: [string], titles: [string], seniorities: [string],
  --   countries: [string], states: [string], cities: [string],
  --   company_sizes: [string], revenue_ranges: [string],
  --   keywords: [string], excluded_companies: [string]
  sources text[] default '{apollo,google_places}',
  daily_limit int default 50,
  total_target int default 500,
  found_count int default 0,
  enriched_count int default 0,
  sequence_id uuid references public.sequences(id) on delete set null,
  auto_enroll boolean default true,
  ai_persona text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_prospecting_org on public.prospecting_campaigns(organization_id);

create table if not exists public.prospecting_jobs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.prospecting_campaigns(id) on delete cascade,
  source text not null,
  status text not null default 'queued',
  query jsonb default '{}'::jsonb,
  total_found int default 0,
  error text,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_prospecting_jobs_campaign on public.prospecting_jobs(campaign_id);

create table if not exists public.prospecting_results (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  campaign_id uuid not null references public.prospecting_campaigns(id) on delete cascade,
  job_id uuid references public.prospecting_jobs(id) on delete set null,
  source text not null,
  external_id text,
  company_data jsonb,
  contact_data jsonb,
  decision_maker_data jsonb,
  match_score int default 0,
  status text default 'new',
  converted_company_id uuid references public.companies(id) on delete set null,
  converted_contact_id uuid references public.contacts(id) on delete set null,
  created_at timestamptz default now()
);
create index if not exists idx_prospecting_results_campaign on public.prospecting_results(campaign_id);
create index if not exists idx_prospecting_results_status on public.prospecting_results(organization_id, status);

-- =====================================================================
-- INTEGRATIONS / WEBHOOKS
-- =====================================================================
create table if not exists public.integrations (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider integration_provider not null,
  is_active boolean default false,
  display_name text,
  -- credentials são criptografadas via vault em produção;
  -- aqui guardamos como jsonb, mas RLS bloqueia leitura por viewer.
  credentials jsonb not null default '{}'::jsonb,
  settings jsonb default '{}'::jsonb,
  last_test_at timestamptz,
  last_test_ok boolean,
  last_test_error text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (organization_id, provider)
);
create index if not exists idx_integrations_org on public.integrations(organization_id);

create table if not exists public.webhooks (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  url text not null,
  events text[] not null default '{}',
  secret text default encode(gen_random_bytes(32), 'hex'),
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.notifications (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  title text not null,
  body text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);
create index if not exists idx_notifications_user on public.notifications(user_id, is_read, created_at desc);

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  entity text not null,
  entity_id uuid,
  action text not null,
  diff jsonb,
  ip text,
  user_agent text,
  created_at timestamptz default now()
);
create index if not exists idx_audit_org on public.audit_logs(organization_id, created_at desc);

-- =====================================================================
-- TRIGGER: updated_at
-- =====================================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

do $$
declare t text;
begin
  for t in
    select unnest(array[
      'organizations','profiles','companies','contacts','leads','deals',
      'sequences','price_tables','products','proposals','prospecting_campaigns',
      'integrations','activities'
    ])
  loop
    execute format('drop trigger if exists set_updated_at_%I on public.%I;', t, t);
    execute format(
      'create trigger set_updated_at_%I before update on public.%I for each row execute function public.set_updated_at();',
      t, t
    );
  end loop;
end $$;

-- =====================================================================
-- TRIGGER: ao criar usuário em auth.users, criar profile
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email,'@',1)),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- RLS — Ativar em todas
-- =====================================================================
alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.organization_members enable row level security;
alter table public.companies enable row level security;
alter table public.contacts enable row level security;
alter table public.leads enable row level security;
alter table public.pipelines enable row level security;
alter table public.pipeline_stages enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;
alter table public.sequences enable row level security;
alter table public.sequence_steps enable row level security;
alter table public.sequence_enrollments enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.price_tables enable row level security;
alter table public.products enable row level security;
alter table public.proposals enable row level security;
alter table public.proposal_items enable row level security;
alter table public.prospecting_campaigns enable row level security;
alter table public.prospecting_jobs enable row level security;
alter table public.prospecting_results enable row level security;
alter table public.integrations enable row level security;
alter table public.webhooks enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- =====================================================================
-- POLICIES — padrão multi-tenant
-- =====================================================================

-- organizations: vê quem é membro
drop policy if exists "orgs_select_members" on public.organizations;
create policy "orgs_select_members" on public.organizations
  for select using (public.is_org_member(id));

drop policy if exists "orgs_update_admin" on public.organizations;
create policy "orgs_update_admin" on public.organizations
  for update using (public.has_org_role(id, array['owner','admin']::org_role[]));

drop policy if exists "orgs_insert_authenticated" on public.organizations;
create policy "orgs_insert_authenticated" on public.organizations
  for insert with check (auth.uid() is not null);

-- profiles: cada um o seu; outros membros da mesma org veem os colegas
drop policy if exists "profiles_select_self_or_org" on public.profiles;
create policy "profiles_select_self_or_org" on public.profiles
  for select using (
    id = auth.uid() or exists (
      select 1
      from public.organization_members me
      join public.organization_members peer on peer.organization_id = me.organization_id
      where me.user_id = auth.uid() and peer.user_id = profiles.id
    )
  );

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid());

drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self" on public.profiles
  for insert with check (id = auth.uid());

-- organization_members: vê apenas membros das próprias orgs
drop policy if exists "om_select" on public.organization_members;
create policy "om_select" on public.organization_members
  for select using (public.is_org_member(organization_id));

drop policy if exists "om_insert_admin" on public.organization_members;
create policy "om_insert_admin" on public.organization_members
  for insert with check (
    public.has_org_role(organization_id, array['owner','admin']::org_role[])
    or not exists (select 1 from public.organization_members where organization_id = organization_members.organization_id)
  );

drop policy if exists "om_update_admin" on public.organization_members;
create policy "om_update_admin" on public.organization_members
  for update using (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

drop policy if exists "om_delete_admin" on public.organization_members;
create policy "om_delete_admin" on public.organization_members
  for delete using (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

-- Macro para gerar policies tenant-isoladas em uma tabela
-- (escritas manualmente abaixo pra manter o SQL explícito)

-- Função genérica de policy
do $$
declare
  t text;
  tables_simple text[] := array[
    'companies','contacts','leads','pipelines','pipeline_stages','deals',
    'activities','sequences','sequence_steps','sequence_enrollments',
    'conversations','messages','price_tables','products','proposals','proposal_items',
    'prospecting_campaigns','prospecting_jobs','prospecting_results',
    'webhooks','notifications','audit_logs'
  ];
begin
  foreach t in array tables_simple loop
    execute format('drop policy if exists "%s_select_org" on public.%I;', t, t);
    execute format(
      'create policy "%s_select_org" on public.%I for select using (public.is_org_member(organization_id));',
      t, t
    );

    execute format('drop policy if exists "%s_insert_org" on public.%I;', t, t);
    execute format(
      'create policy "%s_insert_org" on public.%I for insert with check (public.is_org_member(organization_id));',
      t, t
    );

    execute format('drop policy if exists "%s_update_org" on public.%I;', t, t);
    execute format(
      'create policy "%s_update_org" on public.%I for update using (public.is_org_member(organization_id));',
      t, t
    );

    execute format('drop policy if exists "%s_delete_org" on public.%I;', t, t);
    execute format(
      'create policy "%s_delete_org" on public.%I for delete using (public.has_org_role(organization_id, array[''owner'',''admin'',''manager'']::org_role[]));',
      t, t
    );
  end loop;
end $$;

-- integrations: somente admin pode ler/editar credenciais
drop policy if exists "integrations_select_admin" on public.integrations;
create policy "integrations_select_admin" on public.integrations
  for select using (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

drop policy if exists "integrations_modify_admin" on public.integrations;
create policy "integrations_modify_admin" on public.integrations
  for all using (public.has_org_role(organization_id, array['owner','admin']::org_role[]))
  with check (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

-- proposals: leitura pública via token (sem auth) feita por service role; sem policy pública
-- =====================================================================
-- SEED: cria pipeline padrão para nova organização
-- =====================================================================
create or replace function public.seed_default_pipeline(org uuid)
returns void language plpgsql security definer set search_path = public as $$
declare pid uuid;
begin
  insert into public.pipelines (organization_id, name, is_default)
  values (org, 'Pipeline principal', true)
  returning id into pid;

  insert into public.pipeline_stages (pipeline_id, organization_id, name, position, probability, color)
  values
    (pid, org, 'Novo lead',         0, 10, '#94a3b8'),
    (pid, org, 'Contato feito',     1, 25, '#3b82f6'),
    (pid, org, 'Qualificado',       2, 40, '#6366f1'),
    (pid, org, 'Proposta enviada',  3, 60, '#a855f7'),
    (pid, org, 'Em negociação',     4, 75, '#ec4899'),
    (pid, org, 'Ganho',             5, 100, '#10b981'),
    (pid, org, 'Perdido',           6, 0,  '#ef4444');

  update public.pipeline_stages set is_won = true  where pipeline_id = pid and name = 'Ganho';
  update public.pipeline_stages set is_lost = true where pipeline_id = pid and name = 'Perdido';
end $$;

-- =====================================================================
-- RPC: criar organização e seed pipeline
-- =====================================================================
create or replace function public.create_organization(
  org_name text,
  org_slug text
) returns uuid
language plpgsql security definer set search_path = public as $$
declare new_org uuid;
begin
  if auth.uid() is null then
    raise exception 'unauthenticated';
  end if;

  insert into public.organizations (name, slug, trial_ends_at)
  values (org_name, org_slug, now() + interval '14 days')
  returning id into new_org;

  insert into public.organization_members (organization_id, user_id, role)
  values (new_org, auth.uid(), 'owner');

  update public.profiles set current_org_id = new_org where id = auth.uid();

  perform public.seed_default_pipeline(new_org);

  return new_org;
end $$;

grant execute on function public.create_organization(text, text) to authenticated;
