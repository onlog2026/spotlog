create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  owner_user_id uuid references auth.users(id) on delete set null,
  lead_id uuid references leads(id) on delete set null,
  contact_id uuid references contacts(id) on delete set null,
  company_id uuid references companies(id) on delete set null,
  external_name text,
  external_email text,
  external_phone text,
  title text not null,
  description text,
  scheduled_at timestamptz not null,
  duration_minutes int default 30,
  meeting_type text default 'video' check (meeting_type in ('video','phone','presencial','other')),
  meeting_url text,
  meeting_location text,
  status text not null default 'agendado' check (status in ('agendado','confirmado','realizado','cancelado','no_show','reagendado')),
  reminder_sent_at timestamptz,
  source text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id) on delete set null
);
create index if not exists idx_appointments_org on appointments(organization_id);
create index if not exists idx_appointments_owner on appointments(owner_user_id, scheduled_at);
create index if not exists idx_appointments_scheduled on appointments(scheduled_at);
create index if not exists idx_appointments_lead on appointments(lead_id);

create table if not exists public.user_availability (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  weekday int not null check (weekday between 0 and 6),
  time_start time not null,
  time_end time not null,
  slot_minutes int default 30,
  buffer_minutes int default 10,
  active boolean default true,
  created_at timestamptz default now(),
  unique (user_id, organization_id, weekday, time_start)
);
create index if not exists idx_avail_user on user_availability(user_id, weekday);

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  block_start timestamptz not null,
  block_end timestamptz not null,
  reason text,
  created_at timestamptz default now()
);
create index if not exists idx_blocks_user_time on availability_blocks(user_id, block_start, block_end);

alter table appointments enable row level security;
alter table user_availability enable row level security;
alter table availability_blocks enable row level security;

drop policy if exists "appointments_org" on appointments;
create policy "appointments_org" on appointments for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "appointments_public_insert" on appointments;
create policy "appointments_public_insert" on appointments for insert to anon
  with check (true);

drop policy if exists "availability_org" on user_availability;
create policy "availability_org" on user_availability for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "availability_public_select" on user_availability;
create policy "availability_public_select" on user_availability for select to anon
  using (active = true);

drop policy if exists "blocks_org" on availability_blocks;
create policy "blocks_org" on availability_blocks for all
  using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

create or replace function public.list_available_slots(
  p_user uuid,
  p_org uuid,
  p_date date,
  p_tz text default 'America/Sao_Paulo'
)
returns jsonb language plpgsql stable security definer set search_path=public as $$
declare
  v_wd int;
  v_avail record;
  v_slot_start timestamptz;
  v_slot_end timestamptz;
  v_results jsonb := '[]'::jsonb;
begin
  v_wd := extract(dow from p_date)::int;
  for v_avail in
    select * from user_availability
    where user_id = p_user and organization_id = p_org and weekday = v_wd and active = true
  loop
    v_slot_start := (p_date::timestamptz at time zone p_tz) + (v_avail.time_start::interval);
    while v_slot_start + (v_avail.slot_minutes || ' minutes')::interval <= (p_date::timestamptz at time zone p_tz) + (v_avail.time_end::interval) loop
      v_slot_end := v_slot_start + (v_avail.slot_minutes || ' minutes')::interval;
      if not exists(
        select 1 from appointments a
        where a.owner_user_id = p_user
          and a.organization_id = p_org
          and a.status in ('agendado','confirmado','reagendado')
          and (a.scheduled_at, a.scheduled_at + (a.duration_minutes || ' minutes')::interval) overlaps (v_slot_start, v_slot_end)
      ) and not exists(
        select 1 from availability_blocks b
        where b.user_id = p_user and b.organization_id = p_org
          and (b.block_start, b.block_end) overlaps (v_slot_start, v_slot_end)
      ) then
        v_results := v_results || jsonb_build_object(
          'start', to_char(v_slot_start at time zone p_tz, 'YYYY-MM-DD HH24:MI'),
          'end', to_char(v_slot_end at time zone p_tz, 'YYYY-MM-DD HH24:MI'),
          'iso_start', v_slot_start,
          'iso_end', v_slot_end,
          'duration', v_avail.slot_minutes
        );
      end if;
      v_slot_start := v_slot_end + (v_avail.buffer_minutes || ' minutes')::interval;
    end loop;
  end loop;
  return v_results;
end; $$;
grant execute on function public.list_available_slots(uuid, uuid, date, text) to anon, authenticated;

create or replace function public.create_appointment(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into appointments (
    organization_id, owner_user_id, lead_id, contact_id, company_id,
    external_name, external_email, external_phone,
    title, description, scheduled_at, duration_minutes,
    meeting_type, meeting_url, meeting_location, source, notes, created_by
  ) values (
    (p_payload->>'organization_id')::uuid,
    nullif(p_payload->>'owner_user_id','')::uuid,
    nullif(p_payload->>'lead_id','')::uuid,
    nullif(p_payload->>'contact_id','')::uuid,
    nullif(p_payload->>'company_id','')::uuid,
    p_payload->>'external_name',
    p_payload->>'external_email',
    p_payload->>'external_phone',
    p_payload->>'title',
    p_payload->>'description',
    (p_payload->>'scheduled_at')::timestamptz,
    coalesce((p_payload->>'duration_minutes')::int, 30),
    coalesce(p_payload->>'meeting_type','video'),
    p_payload->>'meeting_url',
    p_payload->>'meeting_location',
    p_payload->>'source',
    p_payload->>'notes',
    auth.uid()
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.create_appointment(jsonb) to anon, authenticated;

create or replace function public.list_my_appointments(p_org uuid, p_user uuid, p_from date default current_date, p_to date default (current_date + interval '60 days')::date)
returns jsonb language sql stable security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(a.*) order by a.scheduled_at asc), '[]'::jsonb)
  from appointments a
  where a.organization_id = p_org
    and a.owner_user_id = p_user
    and a.scheduled_at::date between p_from and p_to;
$$;
grant execute on function public.list_my_appointments(uuid, uuid, date, date) to authenticated;
