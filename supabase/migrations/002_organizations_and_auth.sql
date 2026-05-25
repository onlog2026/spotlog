-- ============================================================
-- 002 — Organizações (multi-tenant) e perfis de usuário
-- ============================================================

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  website text,
  industry text,
  size_range text,
  country text default 'BR',
  timezone text default 'America/Sao_Paulo',
  plan text default 'trial',
  trial_ends_at timestamptz default (now() + interval '14 days'),
  settings jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_organizations_slug on public.organizations(slug);

create trigger trg_organizations_updated
  before update on public.organizations
  for each row execute function public.set_updated_at();

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  avatar_url text,
  phone text,
  default_organization_id uuid references public.organizations(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_profiles_email on public.profiles(email);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

create table if not exists public.organization_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.user_role not null default 'sdr',
  invited_by uuid references public.profiles(id),
  invited_at timestamptz,
  accepted_at timestamptz default now(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, user_id)
);
create index if not exists idx_org_members_user on public.organization_members(user_id);
create index if not exists idx_org_members_org on public.organization_members(organization_id);

create trigger trg_org_members_updated
  before update on public.organization_members
  for each row execute function public.set_updated_at();

-- Convites por e-mail (usuário ainda não cadastrou)
create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role public.user_role not null default 'sdr',
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  invited_by uuid references public.profiles(id),
  expires_at timestamptz default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_org_invites_email on public.organization_invitations(email);
create index if not exists idx_org_invites_token on public.organization_invitations(token);

-- ============================================================
-- Trigger: ao criar usuário no auth, cria perfil
-- ============================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Função helper: organizações às quais o usuário pertence
-- ============================================================
create or replace function public.user_organizations(uid uuid)
returns setof uuid
language sql stable security definer as $$
  select organization_id from public.organization_members where user_id = uid;
$$;

create or replace function public.is_org_member(uid uuid, oid uuid)
returns boolean
language sql stable security definer as $$
  select exists (
    select 1 from public.organization_members
    where user_id = uid and organization_id = oid
  );
$$;

create or replace function public.user_org_role(uid uuid, oid uuid)
returns public.user_role
language sql stable security definer as $$
  select role from public.organization_members
  where user_id = uid and organization_id = oid
  limit 1;
$$;
