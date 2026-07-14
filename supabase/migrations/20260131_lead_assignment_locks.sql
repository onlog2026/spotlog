-- Lead assignment + locks + conversion celebration
-- Histórico de assignment (auditoria)
create table if not exists public.lead_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  assigned_to uuid references auth.users(id) on delete set null,
  assigned_by uuid references auth.users(id) on delete set null,
  previous_assigned_to uuid references auth.users(id) on delete set null,
  reason text,
  assigned_at timestamptz default now()
);
create index if not exists idx_lead_assignments_lead on lead_assignments(lead_id, assigned_at desc);

-- "Lock" leve — quando alguém está visualizando/trabalhando no lead AGORA
create table if not exists public.lead_locks (
  lead_id uuid primary key references leads(id) on delete cascade,
  locked_by uuid not null references auth.users(id) on delete cascade,
  locked_at timestamptz default now(),
  expires_at timestamptz not null default (now() + interval '5 minutes')
);

alter table lead_assignments enable row level security;
alter table lead_locks enable row level security;

drop policy if exists "lead_assignments_org" on lead_assignments;
create policy "lead_assignments_org" on lead_assignments for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "lead_locks_select" on lead_locks;
create policy "lead_locks_select" on lead_locks for select using (
  exists(select 1 from leads l where l.id = lead_id and public.is_org_member(l.organization_id))
);

drop policy if exists "lead_locks_insert" on lead_locks;
create policy "lead_locks_insert" on lead_locks for insert with check (
  exists(select 1 from leads l where l.id = lead_id and public.is_org_member(l.organization_id))
);

drop policy if exists "lead_locks_update" on lead_locks;
create policy "lead_locks_update" on lead_locks for update using (locked_by = auth.uid()) with check (locked_by = auth.uid());

drop policy if exists "lead_locks_delete_own" on lead_locks;
create policy "lead_locks_delete_own" on lead_locks for delete using (locked_by = auth.uid());

-- RPC: claimar lead (atribui + cria lock + audit)
create or replace function public.claim_lead(p_lead_id uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare
  v_org uuid;
  v_current uuid;
  v_uid uuid := auth.uid();
begin
  select organization_id, assigned_to into v_org, v_current
  from leads where id = p_lead_id;
  if v_org is null then raise exception 'lead not found'; end if;
  if not public.is_org_member(v_org) then raise exception 'forbidden'; end if;

  if v_current = v_uid then
    insert into lead_locks (lead_id, locked_by) values (p_lead_id, v_uid)
    on conflict (lead_id) do update set locked_by = excluded.locked_by, locked_at = now(), expires_at = now() + interval '5 minutes';
    return jsonb_build_object('ok', true, 'status', 'already_yours');
  end if;
  if v_current is not null then
    return jsonb_build_object(
      'ok', false, 'status', 'taken',
      'current_user', v_current
    );
  end if;

  update leads set assigned_to = v_uid where id = p_lead_id;
  insert into lead_assignments (organization_id, lead_id, assigned_to, assigned_by, previous_assigned_to, reason)
  values (v_org, p_lead_id, v_uid, v_uid, v_current, 'self-claim');
  insert into lead_locks (lead_id, locked_by) values (p_lead_id, v_uid)
  on conflict (lead_id) do update set locked_by = excluded.locked_by, locked_at = now(), expires_at = now() + interval '5 minutes';

  return jsonb_build_object('ok', true, 'status', 'claimed');
end; $$;
grant execute on function public.claim_lead(uuid) to authenticated;

create or replace function public.reassign_lead(p_lead_id uuid, p_to_user uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid; v_prev uuid;
begin
  select organization_id, assigned_to into v_org, v_prev from leads where id = p_lead_id;
  if v_org is null then raise exception 'lead not found'; end if;
  if not public.is_org_member(v_org) then raise exception 'forbidden'; end if;

  update leads set assigned_to = p_to_user where id = p_lead_id;
  insert into lead_assignments (organization_id, lead_id, assigned_to, assigned_by, previous_assigned_to, reason)
  values (v_org, p_lead_id, p_to_user, auth.uid(), v_prev, 'reassign');
  delete from lead_locks where lead_id = p_lead_id;
end; $$;
grant execute on function public.reassign_lead(uuid, uuid) to authenticated;

create or replace function public.refresh_lead_lock(p_lead_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_org uuid;
begin
  select organization_id into v_org from leads where id = p_lead_id;
  if v_org is null then return; end if;
  if not public.is_org_member(v_org) then return; end if;
  insert into lead_locks (lead_id, locked_by) values (p_lead_id, auth.uid())
  on conflict (lead_id) do update
    set locked_at = now(), expires_at = now() + interval '5 minutes'
    where lead_locks.locked_by = auth.uid();
end; $$;
grant execute on function public.refresh_lead_lock(uuid) to authenticated;

create or replace function public.release_lead_lock(p_lead_id uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
  delete from lead_locks where lead_id = p_lead_id and locked_by = auth.uid();
end; $$;
grant execute on function public.release_lead_lock(uuid) to authenticated;

create or replace function public.get_lead_lock(p_lead_id uuid)
returns table(locked_by uuid, locked_at timestamptz, expires_at timestamptz, full_name text, avatar_url text)
language plpgsql security definer set search_path=public as $$
declare v_org uuid;
begin
  select organization_id into v_org from leads where id = p_lead_id;
  if v_org is null then return; end if;
  if not public.is_org_member(v_org) then return; end if;
  return query
    select ll.locked_by, ll.locked_at, ll.expires_at, p.full_name, p.avatar_url
    from lead_locks ll
    left join profiles p on p.id = ll.locked_by
    where ll.lead_id = p_lead_id and ll.expires_at > now();
end; $$;
grant execute on function public.get_lead_lock(uuid) to authenticated;

create or replace function public.convert_lead(p_lead_id uuid, p_deal_id uuid default null)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_lead jsonb; v_org uuid; v_owner uuid;
begin
  select to_jsonb(l.*), l.organization_id, l.assigned_to into v_lead, v_org, v_owner
  from leads l where l.id = p_lead_id;
  if v_lead is null then raise exception 'lead not found'; end if;
  if not public.is_org_member(v_org) then raise exception 'forbidden'; end if;

  update leads set status = 'converted', converted_at = now(), converted_deal_id = coalesce(p_deal_id, converted_deal_id) where id = p_lead_id;

  insert into notifications (organization_id, user_id, kind, title, body, link)
  select v_org, om.user_id, 'lead_converted',
    '🎉 Lead convertido!',
    coalesce(v_lead->>'full_name', v_lead->>'email', 'Lead') || ' virou cliente!',
    '/app/leads/' || p_lead_id
  from organization_members om
  where om.organization_id = v_org and om.role in ('owner','admin','manager');

  return jsonb_build_object('ok', true, 'lead', v_lead, 'owner_id', v_owner);
end; $$;
grant execute on function public.convert_lead(uuid, uuid) to authenticated;
