-- ============================================================
-- Marketing Relacionar + Analisar
-- Tabelas + RPCs (contornam cache stale do PostgREST)
-- ============================================================

create table if not exists public.lead_segments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  filters_json jsonb not null default '{}'::jsonb,
  is_dynamic boolean default true,
  member_count int default 0,
  last_computed_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.email_validations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  email text not null,
  status text not null check (status in ('valid','invalid','risky','disposable','unknown')),
  reason text,
  validated_at timestamptz default now()
);
create index if not exists idx_email_val_org on email_validations(organization_id, validated_at desc);
create index if not exists idx_email_val_email on email_validations(lower(email));

create table if not exists public.sms_campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  message text not null,
  segment_id uuid references lead_segments(id) on delete set null,
  scheduled_for timestamptz,
  sent_at timestamptz,
  status text default 'rascunho' check (status in ('rascunho','agendada','enviando','enviada','falhou')),
  total_count int default 0,
  sent_count int default 0,
  failed_count int default 0,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

create table if not exists public.sms_logs (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references sms_campaigns(id) on delete cascade,
  phone text not null,
  status text check (status in ('sent','delivered','failed')),
  error text,
  sent_at timestamptz default now()
);

create table if not exists public.smart_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid not null references leads(id) on delete cascade,
  signal text not null,
  score int default 0,
  payload jsonb default '{}'::jsonb,
  acknowledged boolean default false,
  detected_at timestamptz default now()
);
create unique index if not exists idx_smart_leads_unique on smart_leads(organization_id, lead_id, signal);

create table if not exists public.custom_dashboards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  description text,
  layout_json jsonb not null default '[]'::jsonb,
  is_default boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

create table if not exists public.saved_reports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name text not null,
  report_type text not null check (report_type in ('leads_by_source','deals_by_stage','revenue','conversion_funnel','tickets_by_dept','custom_sql')),
  filters_json jsonb default '{}'::jsonb,
  schedule text check (schedule in ('manual','daily','weekly','monthly')),
  recipients text[] default '{}',
  last_run_at timestamptz,
  created_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

alter table lead_segments enable row level security;
alter table email_validations enable row level security;
alter table sms_campaigns enable row level security;
alter table sms_logs enable row level security;
alter table smart_leads enable row level security;
alter table custom_dashboards enable row level security;
alter table saved_reports enable row level security;

do $$ declare t text;
begin
  for t in select unnest(array['lead_segments','email_validations','sms_campaigns','smart_leads','custom_dashboards','saved_reports']) loop
    execute format('drop policy if exists "%s_org" on public.%s', t, t);
    execute format('create policy "%s_org" on public.%s for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id))', t, t);
  end loop;
  drop policy if exists sms_logs_org on sms_logs;
  create policy sms_logs_org on sms_logs for all using (
    exists(select 1 from sms_campaigns c where c.id = campaign_id and public.is_org_member(c.organization_id))
  ) with check (
    exists(select 1 from sms_campaigns c where c.id = campaign_id and public.is_org_member(c.organization_id))
  );
end $$;

-- ============================================================ RPCs

create or replace function public.mkt_create_segment(p_payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  insert into lead_segments (organization_id, name, description, filters_json, is_dynamic, created_by)
  values (
    (p_payload->>'organization_id')::uuid, p_payload->>'name', p_payload->>'description',
    coalesce(p_payload->'filters_json','{}'::jsonb),
    coalesce((p_payload->>'is_dynamic')::boolean, true),
    auth.uid()
  ) returning id into v; return v;
end; $$;
grant execute on function public.mkt_create_segment(jsonb) to authenticated;

create or replace function public.mkt_list_segments(p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(s.*) order by s.created_at desc), '[]'::jsonb)
  from lead_segments s where s.organization_id = p_org;
$$;
grant execute on function public.mkt_list_segments(uuid) to authenticated;

