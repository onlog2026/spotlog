-- Notification badges system
-- Tracks per-user "last seen" timestamp per module so the sidebar can show
-- a red badge with the count of unseen items.

create table if not exists public.notification_seen (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  module text not null,
  last_seen_at timestamptz not null default now(),
  unique(user_id, module)
);

alter table public.notification_seen enable row level security;

drop policy if exists "ns_self" on public.notification_seen;
create policy "ns_self" on public.notification_seen
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create or replace function public.count_new_items(p_user uuid, p_org uuid)
returns table(module text, new_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  with seen as (
    select module, last_seen_at from public.notification_seen where user_id = p_user
  )
  select 'leads'::text as module, count(*)::bigint as new_count
    from public.leads l
    left join seen s on s.module = 'leads'
    where l.organization_id = p_org
      and l.created_at > coalesce(s.last_seen_at, '1970-01-01'::timestamptz)
  union all
  select 'deals'::text, count(*)::bigint
    from public.deals d
    left join seen s on s.module = 'deals'
    where d.organization_id = p_org
      and d.created_at > coalesce(s.last_seen_at, '1970-01-01'::timestamptz)
  union all
  select 'tickets_sac'::text, count(*)::bigint
    from public.support_tickets t
    left join seen s on s.module = 'tickets_sac'
    where t.organization_id = p_org
      and coalesce(t.department, 'sac') = 'sac'
      and coalesce(t.opened_at, t.created_at) > coalesce(s.last_seen_at, '1970-01-01'::timestamptz)
  union all
  select 'tickets_comercial'::text, count(*)::bigint
    from public.support_tickets t
    left join seen s on s.module = 'tickets_comercial'
    where t.organization_id = p_org
      and t.department = 'comercial'
      and coalesce(t.opened_at, t.created_at) > coalesce(s.last_seen_at, '1970-01-01'::timestamptz)
  union all
  select 'tickets_financeiro'::text, count(*)::bigint
    from public.support_tickets t
    left join seen s on s.module = 'tickets_financeiro'
    where t.organization_id = p_org
      and t.department = 'financeiro'
      and coalesce(t.opened_at, t.created_at) > coalesce(s.last_seen_at, '1970-01-01'::timestamptz)
  union all
  select 'chatbot_unanswered'::text, count(*)::bigint
    from public.chatbot_unanswered c
    left join seen s on s.module = 'chatbot_unanswered'
    where (c.organization_id = p_org or c.organization_id is null)
      and c.resolved = false
      and c.created_at > coalesce(s.last_seen_at, '1970-01-01'::timestamptz);
$$;

grant execute on function public.count_new_items(uuid, uuid) to authenticated;

create or replace function public.mark_module_seen(p_module text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notification_seen (user_id, module, last_seen_at)
  values (auth.uid(), p_module, now())
  on conflict (user_id, module) do update set last_seen_at = excluded.last_seen_at;
$$;

grant execute on function public.mark_module_seen(text) to authenticated;
