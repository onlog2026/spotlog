-- Marketing (Atrair + Converter)
-- Aplicado via MCP Supabase em 2026-05-26.
-- Tabelas + RLS + RPCs `mkt_*` pra contornar PostgREST schema cache stale.
-- Ver `src/lib/queries/marketing.ts` para os tipos do lado cliente.

-- Snapshot resumido — a migration foi aplicada via supabase MCP em duas partes
-- (estrutura + RPCs). Este arquivo é referência idempotente.

create table if not exists public.landing_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  hero_image_url text,
  body_json jsonb not null default '{}'::jsonb,
  cta_label text,
  cta_url text,
  form_slug text,
  status text not null default 'rascunho' check (status in ('rascunho','publicado','arquivado')),
  published_at timestamptz,
  views int default 0,
  conversions int default 0,
  seo_title text,
  seo_description text,
  social_image_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  unique (organization_id, slug)
);

create table if not exists public.popups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  trigger_type text not null default 'time' check (trigger_type in ('time','scroll','exit_intent','page_visit')),
  trigger_value text,
  title text not null,
  body text,
  cta_label text,
  cta_url text,
  cta_form_slug text,
  image_url text,
  display_on_paths text[] default '{"/"}',
  hide_after_close_hours int default 24,
  active boolean default true,
  impressions int default 0,
  clicks int default 0,
  conversions int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.whatsapp_buttons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  phone text not null,
  default_message text default 'Olá! Vim pelo site da Spotlog.',
  position text default 'bottom_right' check (position in ('bottom_right','bottom_left')),
  color text default '#25D366',
  show_on_paths text[] default '{"/"}',
  active boolean default true,
  clicks int default 0,
  created_at timestamptz default now()
);

create table if not exists public.web_push_subs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  endpoint text not null,
  p256dh text,
  auth_key text,
  user_agent text,
  created_at timestamptz default now(),
  unique (organization_id, endpoint)
);

create table if not exists public.web_push_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  title text not null,
  body text not null,
  icon_url text,
  url text,
  scheduled_for timestamptz,
  sent_at timestamptz,
  sent_count int default 0,
  click_count int default 0,
  created_at timestamptz default now()
);

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  network text not null check (network in ('instagram','facebook','linkedin','twitter','tiktok')),
  caption text not null,
  media_url text,
  scheduled_for timestamptz,
  posted_at timestamptz,
  status text default 'rascunho' check (status in ('rascunho','agendado','publicado','falhou')),
  external_post_id text,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.ad_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  platform text not null check (platform in ('meta','google','linkedin','tiktok')),
  name text not null,
  objective text default 'leads',
  daily_budget numeric,
  audience_id uuid,
  form_slug text,
  status text default 'rascunho' check (status in ('rascunho','ativa','pausada','encerrada')),
  external_campaign_id text,
  leads_count int default 0,
  spent numeric default 0,
  created_at timestamptz default now()
);

create table if not exists public.audiences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  type text not null default 'custom' check (type in ('custom','lookalike','retargeting')),
  filters_json jsonb default '{}'::jsonb,
  size_estimate int,
  created_at timestamptz default now()
);

create table if not exists public.seo_pages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  path text not null,
  title text,
  meta_description text,
  keywords text[],
  schema_json jsonb default '{}'::jsonb,
  last_audit_score int,
  last_audit_at timestamptz,
  created_at timestamptz default now(),
  unique (organization_id, path)
);

create table if not exists public.link_in_bio (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  bio text,
  avatar_url text,
  theme text default 'default',
  active boolean default true,
  clicks int default 0,
  created_at timestamptz default now(),
  unique (organization_id, slug)
);

create table if not exists public.link_in_bio_links (
  id uuid primary key default gen_random_uuid(),
  bio_id uuid not null references link_in_bio(id) on delete cascade,
  label text not null,
  url text not null,
  icon text,
  sort int default 0,
  clicks int default 0,
  active boolean default true
);

-- RLS por org (member faz tudo)
alter table landing_pages enable row level security;
alter table popups enable row level security;
alter table whatsapp_buttons enable row level security;
alter table web_push_subs enable row level security;
alter table web_push_campaigns enable row level security;
alter table social_posts enable row level security;
alter table ad_campaigns enable row level security;
alter table audiences enable row level security;
alter table seo_pages enable row level security;
alter table link_in_bio enable row level security;
alter table link_in_bio_links enable row level security;
