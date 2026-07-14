-- Sprint Tickets + Permissions: multi-categoria, API externa, módulos
-- Aplicada via Supabase MCP em 2026-05-26

-- 1) Coluna "department" em support_tickets
alter table public.support_tickets
  add column if not exists department text not null default 'sac'
    check (department in ('comercial','financeiro','sac','tecnico'));
create index if not exists idx_support_tickets_department on support_tickets(organization_id, department, status);

-- 2) Permissões granulares por user/módulo
create table if not exists public.user_module_permissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null check (module in (
    'crm','pipeline','propostas','prospeccao','cadencias',
    'tickets_comercial','tickets_financeiro','tickets_sac','tickets_tecnico',
    'operacao','cms','sdr','admin','superadmin',
    'cliente_remessas','cliente_chamados','cliente_financeiro'
  )),
  can_read boolean not null default true,
  can_write boolean not null default false,
  granted_by uuid references auth.users(id),
  granted_at timestamptz default now(),
  unique(organization_id, user_id, module)
);
create index if not exists idx_ump_org_user on user_module_permissions(organization_id, user_id);

-- 3) API keys de integração (parceiros / plataforma de pedidos)
create table if not exists public.integration_api_keys (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  token_hash text not null unique,
  token_prefix text not null,
  scopes text[] not null default '{tickets:read,tickets:write,orders:webhook}',
  active boolean default true,
  last_used_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id),
  expires_at timestamptz
);
create index if not exists idx_iak_hash on integration_api_keys(token_hash);
create index if not exists idx_iak_org_active on integration_api_keys(organization_id, active);

-- 4) Espelho de ordens externas
create table if not exists public.external_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  external_id text not null,
  external_source text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  total numeric,
  status text,
  raw_payload jsonb,
  ticket_id uuid references support_tickets(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(organization_id, external_source, external_id)
);
create index if not exists idx_eo_org_status on external_orders(organization_id, status);

-- 5) Log de webhooks recebidos
create table if not exists public.integration_webhook_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  source text not null,
  event_type text not null,
  payload jsonb,
  processed boolean default false,
  ticket_id uuid references support_tickets(id),
  external_order_id uuid references external_orders(id),
  error_message text,
  received_at timestamptz default now()
);

-- 6) RLS
alter table user_module_permissions enable row level security;
alter table integration_api_keys enable row level security;
alter table external_orders enable row level security;
alter table integration_webhook_events enable row level security;

create policy "ump_self_read" on user_module_permissions for select using (user_id = auth.uid() or public.has_org_role(organization_id, array['owner','admin']::org_role[]));
create policy "ump_admin_all" on user_module_permissions for all using (public.has_org_role(organization_id, array['owner','admin']::org_role[])) with check (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

create policy "iak_admin_all" on integration_api_keys for all using (public.has_org_role(organization_id, array['owner','admin']::org_role[])) with check (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

create policy "eo_member" on external_orders for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

create policy "iwe_admin" on integration_webhook_events for select using (public.has_org_role(organization_id, array['owner','admin']::org_role[]));

-- 7) Helper: usuario tem permissão de módulo?
create or replace function public.has_module_permission(p_user uuid, p_org uuid, p_module text, p_write boolean default false)
returns boolean
language sql
stable
as $$
  select coalesce(
    (select case when p_write then can_write else can_read end
     from user_module_permissions
     where user_id = p_user and organization_id = p_org and module = p_module),
    (select role in ('owner','admin') from organization_members where user_id = p_user and organization_id = p_org)
  );
$$;
grant execute on function public.has_module_permission(uuid,uuid,text,boolean) to authenticated;

-- 8) Helper: validar token de API (server-side com service_role)
create or replace function public.validate_api_token(p_token_hash text)
returns table(organization_id uuid, scopes text[], api_key_id uuid)
language sql
stable
as $$
  select organization_id, scopes, id
  from integration_api_keys
  where token_hash = p_token_hash
    and active = true
    and (expires_at is null or expires_at > now())
  limit 1;
$$;
