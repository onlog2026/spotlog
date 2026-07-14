-- 1) Bucket público "cms" para uploads do CMS
insert into storage.buckets (id, name, public)
values ('cms', 'cms', true)
on conflict (id) do nothing;

drop policy if exists "cms_public_read" on storage.objects;
drop policy if exists "cms_authenticated_upload" on storage.objects;
drop policy if exists "cms_authenticated_update" on storage.objects;
drop policy if exists "cms_authenticated_delete" on storage.objects;

create policy "cms_public_read" on storage.objects
  for select using (bucket_id = 'cms');

create policy "cms_authenticated_upload" on storage.objects
  for insert with check (bucket_id = 'cms' and auth.role() = 'authenticated');

create policy "cms_authenticated_update" on storage.objects
  for update using (bucket_id = 'cms' and auth.role() = 'authenticated');

create policy "cms_authenticated_delete" on storage.objects
  for delete using (bucket_id = 'cms' and auth.role() = 'authenticated');

-- 2) Tabela site_cards (cards editáveis das páginas públicas)
create table if not exists public.site_cards (
  id uuid primary key default gen_random_uuid(),
  page text not null,
  section text not null,
  slot text not null,
  title text,
  description text,
  image_url text,
  cta_label text,
  cta_url text,
  active boolean default true,
  sort int default 0,
  metadata jsonb default '{}'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz default now(),
  unique(page, section, slot)
);

create index if not exists site_cards_page_section_idx on public.site_cards(page, section, active);

alter table public.site_cards enable row level security;

drop policy if exists "site_cards_public_read" on public.site_cards;
drop policy if exists "site_cards_admin_all" on public.site_cards;

create policy "site_cards_public_read" on public.site_cards
  for select to anon, authenticated using (active = true);

create policy "site_cards_admin_all" on public.site_cards
  for all using (
    exists(
      select 1 from public.organization_members
      where user_id = auth.uid()
      and role in ('owner','admin','manager')
    )
  ) with check (
    exists(
      select 1 from public.organization_members
      where user_id = auth.uid()
      and role in ('owner','admin','manager')
    )
  );

create or replace function public.site_cards_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

drop trigger if exists site_cards_updated_at on public.site_cards;
create trigger site_cards_updated_at
  before update on public.site_cards
  for each row execute function public.site_cards_set_updated_at();

-- 3) Seed inicial
insert into public.site_cards (page, section, slot, title, description, image_url, cta_label, cta_url, sort) values
  ('home','solucoes','same-day','Same Day Delivery','Entrega no mesmo dia da compra com SLA monitorado em tempo real.','','Saber mais','/solucoes', 1),
  ('home','solucoes','moto-fixa','Moto Fixa','Motoboy dedicado para sua operação, com escala e suporte direto.','','Saber mais','/solucoes', 2),
  ('home','solucoes','ecommerce-express','E-commerce Express','Logística ágil para e-commerce, da coleta ao comprovante.','','Saber mais','/ecommerce', 3),
  ('home','solucoes','express-pharma','Express Pharma','Transporte farmacêutico com AFE Anvisa e controle de temperatura.','','Saber mais','/farma', 4),
  ('farma','garantias','farmaceutico','Farmacêutico Responsável','Profissional acompanhando o processo de ponta a ponta.','','','', 1),
  ('farma','garantias','temperatura','Controle de Temperatura','Termolábeis preservados com monitoramento contínuo.','','','', 2),
  ('farma','garantias','treinamento','Treinamento Contínuo','Equipe sempre capacitada para operações sensíveis.','','','', 3)
on conflict (page, section, slot) do nothing;
