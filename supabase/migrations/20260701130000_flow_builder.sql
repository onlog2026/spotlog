-- ============================================================
-- Flow Builder / Robô (Épico 1) — construtor de fluxos visual
-- ------------------------------------------------------------
-- Tabelas do construtor de fluxos (estilo Digisac): grafo em JSONB,
-- máquina de estados por contato e logs. Aditivo e idempotente.
-- RLS por organização (membro da org lê/escreve os seus).
-- ============================================================

-- 1) FLUXOS — o grafo (nós + arestas) em JSONB
create table if not exists public.flows (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name            text not null default 'Novo fluxo',
  description     text,
  status          text not null default 'draft',      -- draft | active | paused
  trigger_type    text not null default 'webhook',     -- webhook | keyword | manual
  trigger_config  jsonb not null default '{}'::jsonb,   -- ex.: { keywords: ["oi","quero"] }
  graph           jsonb not null default '{"nodes":[],"edges":[]}'::jsonb,
  created_by      uuid references auth.users(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_flows_org on public.flows(organization_id);
create index if not exists idx_flows_status on public.flows(organization_id, status);

-- 2) EXECUÇÕES — máquina de estados por contato dentro de um fluxo
create table if not exists public.flow_executions (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  flow_id         uuid not null references public.flows(id) on delete cascade,
  contact_id      uuid,                                 -- contato/lead (solto p/ não acoplar)
  contact_ref     text,                                 -- telefone/whatsapp quando não há contato
  current_node_id text,
  state           jsonb not null default '{}'::jsonb,    -- variáveis coletadas no fluxo
  status          text not null default 'active',        -- active | waiting | done | error | stopped
  waiting_for     text,                                  -- reply | time
  wait_until      timestamptz,                           -- quando destravar (delays)
  step_count      int not null default 0,                -- anti-loop
  last_error      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index if not exists idx_flow_exec_flow on public.flow_executions(flow_id);
create index if not exists idx_flow_exec_due
  on public.flow_executions(status, wait_until);
-- 1 execução ATIVA por (fluxo, contato) — evita disparo duplicado
create unique index if not exists uq_flow_exec_active
  on public.flow_executions(flow_id, contact_ref)
  where status in ('active','waiting');

-- 3) LOGS — trilha de cada passo executado (auditoria / debug)
create table if not exists public.flow_execution_logs (
  id            uuid primary key default gen_random_uuid(),
  execution_id  uuid not null references public.flow_executions(id) on delete cascade,
  node_id       text,
  event         text not null,                           -- entered | sent | waited | condition | error | done
  detail        jsonb,
  created_at    timestamptz not null default now()
);
create index if not exists idx_flow_logs_exec on public.flow_execution_logs(execution_id);

-- 4) RLS
alter table public.flows                enable row level security;
alter table public.flow_executions      enable row level security;
alter table public.flow_execution_logs  enable row level security;

drop policy if exists "flows_rw" on public.flows;
create policy "flows_rw" on public.flows
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

drop policy if exists "flow_exec_rw" on public.flow_executions;
create policy "flow_exec_rw" on public.flow_executions
  for all using (public.is_org_member(organization_id))
  with check (public.is_org_member(organization_id));

-- logs: leitura por membro da org dona da execução (via join)
drop policy if exists "flow_logs_read" on public.flow_execution_logs;
create policy "flow_logs_read" on public.flow_execution_logs
  for select using (
    exists (
      select 1 from public.flow_executions e
      where e.id = execution_id and public.is_org_member(e.organization_id)
    )
  );
