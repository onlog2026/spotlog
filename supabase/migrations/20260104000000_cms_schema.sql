-- =============================================================================
-- Spotlog Migration 003 — CMS público (blog + cases)
-- Tabelas: cms_posts, cms_cases
-- =============================================================================

-- =========================
-- 1. CMS_POSTS
-- =========================
create table if not exists public.cms_posts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  excerpt text,
  content_md text not null default '',
  cover_url text,
  author_name text,
  author_avatar_url text,
  category text not null default 'blog' check (category in ('blog','case','news')),
  tags text[] not null default '{}',
  status text not null default 'rascunho' check (status in ('rascunho','publicado','arquivado')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  constraint cms_posts_slug_org_unique unique (organization_id, slug)
);

create index if not exists cms_posts_organization_id_idx on public.cms_posts(organization_id);
create index if not exists cms_posts_slug_idx on public.cms_posts(slug);
create index if not exists cms_posts_status_idx on public.cms_posts(status);
create index if not exists cms_posts_category_idx on public.cms_posts(category);
create index if not exists cms_posts_published_at_idx on public.cms_posts(published_at desc);

alter table public.cms_posts enable row level security;

-- Leitura PÚBLICA só de posts publicados
create policy "cms_posts_public_select" on public.cms_posts
  for select to anon, authenticated
  using (status = 'publicado');

-- Membros da org veem tudo da org
create policy "cms_posts_org_select" on public.cms_posts
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "cms_posts_org_insert" on public.cms_posts
  for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "cms_posts_org_update" on public.cms_posts
  for update to authenticated
  using (public.is_org_member(organization_id));

create policy "cms_posts_org_delete" on public.cms_posts
  for delete to authenticated
  using (public.is_org_member(organization_id));

create trigger cms_posts_set_updated_at before update on public.cms_posts
  for each row execute function public.set_updated_at();


-- =========================
-- 2. CMS_CASES
-- =========================
create table if not exists public.cms_cases (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  slug text not null,
  client_name text not null,
  segment text not null default 'outro' check (segment in ('ecommerce','farma','manipulacao','correlatos','dermo','outro')),
  summary text,
  challenge_md text not null default '',
  solution_md text not null default '',
  results_md text not null default '',
  kpi_json jsonb not null default '{}'::jsonb,
  logo_url text,
  hero_url text,
  status text not null default 'rascunho' check (status in ('rascunho','publicado','arquivado')),
  published_at timestamptz,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  constraint cms_cases_slug_org_unique unique (organization_id, slug)
);

create index if not exists cms_cases_organization_id_idx on public.cms_cases(organization_id);
create index if not exists cms_cases_slug_idx on public.cms_cases(slug);
create index if not exists cms_cases_status_idx on public.cms_cases(status);
create index if not exists cms_cases_segment_idx on public.cms_cases(segment);
create index if not exists cms_cases_published_at_idx on public.cms_cases(published_at desc);

alter table public.cms_cases enable row level security;

create policy "cms_cases_public_select" on public.cms_cases
  for select to anon, authenticated
  using (status = 'publicado');

create policy "cms_cases_org_select" on public.cms_cases
  for select to authenticated
  using (public.is_org_member(organization_id));

create policy "cms_cases_org_insert" on public.cms_cases
  for insert to authenticated
  with check (public.is_org_member(organization_id));

create policy "cms_cases_org_update" on public.cms_cases
  for update to authenticated
  using (public.is_org_member(organization_id));

create policy "cms_cases_org_delete" on public.cms_cases
  for delete to authenticated
  using (public.is_org_member(organization_id));

create trigger cms_cases_set_updated_at before update on public.cms_cases
  for each row execute function public.set_updated_at();


-- =========================
-- 3. SEED — pega primeira org existente
-- =========================
do $$
declare
  v_org_id uuid;