create or replace function public.mkt_compute_segment(p_segment_id uuid, p_org uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_filters jsonb; v_sources text[]; v_status text[]; v_score_min int; v_count int; v_sample jsonb;
begin
  select filters_json into v_filters from lead_segments where id = p_segment_id and organization_id = p_org;
  if v_filters is null then return null; end if;
  v_sources := case when v_filters->'source' is not null then (select array_agg(value) from jsonb_array_elements_text(v_filters->'source')) else null end;
  v_status := case when v_filters->'status' is not null then (select array_agg(value) from jsonb_array_elements_text(v_filters->'status')) else null end;
  v_score_min := nullif(v_filters->>'score_min','')::int;

  select count(*) into v_count from leads l
  where l.organization_id = p_org
    and (v_sources is null or l.source = any(v_sources))
    and (v_status is null or l.status::text = any(v_status))
    and (v_score_min is null or coalesce(l.score,0) >= v_score_min);

  select coalesce(jsonb_agg(jsonb_build_object('id',l.id,'full_name',l.full_name,'email',l.email,'score',l.score) order by l.created_at desc), '[]'::jsonb)
    into v_sample from (
      select * from leads l
      where l.organization_id = p_org
        and (v_sources is null or l.source = any(v_sources))
        and (v_status is null or l.status::text = any(v_status))
        and (v_score_min is null or coalesce(l.score,0) >= v_score_min)
      order by l.created_at desc limit 50
    ) l;

  update lead_segments set member_count = v_count, last_computed_at = now() where id = p_segment_id;
  return jsonb_build_object('count', v_count, 'sample', v_sample);
end; $$;
grant execute on function public.mkt_compute_segment(uuid, uuid) to authenticated;

create or replace function public.mkt_log_email_validation(p_payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  insert into email_validations (organization_id, email, status, reason)
  values (
    (p_payload->>'organization_id')::uuid, lower(p_payload->>'email'),
    coalesce(p_payload->>'status','unknown'), p_payload->>'reason'
  ) returning id into v; return v;
end; $$;
grant execute on function public.mkt_log_email_validation(jsonb) to authenticated;

create or replace function public.mkt_create_sms_campaign(p_payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  insert into sms_campaigns (organization_id, name, message, segment_id, scheduled_for, status, created_by)
  values (
    (p_payload->>'organization_id')::uuid, p_payload->>'name', p_payload->>'message',
    nullif(p_payload->>'segment_id','')::uuid, nullif(p_payload->>'scheduled_for','')::timestamptz,
    coalesce(p_payload->>'status','rascunho'), auth.uid()
  ) returning id into v; return v;
end; $$;
grant execute on function public.mkt_create_sms_campaign(jsonb) to authenticated;

create or replace function public.mkt_list_sms(p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(c.*) order by c.created_at desc),'[]'::jsonb)
  from sms_campaigns c where c.organization_id = p_org;
$$;
grant execute on function public.mkt_list_sms(uuid) to authenticated;

create or replace function public.mkt_analytics_funnel(p_org uuid, p_days int default 30)
returns jsonb language sql security definer set search_path=public as $$
  select jsonb_build_object(
    'visitors', 0,
    'leads', (select count(*) from leads where organization_id = p_org and created_at > now() - (p_days || ' days')::interval),
    'qualified', (select count(*) from leads where organization_id = p_org and created_at > now() - (p_days || ' days')::interval and coalesce(score,0) >= 60),
    'opportunities', (select count(*) from deals where organization_id = p_org and created_at > now() - (p_days || ' days')::interval and status not in ('won','lost')),
    'won', (select count(*) from deals where organization_id = p_org and created_at > now() - (p_days || ' days')::interval and status = 'won')
  );
$$;
grant execute on function public.mkt_analytics_funnel(uuid, int) to authenticated;

create or replace function public.mkt_analytics_by_source(p_org uuid, p_days int default 30)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'source', coalesce(source,'(direto)'),
    'count', cnt,
    'converted', conv
  ) order by cnt desc), '[]'::jsonb)
  from (
    select source, count(*) as cnt, count(*) filter (where converted_at is not null) as conv
    from leads
    where organization_id = p_org and created_at > now() - (p_days || ' days')::interval
    group by source
  ) x;
$$;
grant execute on function public.mkt_analytics_by_source(uuid, int) to authenticated;

create or replace function public.mkt_analytics_revenue(p_org uuid, p_months int default 6)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'month', to_char(month, 'YYYY-MM'),
    'revenue', total,
    'won_deals', cnt
  ) order by month), '[]'::jsonb)
  from (
    select date_trunc('month', closed_at) as month,
           sum(amount) as total,
           count(*) as cnt
    from deals
    where organization_id = p_org
      and status = 'won'
      and closed_at > now() - (p_months || ' months')::interval
    group by 1
  ) x;
$$;
grant execute on function public.mkt_analytics_revenue(uuid, int) to authenticated;

create or replace function public.mkt_save_dashboard(p_payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v uuid;
begin
  insert into custom_dashboards (organization_id, name, description, layout_json, is_default, created_by)
  values (
    (p_payload->>'organization_id')::uuid, p_payload->>'name', p_payload->>'description',
    coalesce(p_payload->'layout_json','[]'::jsonb),
    coalesce((p_payload->>'is_default')::boolean, false), auth.uid()
  ) returning id into v; return v;
end; $$;
grant execute on function public.mkt_save_dashboard(jsonb) to authenticated;

create or replace function public.mkt_list_dashboards(p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(d.*) order by d.created_at desc),'[]'::jsonb)
  from custom_dashboards d where d.organization_id = p_org;
