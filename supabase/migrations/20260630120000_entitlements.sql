-- ============================================================
-- Entitlements / Módulos vendáveis por organização (Épico 2 — Passo 1)
-- ------------------------------------------------------------
-- Estado NEUTRO: o "enforcement" nasce DESLIGADO, então has_org_module()
-- retorna TRUE para tudo (default-allow). Nada muda no comportamento atual.
-- Só "fecha" módulos quando o super admin ligar o enforcement (passo futuro),
-- depois do back-fill dos planos das orgs reais.
--
-- Eixo A (NOVO, por ORG): "a org comprou/tem este módulo?"  -> has_org_module
-- Eixo B (JÁ EXISTE, por USUÁRIO): has_module_permission (user_module_permissions)
-- Acesso final = Eixo A AND Eixo B.
--
-- Aditivo e idempotente. NÃO altera nenhuma tabela existente.
-- ============================================================

-- 1) Flag global de enforcement (kill-switch). Começa DESLIGADO.
create table if not exists public.platform_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into public.platform_settings (key, value)
values ('entitlements_enforced', 'false'::jsonb)
on conflict (key) do nothing;

-- 2) Catálogo de módulos vendáveis (fonte da verdade da venda)
create table if not exists public.modules (
  key          text primary key,
  label        text not null,
  description  text,
  module_group text,
  is_addon     boolean not null default false,
  active       boolean not null default true,
  sort_order   int not null default 0,
  created_at   timestamptz not null default now()
);

-- 3) Catálogo de planos
create table if not exists public.plans (
  key            text primary key,
  name           text not null,
  price_cents    int not null default 0,
  billing_period text not null default 'monthly',
  active         boolean not null default true,
  sort_order     int not null default 0,
  created_at     timestamptz not null default now()
);

-- 4) Quais módulos cada plano libera por padrão
create table if not exists public.plan_modules (
  plan_key   text not null references public.plans(key) on delete cascade,
  module_key text not null references public.modules(key) on delete cascade,
  primary key (plan_key, module_key)
);

-- 5) OVERRIDE por organização (add-on ligado / módulo cortado). Vence o plano.
create table if not exists public.org_modules (
  organization_id uuid not null references public.organizations(id) on delete cascade,
  module_key      text not null references public.modules(key) on delete cascade,
  enabled         boolean not null,
  source          text not null default 'override',  -- override | addon | trial | manual
  expires_at      timestamptz,
  granted_by      uuid references auth.users(id),
  note            text,
  created_at      timestamptz not null default now(),
  primary key (organization_id, module_key)
);
create index if not exists idx_org_modules_org on public.org_modules(organization_id);

-- 6) Seed do catálogo de módulos (is_addon = candidato a venda avulsa; ajustável no painel)
insert into public.modules (key, label, module_group, is_addon, sort_order) values
  ('crm',                'CRM',                          'Comercial',   false, 10),
  ('pipeline',           'Pipeline Kanban',              'Comercial',   false, 20),
  ('propostas',          'Propostas',                    'Comercial',   false, 30),
  ('cadencias',          'Cadências',                    'Comercial',   false, 40),
  ('prospeccao',         'Prospecção',                   'Comercial',   true,  50),
  ('sdr',                'SDR / IA',                     'Comercial',   true,  60),
  ('inbox',              'Atendimento WhatsApp (Inbox)', 'Atendimento', true,  70),
  ('flow_builder',       'Robô / Construtor de Fluxos',  'Atendimento', true,  80),
  ('tickets_comercial',  'Tickets Comercial',            'Atendimento', true,  90),
  ('tickets_financeiro', 'Tickets Financeiro',           'Atendimento', true,  100),
  ('tickets_sac',        'Tickets SAC',                  'Atendimento', true,  110),
  ('tickets_tecnico',    'Tickets Técnico',              'Atendimento', true,  120),
  ('marketing',          'Marketing',                    'Conteúdo',    true,  130),
  ('cms',                'CMS',                          'Conteúdo',    true,  140),
  ('operacao',           'Operações / Logística',        'Operações',   true,  150),
  ('cliente_remessas',   'Área Cliente — Remessas',      'Cliente',     true,  160),
  ('cliente_chamados',   'Área Cliente — Chamados',      'Cliente',     true,  170),
  ('cliente_financeiro', 'Área Cliente — Financeiro',    'Cliente',     true,  180)