begin
  select id into v_org_id from public.organizations order by created_at asc limit 1;
  if v_org_id is null then
    return;
  end if;

  -- Posts
  insert into public.cms_posts (organization_id, slug, title, excerpt, content_md, cover_url, author_name, category, tags, status, published_at, seo_title, seo_description)
  values
    (v_org_id, 'como-reduzir-falhas-na-ultima-milha',
     'Como reduzir falhas na última milha em e-commerce',
     'A última milha é onde a maioria dos e-commerces perde dinheiro. Veja 5 práticas que reduzem ocorrências em até 40%.',
     E'# Como reduzir falhas na última milha\n\nA **última milha** representa até 53% do custo total da entrega e é onde a maior parte das ocorrências acontece.\n\n## 1. Visibilidade em tempo real\n\nSeu cliente precisa saber onde o pedido está — e o seu time também.\n\n## 2. Comunicação proativa\n\nWhatsApp, SMS e e-mail sincronizados evitam tentativa frustrada.\n\n## 3. Janela de entrega\n\nFaixas de 2–3 horas reduzem ausência em até 30%.\n\n## 4. Roteirização inteligente\n\nIA otimizando rotas reduz km rodado e atraso.\n\n## 5. Tratativa rápida de exceção\n\nQuanto antes resolver, menor o custo.',
     'https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?w=1600&q=80',
     'Equipe Spotlog', 'blog', array['ultima-milha','ecommerce','logistica'], 'publicado', now() - interval '2 days',
     'Última milha em e-commerce: 5 práticas que reduzem ocorrências',
     'Como reduzir falhas na última milha do e-commerce com visibilidade, comunicação e roteirização inteligente.'),

    (v_org_id, 'logistica-farma-cadeia-do-frio',
     'Cadeia do frio na logística farma: o que muda em 2026',
     'Novas regras da Anvisa exigem rastreabilidade ponta-a-ponta. Veja o que sua operação precisa adequar.',
     E'# Cadeia do frio farma em 2026\n\nA logística farmacêutica passou por mudanças significativas.\n\n## Rastreabilidade obrigatória\n\nCada caixa térmica deve ter sensor IoT registrando temperatura a cada minuto.\n\n## Documentação digital\n\nFim do papel — tudo eletrônico e auditável.\n\n## Treinamento de motorista\n\nCertificação anual obrigatória para manipulação de termolábeis.',
     'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=1600&q=80',
     'Equipe Spotlog', 'news', array['farma','anvisa','cadeia-do-frio'], 'publicado', now() - interval '5 days',
     'Cadeia do frio farma em 2026: novas regras Anvisa',
     'O que muda na logística farmacêutica em 2026 com as novas regras de rastreabilidade e cadeia do frio.'),

    (v_org_id, 'case-derma-startup-cresceu-3x',
     'Case: como uma startup dermo escalou 3x com a Spotlog',
     'Em 6 meses, saímos de 200 para 1.800 pedidos/mês mantendo SLA acima de 98%.',
     E'# Case: Startup dermo escalou 3x\n\nNossa parceira atua no segmento dermocosmético D2C.\n\n## O contexto\n\n200 pedidos/mês, 7% de ocorrência, sem visibilidade de SLA.\n\n## O que fizemos\n\n- Integração API com a plataforma\n- Roteirização inteligente\n- WhatsApp automático\n- Dashboard de SLA\n\n## Resultado\n\n1.800 pedidos/mês, 1.2% de ocorrência, 98.5% SLA.',
     'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80',
     'Equipe Spotlog', 'case', array['dermo','case','crescimento'], 'publicado', now() - interval '7 days',
     'Case dermo: crescimento 3x com Spotlog',
     'Como uma startup dermocosmética escalou 3x em 6 meses com a operação Spotlog.')
  on conflict (organization_id, slug) do nothing;

  -- Cases
  insert into public.cms_cases (organization_id, slug, client_name, segment, summary, challenge_md, solution_md, results_md, kpi_json, logo_url, hero_url, status, published_at, seo_title, seo_description)
  values
    (v_org_id, 'farma-manipulacao-sp',
     'Farmácia de Manipulação SP',
     'manipulacao',
     'Rede com 12 unidades em São Paulo precisava entregar fórmulas magistrais em até 4 horas mantendo cadeia do frio.',
     E'## Desafio\n\n- Entregas em até **4 horas** após manipulação\n- Cadeia do frio crítica (2–8°C)\n- 12 unidades dispersas\n- Pico de demanda em horário comercial',
     E'## Solução Spotlog\n\n- Frota dedicada com caixas térmicas IoT\n- Roteirização dinâmica por janela\n- Motoristas treinados em termolábeis\n- Dashboard com temperatura em tempo real',
     E'## Resultados\n\nApós 90 dias:\n\n- **SLA de 98.7%** em até 4h\n- **Zero quebra** de cadeia do frio\n- **Redução de 22%** no custo por entrega\n- **NPS 84** dos pacientes',
     '{"SLA": "98.7%", "Cadeia do frio": "100%", "Redução de custo": "22%", "NPS": "84"}'::jsonb,
     'https://images.unsplash.com/photo-1471864190281-a93a3070b6de?w=400&q=80',
     'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=1600&q=80',
     'publicado', now() - interval '3 days',
     'Case Farma Manipulação SP — entrega em 4h',
     'Como entregamos fórmulas magistrais em até 4h mantendo cadeia do frio em 12 unidades de São Paulo.'),

    (v_org_id, 'ecommerce-dermo-d2c',
     'Marca Dermo D2C',
     'dermo',
     'Marca de skincare D2C escalou de 200 para 1.800 pedidos/mês com SLA de 98%+ em 6 meses.',
     E'## Desafio\n\n- Crescimento 9x em 6 meses\n- 7% de taxa de ocorrência\n- Sem visibilidade de SLA\n- Cliente reclamando de atraso',
     E'## Solução Spotlog\n\n- API integrada à plataforma\n- WhatsApp automático em cada status\n- Janela de entrega 2h\n- Operação dedicada com SLA contratual',
     E'## Resultados\n\n- **1.800 pedidos/mês** mantendo qualidade\n- **1.2%** de ocorrência (-83%)\n- **98.5%** de SLA contratado\n- **+34 pontos** de NPS',
     '{"Crescimento": "9x", "Ocorrência": "1.2%", "SLA": "98.5%", "NPS": "+34"}'::jsonb,
     'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80',
     'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600&q=80',
     'publicado', now() - interval '6 days',
     'Case dermo D2C — crescimento 9x em 6 meses',
     'Marca dermocosmética escalou 9x mantendo SLA 98.5% e reduzindo ocorrências em 83%.')
  on conflict (organization_id, slug) do nothing;
end$$;