$$;
grant execute on function public.mkt_list_dashboards(uuid) to authenticated;

create or replace function public.mkt_save_report(p_payload jsonb) returns uuid
language plpgsql security definer set search_path=public as $$
declare v uuid; v_recipients text[];
begin
  v_recipients := case when p_payload->'recipients' is not null
    then (select array_agg(value) from jsonb_array_elements_text(p_payload->'recipients'))
    else '{}'::text[] end;
  insert into saved_reports (organization_id, name, report_type, filters_json, schedule, recipients, created_by)
  values (
    (p_payload->>'organization_id')::uuid, p_payload->>'name', p_payload->>'report_type',
    coalesce(p_payload->'filters_json','{}'::jsonb),
    coalesce(p_payload->>'schedule','manual'),
    v_recipients, auth.uid()
  ) returning id into v; return v;
end; $$;
grant execute on function public.mkt_save_report(jsonb) to authenticated;

create or replace function public.mkt_list_reports(p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(r.*) order by r.created_at desc),'[]'::jsonb)
  from saved_reports r where r.organization_id = p_org;
$$;
grant execute on function public.mkt_list_reports(uuid) to authenticated;

create or replace function public.mkt_list_smart_leads(p_org uuid) returns jsonb
language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(jsonb_build_object(
    'id', s.id, 'lead_id', s.lead_id, 'signal', s.signal, 'score', s.score,
    'payload', s.payload, 'acknowledged', s.acknowledged, 'detected_at', s.detected_at,
    'lead_name', l.full_name, 'lead_email', l.email
  ) order by s.detected_at desc), '[]'::jsonb)
  from smart_leads s
  left join leads l on l.id = s.lead_id
  where s.organization_id = p_org;
$$;
grant execute on function public.mkt_list_smart_leads(uuid) to authenticated;

create or replace function public.mkt_detect_smart_leads(p_org uuid) returns int
language plpgsql security definer set search_path=public as $$
declare v_inserted int := 0;
begin
  insert into smart_leads (organization_id, lead_id, signal, score, payload)
  select p_org, l.id, 'high_score', l.score, jsonb_build_object('threshold', 70)
  from leads l
  where l.organization_id = p_org
    and coalesce(l.score,0) >= 70
    and not exists (select 1 from smart_leads s where s.lead_id = l.id and s.signal = 'high_score' and s.organization_id = p_org)
  on conflict do nothing;
  get diagnostics v_inserted = row_count;

  insert into smart_leads (organization_id, lead_id, signal, score, payload)
  select p_org, l.id, 'recent_with_utm', coalesce(l.score,30),
         jsonb_build_object('utm_source', l.utm_source, 'utm_campaign', l.utm_campaign)
  from leads l
  where l.organization_id = p_org
    and l.created_at > now() - interval '7 days'
    and l.utm_source is not null
    and not exists (select 1 from smart_leads s where s.lead_id = l.id and s.signal = 'recent_with_utm' and s.organization_id = p_org)
  on conflict do nothing;

  return v_inserted;
end; $$;
grant execute on function public.mkt_detect_smart_leads(uuid) to authenticated;

create or replace function public.mkt_ack_smart_lead(p_id uuid, p_org uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin
  update smart_leads set acknowledged = true
  where id = p_id and organization_id = p_org;
  return found;
end; $$;
grant execute on function public.mkt_ack_smart_lead(uuid, uuid) to authenticated;

create or replace function public.mkt_delete_segment(p_id uuid, p_org uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin delete from lead_segments where id = p_id and organization_id = p_org; return found; end; $$;
grant execute on function public.mkt_delete_segment(uuid, uuid) to authenticated;

create or replace function public.mkt_delete_dashboard(p_id uuid, p_org uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin delete from custom_dashboards where id = p_id and organization_id = p_org; return found; end; $$;
grant execute on function public.mkt_delete_dashboard(uuid, uuid) to authenticated;

create or replace function public.mkt_delete_report(p_id uuid, p_org uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin delete from saved_reports where id = p_id and organization_id = p_org; return found; end; $$;
grant execute on function public.mkt_delete_report(uuid, uuid) to authenticated;

create or replace function public.mkt_delete_sms(p_id uuid, p_org uuid) returns boolean
language plpgsql security definer set search_path=public as $$
begin delete from sms_campaigns where id = p_id and organization_id = p_org; return found; end; $$;
grant execute on function public.mkt_delete_sms(uuid, uuid) to authenticated;

notify pgrst, 'reload schema';