on conflict (key) do nothing;

-- 7) Seed de planos (placeholder — nomes/preços/escopo reais ajustados depois pelo painel)
--    Inclui 'free' (default de organizations.plan no init_schema) p/ não deixar org órfã.
insert into public.plans (key, name, price_cents, sort_order) values
  ('free',       'Free',       0, 5),
  ('trial',      'Trial',      0, 10),
  ('starter',    'Starter',    0, 20),
  ('pro',        'Pro',        0, 30),
  ('enterprise', 'Enterprise', 0, 40)
on conflict (key) do nothing;

-- 7b) BLINDAGEM: garante que QUALQUER valor já existente em organizations.plan
--     vire um plano do catálogo. Sem isso, ao LIGAR o enforcement no futuro, uma org
--     com plan fora do catálogo perderia todos os módulos. Idempotente.
insert into public.plans (key, name)
select distinct o.plan, initcap(o.plan)
from public.organizations o
where o.plan is not null and btrim(o.plan) <> ''
on conflict (key) do nothing;

-- 8) Seed plan_modules: NEUTRO — todo plano libera todos os módulos.
--    (A restrição real por plano é configurada depois; hoje nada fecha.)
insert into public.plan_modules (plan_key, module_key)
select p.key, m.key from public.plans p cross join public.modules m
on conflict do nothing;

-- 9) Função: a ORGANIZAÇÃO tem o módulo? (precedência: override -> plano -> enforcement)
create or replace function public.has_org_module(p_org uuid, p_module text)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_active   boolean;
  v_enabled  boolean;
  v_in_plan  boolean;
  v_enforced boolean;
begin
  -- módulo precisa existir e estar ativo no catálogo
  select active into v_active from modules where key = p_module;
  if v_active is null then
    -- módulo não catalogado -> não é gerenciado por entitlement -> libera
    return true;
  end if;
  if v_active = false then
    return false;
  end if;

  -- 1) override por org (respeita expiração) — vence o plano
  select enabled into v_enabled
  from org_modules
  where organization_id = p_org
    and module_key = p_module
    and (expires_at is null or expires_at > now());
  if v_enabled is not null then
    return v_enabled;
  end if;

  -- 2) liberado pelo plano da org?
  select exists (
    select 1
    from organizations o
    join plan_modules pm on pm.plan_key = o.plan
    where o.id = p_org and pm.module_key = p_module
  ) into v_in_plan;
  if v_in_plan then
    return true;
  end if;

  -- 3) enforcement: DESLIGADO -> default-allow; LIGADO -> nega o que não foi concedido.
  --    Leitura À PROVA DE EXCEÇÃO: aceita jsonb boolean (true) OU string ("true")
  --    e nunca lança erro de cast (que abortaria a função e quebraria o acesso).
  select (coalesce(value, 'false'::jsonb) in ('true'::jsonb, '"true"'::jsonb))
    into v_enforced
  from platform_settings where key = 'entitlements_enforced';
  return not coalesce(v_enforced, false);
end;
$$;
grant execute on function public.has_org_module(uuid, text) to authenticated;

-- 10) RLS
alter table public.platform_settings enable row level security;
alter table public.modules           enable row level security;
alter table public.plans             enable row level security;
alter table public.plan_modules      enable row level security;
alter table public.org_modules       enable row level security;

-- catálogos globais: leitura por qualquer autenticado; escrita só service_role (super admin)
drop policy if exists "platform_settings_read" on public.platform_settings;
create policy "platform_settings_read" on public.platform_settings
  for select to authenticated using (true);

drop policy if exists "modules_read" on public.modules;
create policy "modules_read" on public.modules
  for select to authenticated using (true);

drop policy if exists "plans_read" on public.plans;
create policy "plans_read" on public.plans
  for select to authenticated using (true);

drop policy if exists "plan_modules_read" on public.plan_modules;
create policy "plan_modules_read" on public.plan_modules
  for select to authenticated using (true);

-- org_modules: membro da org lê os seus; escrita só service_role
drop policy if exists "org_modules_read" on public.org_modules;
create policy "org_modules_read" on public.org_modules
  for select using (public.is_org_member(organization_id));

-- Verificação rápida (opcional): deve retornar TRUE para qualquer org/módulo agora.
-- select public.has_org_module((select id from organizations limit 1), 'flow_builder');
