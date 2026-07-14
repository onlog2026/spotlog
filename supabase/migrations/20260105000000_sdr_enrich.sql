-- SPRINT 4: SDR Digital LGPD-safe + Enriquecimento
-- Aplicada via mcp__supabase__apply_migration em 2026-05-26

-- Consentimento e opt-out (LGPD)
create table if not exists public.lead_consents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  email text,
  phone text,
  consent_type text not null check (consent_type in ('opt_in','opt_out','legitimate_interest','unsubscribed')),
  legal_basis text not null check (legal_basis in ('consentimento','interesse_legitimo','execucao_contrato','obrigacao_legal')),
  source text,
  ip_address inet,
  user_agent text,
  recorded_at timestamptz not null default now(),
  expires_at timestamptz,
  notes text
);
create index if not exists idx_lead_consents_email on lead_consents(lower(email));
create index if not exists idx_lead_consents_phone on lead_consents(phone);
create index if not exists idx_lead_consents_contact on lead_consents(contact_id);
create index if not exists idx_lead_consents_org on lead_consents(organization_id);

-- Suppression list
create table if not exists public.suppression_list (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text,
  phone text,
  reason text not null,
  added_at timestamptz not null default now(),
  unique (organization_id, email),
  unique (organization_id, phone)
);
create index if not exists idx_suppression_email on suppression_list(lower(email));
create index if not exists idx_suppression_phone on suppression_list(phone);

-- Enrichment cache
create table if not exists public.company_enrichment (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  cnpj text,
  domain text,
  enriched_data jsonb not null default '{}'::jsonb,
  source text,
  enriched_at timestamptz not null default now(),
  unique (organization_id, cnpj),
  unique (organization_id, domain)
);

-- Lead scoring snapshot
create table if not exists public.lead_scores (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  score int not null check (score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  computed_at timestamptz not null default now()
);
create index if not exists idx_lead_scores_lead on lead_scores(lead_id, computed_at desc);

-- Outbound dispatch queue
create table if not exists public.outbound_queue (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  enrollment_id uuid references sequence_enrollments(id) on delete cascade,
  channel text not null check (channel in ('email','whatsapp')),
  to_email text,
  to_phone text,
  subject text,
  body text,
  scheduled_for timestamptz not null,
  status text not null default 'pendente' check (status in ('pendente','enviado','falhou','suprimido')),
  attempts int not null default 0,
  error text,
  sent_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_outbound_queue_scheduled on outbound_queue(status, scheduled_for);

-- RLS
alter table lead_consents enable row level security;
alter table suppression_list enable row level security;
alter table company_enrichment enable row level security;
alter table lead_scores enable row level security;
alter table outbound_queue enable row level security;

drop policy if exists "lead_consents_member" on lead_consents;
drop policy if exists "suppression_member" on suppression_list;
drop policy if exists "company_enrichment_member" on company_enrichment;
drop policy if exists "lead_scores_member" on lead_scores;
drop policy if exists "outbound_queue_member" on outbound_queue;

create policy "lead_consents_member" on lead_consents for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "suppression_member" on suppression_list for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "company_enrichment_member" on company_enrichment for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "lead_scores_member" on lead_scores for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));
create policy "outbound_queue_member" on outbound_queue for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

-- Função: checar se contato é safe pra outbound
create or replace function public.is_outbound_safe(p_org uuid, p_email text, p_phone text)
returns boolean
language sql
stable
as $$
  select
    not exists (
      select 1 from suppression_list
      where organization_id = p_org
        and (
          (p_email is not null and lower(email) = lower(p_email))
          or (p_phone is not null and phone = p_phone)
        )
    )
    and exists (
      select 1 from lead_consents
      where organization_id = p_org
        and consent_type in ('opt_in','legitimate_interest')
        and (
          (p_email is not null and lower(email) = lower(p_email))
          or (p_phone is not null and phone = p_phone)
        )
        and (expires_at is null or expires_at > now())
    );
$$;
