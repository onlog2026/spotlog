-- =====================================================================
-- Migration: super admin global do Spotlog
-- =====================================================================
-- Adiciona flag is_super_admin em profiles + RPC helper.
-- Marca onlogjf@gmail.com como super admin inicial.
-- =====================================================================

-- 1) Coluna is_super_admin
alter table public.profiles
  add column if not exists is_super_admin boolean not null default false;

create index if not exists idx_profiles_is_super_admin
  on public.profiles(is_super_admin)
  where is_super_admin = true;

-- 2) RPC: is_current_user_super_admin()
create or replace function public.is_current_user_super_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select coalesce(
    (select is_super_admin from public.profiles where id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_current_user_super_admin() to authenticated;

-- 3) Marca onlogjf@gmail.com como super admin
-- Tenta via profiles.email primeiro
update public.profiles
   set is_super_admin = true
 where email = 'onlogjf@gmail.com';

-- Fallback: pega o id via auth.users (caso profile.email esteja vazio)
update public.profiles p
   set is_super_admin = true
  from auth.users u
 where u.id = p.id
   and u.email = 'onlogjf@gmail.com'
   and p.is_super_admin = false;

-- 4) Política RLS: super admin enxerga todas as profiles
drop policy if exists "profiles_select_super_admin" on public.profiles;
create policy "profiles_select_super_admin" on public.profiles
  for select using (public.is_current_user_super_admin());

-- =====================================================================
-- FIM
-- =====================================================================
