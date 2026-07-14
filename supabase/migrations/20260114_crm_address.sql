-- Adiciona endereço completo em companies
alter table public.companies
  add column if not exists cep text,
  add column if not exists street text,
  add column if not exists number text,
  add column if not exists complement text,
  add column if not exists neighborhood text,
  add column if not exists notes text;

alter table public.contacts
  add column if not exists cep text,
  add column if not exists street text,
  add column if not exists number text,
  add column if not exists complement text,
  add column if not exists neighborhood text;

create index if not exists idx_companies_city on public.companies(state, city);
create index if not exists idx_contacts_email_lower on public.contacts(lower(email));
create index if not exists idx_companies_cnpj on public.companies(cnpj);

notify pgrst, 'reload schema';
