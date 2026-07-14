-- ═══════════════════════════════════════════════════════════════════════════
-- CÉREBRO COMERCIAL — tabela de aprendizado (desfechos de prospecção)
-- Cole isto no SQL editor do Supabase:
--   https://supabase.com/dashboard/project/lfvuwrpfdnyqfxjaicba/sql/new
-- É a ÚNICA tabela nova do épico GTM. Sem ela o sistema roda igual —
-- só não aprende taxas por canal/horário. Com ela, o painel "Cérebro
-- Comercial" (/app/sdr) passa a mostrar conversão e recomendações.
-- ═══════════════════════════════════════════════════════════════════════════

create table if not exists public.gtm_outcomes (
  id             uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  stage          text not null check (stage in ('sent','reply','meeting')),
  channel        text not null default 'whatsapp',
  campaign_id    uuid,
  lead_id        uuid,
  hour_sp        int,
  created_at     timestamptz not null default now()
);

create index if not exists gtm_outcomes_org_idx     on public.gtm_outcomes (organization_id);
create index if not exists gtm_outcomes_org_stage_idx on public.gtm_outcomes (organization_id, stage);

alter table public.gtm_outcomes enable row level security;

-- Leitura só da própria organização (o backend usa service_role e ignora RLS).
drop policy if exists gtm_outcomes_read_own on public.gtm_outcomes;
create policy gtm_outcomes_read_own on public.gtm_outcomes
  for select using (
    organization_id in (
      select organization_id from public.organization_members
      where user_id = auth.uid()
    )
  );
