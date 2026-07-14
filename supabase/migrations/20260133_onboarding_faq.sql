-- Onboarding FAQ table + RPC + seed
create table if not exists public.faq_entries (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references organizations(id) on delete cascade,
  category text not null default 'geral' check (category in (
    'geral','crm','leads','pipeline','marketing','operacao','cliente','sac',
    'cms','compliance','integracoes','api','contas','agenda','outro'
  )),
  question text not null,
  answer text not null,
  keywords text[] default '{}',
  views int default 0,
  helpful_count int default 0,
  unhelpful_count int default 0,
  sort int default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create index if not exists idx_faq_category on faq_entries(category, sort);
create index if not exists idx_faq_active on faq_entries(active) where active = true;

alter table faq_entries enable row level security;

drop policy if exists "faq_public_read" on faq_entries;
create policy "faq_public_read" on faq_entries for select to anon, authenticated using (active = true);

drop policy if exists "faq_admin_write" on faq_entries;
create policy "faq_admin_write" on faq_entries for all using (
  organization_id is null
  or exists(select 1 from organization_members om where om.user_id = auth.uid() and om.organization_id = faq_entries.organization_id and om.role in ('owner','admin','manager'))
) with check (
  organization_id is null
  or exists(select 1 from organization_members om where om.user_id = auth.uid() and om.organization_id = faq_entries.organization_id and om.role in ('owner','admin','manager'))
);

create or replace function public.vote_faq(p_id uuid, p_helpful boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
  if p_helpful then
    update faq_entries set helpful_count = helpful_count + 1 where id = p_id;
  else
    update faq_entries set unhelpful_count = unhelpful_count + 1 where id = p_id;
  end if;
end; $$;
grant execute on function public.vote_faq(uuid, boolean) to anon, authenticated;
