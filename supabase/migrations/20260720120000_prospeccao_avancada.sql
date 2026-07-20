-- ============================================================
-- Prospecção Avançada — módulo add-on licenciável (Instagram + score
-- de qualificação antes da cadência + curva de aquecimento de número)
-- ------------------------------------------------------------
-- Segue o mesmo padrão da migration de entitlements (20260630120000):
-- aditivo, idempotente, NEUTRO por padrão (novo módulo nasce como add-on,
-- fora de plan_modules — só entra em vigor por org via org_modules quando
-- o Super Admin ligar manualmente, e só bloqueia de verdade depois que
-- entitlements_enforced também estiver ligado).
-- ============================================================

-- 1) Registro do módulo novo no catálogo (dual-fonte: precisa também entrar
--    em MANAGED_MODULE_KEYS em src/lib/entitlements.ts — feito à parte).
insert into public.modules (key, label, module_group, is_addon, sort_order) values
  ('prospeccao_avancada', 'Prospecção Avançada (Instagram + IA)', 'Comercial', true, 55)
on conflict (key) do nothing;
-- Propositalmente NÃO entra em plan_modules — fica fora de todo plano até
-- o dono decidir precificar/incluir. Liberação por org via org_modules.

-- 2) Nota de corte de qualificação antes de entrar em cadência automática.
--    NULL = sem corte (comportamento atual preservado).
alter table public.prospecting_campaigns
  add column if not exists min_score_to_enroll int;

-- 3) Curva de aquecimento por número de WhatsApp (anti-ban). Um registro por
--    (org, provider, identifier). started_at = primeiro envio já feito por
--    esse número; sent_today/send_date resetam diariamente na aplicação.
create table if not exists public.whatsapp_number_warmup (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  provider        text not null,
  identifier      text not null,
  started_at      timestamptz not null default now(),
  send_date       date not null default current_date,
  sent_today      int not null default 0,
  updated_at      timestamptz not null default now(),
  primary key (organization_id, provider, identifier)
);
create index if not exists idx_wa_warmup_org on public.whatsapp_number_warmup(organization_id);

alter table public.whatsapp_number_warmup enable row level security;
drop policy if exists "wa_warmup_read" on public.whatsapp_number_warmup;
create policy "wa_warmup_read" on public.whatsapp_number_warmup
  for select using (public.is_org_member(organization_id));
-- escrita só service_role (o motor de cadência usa admin client), sem policy de insert/update/delete pra authenticated.
