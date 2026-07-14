-- Multi-tenant: clientes externos (auth + portal) + broadcasts do super admin
-- Aplicada via MCP em 2026-05-26 (name=multi_tenant_client)

-- Vinculação user (auth.users) → company (cliente externo)
create table if not exists public.company_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid not null references companies(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member','viewer')),
  active boolean not null default true,
  invited_by uuid references auth.users(id),
  invited_at timestamptz default now(),
  accepted_at timestamptz,
  unique (user_id, company_id)
);
create index if not exists idx_company_users_user on company_users(user_id);
create index if not exists idx_company_users_company on company_users(company_id);
create index if not exists idx_company_users_org on company_users(organization_id);

alter table company_users enable row level security;

drop policy if exists "company_users_self_read" on company_users;
create policy "company_users_self_read" on company_users for select using (
  user_id = auth.uid()
  or exists(select 1 from organization_members om where om.user_id = auth.uid() and om.organization_id = company_users.organization_id and om.role in ('owner','admin','manager'))
  or public.is_current_user_super_admin()
);

drop policy if exists "company_users_admin_manage" on company_users;
create policy "company_users_admin_manage" on company_users for all using (
  public.is_current_user_super_admin()
  or exists(select 1 from organization_members om where om.user_id = auth.uid() and om.organization_id = company_users.organization_id and om.role in ('owner','admin','manager'))
) with check (
  public.is_current_user_super_admin()
  or exists(select 1 from organization_members om where om.user_id = auth.uid() and om.organization_id = company_users.organization_id and om.role in ('owner','admin','manager'))
);

-- Broadcast messages do super admin pra clientes
create table if not exists public.client_broadcasts (
  id uuid primary key default gen_random_uuid(),
  sender_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  audience text not null default 'all_clients' check (audience in ('all_clients','all_orgs','specific_company','specific_org')),
  target_company_id uuid references companies(id) on delete cascade,
  target_organization_id uuid references organizations(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists public.client_broadcast_reads (
  broadcast_id uuid not null references client_broadcasts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  read_at timestamptz default now(),
  primary key (broadcast_id, user_id)
);

alter table client_broadcasts enable row level security;
alter table client_broadcast_reads enable row level security;

drop policy if exists "broadcasts_super_admin" on client_broadcasts;
create policy "broadcasts_super_admin" on client_broadcasts for all using (public.is_current_user_super_admin()) with check (public.is_current_user_super_admin());

drop policy if exists "broadcasts_target_read" on client_broadcasts;
create policy "broadcasts_target_read" on client_broadcasts for select using (
  case audience
    when 'all_clients' then exists(select 1 from company_users cu where cu.user_id = auth.uid() and cu.active)
    when 'all_orgs' then exists(select 1 from organization_members om where om.user_id = auth.uid())
    when 'specific_company' then exists(select 1 from company_users cu where cu.user_id = auth.uid() and cu.company_id = client_broadcasts.target_company_id and cu.active)
    when 'specific_org' then exists(select 1 from organization_members om where om.user_id = auth.uid() and om.organization_id = client_broadcasts.target_organization_id)
    else false
  end
);

drop policy if exists "broadcast_reads_self" on client_broadcast_reads;
create policy "broadcast_reads_self" on client_broadcast_reads for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create or replace function public.portal_get_context(p_user uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_data jsonb;
begin
  select jsonb_build_object(
    'company', to_jsonb(c.*),
    'organization', to_jsonb(o.*),
    'role', cu.role,
    'profile', (select to_jsonb(p.*) from profiles p where p.id = p_user)
  ) into v_data
  from company_users cu
  join companies c on c.id = cu.company_id
  join organizations o on o.id = cu.organization_id
  where cu.user_id = p_user and cu.active
  limit 1;
  return v_data;
end; $$;
grant execute on function public.portal_get_context(uuid) to authenticated;

create or replace function public.portal_invite_user(p_email text, p_company_id uuid, p_org uuid, p_role text default 'member')
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_user uuid; v_existing uuid;
begin
  if not exists(select 1 from organization_members om where om.user_id = auth.uid() and om.organization_id = p_org and om.role in ('owner','admin','manager')) and not public.is_current_user_super_admin() then
    raise exception 'forbidden';
  end if;
  select id into v_user from auth.users where lower(email) = lower(p_email) limit 1;
  if v_user is null then
    return jsonb_build_object('status','user_not_found','message','Peça pro cliente criar conta primeiro em /portal-login, depois reenvie o convite.');
  end if;
  select id into v_existing from company_users where user_id = v_user and company_id = p_company_id;
  if v_existing is not null then
    update company_users set active = true, role = p_role where id = v_existing;
    return jsonb_build_object('status','reactivated','company_user_id', v_existing);
  end if;
  insert into company_users (user_id, company_id, organization_id, role, invited_by, accepted_at)
  values (v_user, p_company_id, p_org, p_role, auth.uid(), now())
  returning id into v_existing;
  return jsonb_build_object('status','invited','company_user_id', v_existing);
end; $$;
grant execute on function public.portal_invite_user(text, uuid, uuid, text) to authenticated;

create or replace function public.portal_list_broadcasts(p_user uuid)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', b.id, 'title', b.title, 'body', b.body, 'audience', b.audience,
    'created_at', b.created_at, 'sender', (select email from auth.users where id = b.sender_user_id),
    'read_at', (select read_at from client_broadcast_reads r where r.broadcast_id = b.id and r.user_id = p_user)
  ) order by b.created_at desc), '[]'::jsonb)
  from client_broadcasts b
  where (
    case b.audience
      when 'all_clients' then exists(select 1 from company_users cu where cu.user_id = p_user and cu.active)
      when 'specific_company' then exists(select 1 from company_users cu where cu.user_id = p_user and cu.company_id = b.target_company_id and cu.active)
      else false
    end
  );
$$;
grant execute on function public.portal_list_broadcasts(uuid) to authenticated;

create or replace function public.portal_mark_broadcast_read(p_broadcast uuid, p_user uuid)
returns void language sql security definer set search_path=public as $$
  insert into client_broadcast_reads (broadcast_id, user_id) values (p_broadcast, p_user)
  on conflict (broadcast_id, user_id) do nothing;
$$;
grant execute on function public.portal_mark_broadcast_read(uuid, uuid) to authenticated;

create or replace function public.sa_list_all_clients()
returns jsonb language plpgsql security definer set search_path=public as $$
declare v jsonb;
begin
  if not public.is_current_user_super_admin() then raise exception 'forbidden'; end if;
  select coalesce(jsonb_agg(jsonb_build_object(
    'company', to_jsonb(c.*),
    'organization_name', o.name,
    'users_count', (select count(*) from company_users cu where cu.company_id = c.id and cu.active),
    'tickets_count', (select count(*) from support_tickets t where t.company_id = c.id)
  ) order by c.created_at desc), '[]'::jsonb) into v
  from companies c join organizations o on o.id = c.organization_id;
  return v;
end; $$;
grant execute on function public.sa_list_all_clients() to authenticated;

create or replace function public.sa_send_broadcast(p_title text, p_body text, p_audience text, p_target_company uuid default null, p_target_org uuid default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  if not public.is_current_user_super_admin() then raise exception 'forbidden'; end if;
  insert into client_broadcasts (sender_user_id, title, body, audience, target_company_id, target_organization_id)
  values (auth.uid(), p_title, p_body, p_audience, p_target_company, p_target_org)
  returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.sa_send_broadcast(text, text, text, uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
