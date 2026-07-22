-- Modelos de proposta (pacotes de negocio): cada modelo = tabela de precos
-- por regiao/CEP/peso + abrangencia (prazo de entrega) + regras gerais.
-- Importado de uma planilha (mesma estrutura da Spotlog_Precos.xlsx:
-- aba "Tabela" + "ABRANGENCIA ESTADO SP" + "Regras Gerais").

create table if not exists public.proposal_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_proposal_templates_org on public.proposal_templates(organization_id);

-- Uma linha por faixa de CEP. precos = jsonb com preco BASE (reajuste 0%)
-- por faixa de peso, ex: {"0.25": 6.18, "0.5": 6.27, "1": 6.45, ...}.
-- O reajuste (%) escolhido na proposta e aplicado em cima disso na hora de
-- exibir -- nao precisa duplicar 17 colunas de cenario por linha.
create table if not exists public.proposal_template_regions (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.proposal_templates(id) on delete cascade,
  uf text not null,
  cidade text not null,
  regiao text,
  cep_inicio text not null,
  cep_fim text not null,
  prazo_entrega text,
  precos jsonb not null default '{}'::jsonb,
  position int default 0
);
create index if not exists idx_proposal_template_regions_template on public.proposal_template_regions(template_id);

-- Regras gerais (termos), numeradas (1.1, 1.2, 2.1 ...) igual a planilha.
create table if not exists public.proposal_template_rules (
  id uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.proposal_templates(id) on delete cascade,
  codigo text,
  descricao text not null,
  position int default 0
);
create index if not exists idx_proposal_template_rules_template on public.proposal_template_rules(template_id);

-- Liga a proposta ao modelo escolhido + o % de reajuste aplicado sobre a
-- tabela base do modelo (ex: 0.08 = 8%).
alter table public.proposals
  add column if not exists template_id uuid references public.proposal_templates(id) on delete set null,
  add column if not exists reajuste_pct numeric(6,4) not null default 0;

alter table public.proposal_templates enable row level security;
alter table public.proposal_template_regions enable row level security;
alter table public.proposal_template_rules enable row level security;

drop policy if exists "proposal_templates_org" on public.proposal_templates;
create policy "proposal_templates_org" on public.proposal_templates for all using (
  public.is_org_member(organization_id)
) with check (
  public.is_org_member(organization_id)
);

drop policy if exists "proposal_template_regions_org" on public.proposal_template_regions;
create policy "proposal_template_regions_org" on public.proposal_template_regions for all using (
  exists (select 1 from public.proposal_templates t where t.id = proposal_template_regions.template_id and public.is_org_member(t.organization_id))
) with check (
  exists (select 1 from public.proposal_templates t where t.id = proposal_template_regions.template_id and public.is_org_member(t.organization_id))
);

drop policy if exists "proposal_template_rules_org" on public.proposal_template_rules;
create policy "proposal_template_rules_org" on public.proposal_template_rules for all using (
  exists (select 1 from public.proposal_templates t where t.id = proposal_template_rules.template_id and public.is_org_member(t.organization_id))
) with check (
  exists (select 1 from public.proposal_templates t where t.id = proposal_template_rules.template_id and public.is_org_member(t.organization_id))
);

-- Sem policy de leitura publica aqui de proposito: a pagina publica
-- /proposta/[token] ja le via createAdminClient() (service role, ignora
-- RLS) -- igual o resto do fluxo de propostas. Uma policy "using (true)"
-- deixaria a tabela de precos de TODAS as organizacoes legivel por
-- qualquer um com a chave anon, sem nem precisar do token da proposta.
