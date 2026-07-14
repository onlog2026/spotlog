-- Chatbot IA — base de conhecimento, sessões, mensagens e self-learning
-- Migration aplicada via MCP em 2026-05-26
-- Tabelas: chatbot_knowledge, chatbot_sessions, chatbot_messages, chatbot_unanswered

create table if not exists public.chatbot_knowledge (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  category text not null check (category in ('produto','servico','politica','faq','contato','outro')),
  question text not null,
  answer text not null,
  keywords text[] default '{}',
  priority int default 0,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);
create index if not exists idx_chatbot_kb_active on public.chatbot_knowledge(active, category, priority desc);

create table if not exists public.chatbot_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  session_token text unique not null,
  visitor_ip inet,
  visitor_user_agent text,
  referrer text,
  started_at timestamptz default now(),
  last_activity_at timestamptz default now(),
  converted boolean default false,
  lead_id uuid references public.leads(id) on delete set null,
  metadata jsonb default '{}'::jsonb
);
create index if not exists idx_chatbot_sessions_token on public.chatbot_sessions(session_token);
create index if not exists idx_chatbot_sessions_converted on public.chatbot_sessions(converted, started_at desc);

create table if not exists public.chatbot_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.chatbot_sessions(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  matched_kb_ids uuid[] default '{}',
  intent text,
  confidence numeric,
  created_at timestamptz default now()
);
create index if not exists idx_chatbot_messages_session on public.chatbot_messages(session_id, created_at);

create table if not exists public.chatbot_unanswered (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  session_id uuid references public.chatbot_sessions(id) on delete cascade,
  question text not null,
  context text,
  resolved boolean default false,
  resolved_kb_id uuid references public.chatbot_knowledge(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz default now()
);
create index if not exists idx_chatbot_unanswered_resolved on public.chatbot_unanswered(resolved, created_at desc);

alter table public.chatbot_knowledge enable row level security;
alter table public.chatbot_sessions enable row level security;
alter table public.chatbot_messages enable row level security;
alter table public.chatbot_unanswered enable row level security;

create policy "chatbot_kb_public_read" on public.chatbot_knowledge for select to anon, authenticated using (active = true);
create policy "chatbot_kb_member_all" on public.chatbot_knowledge for all using (organization_id is null or public.is_org_member(organization_id)) with check (organization_id is null or public.is_org_member(organization_id));

create policy "chatbot_sessions_public_insert" on public.chatbot_sessions for insert to anon, authenticated with check (true);
create policy "chatbot_sessions_member_read" on public.chatbot_sessions for select using (organization_id is null or public.is_org_member(organization_id));

create policy "chatbot_messages_public_insert" on public.chatbot_messages for insert to anon, authenticated with check (true);
create policy "chatbot_messages_member_read" on public.chatbot_messages for select using (
  exists(select 1 from public.chatbot_sessions s where s.id = session_id and (s.organization_id is null or public.is_org_member(s.organization_id)))
);

create policy "chatbot_unanswered_public_insert" on public.chatbot_unanswered for insert to anon, authenticated with check (true);
create policy "chatbot_unanswered_member_all" on public.chatbot_unanswered for all using (organization_id is null or public.is_org_member(organization_id)) with check (organization_id is null or public.is_org_member(organization_id));

-- Seed inicial — 15 perguntas/respostas sobre Spotlog
insert into public.chatbot_knowledge (category, question, answer, keywords, priority) values
('produto','O que é a Spotlog?','A Spotlog é uma transportadora de logística inteligente que opera em São Paulo e Grande SP. Oferecemos entregas para e-commerce, farma, manipulação, correlatos, dermocosméticos e B2B com rastreabilidade ponta a ponta. Nosso slogan: "Nós entregamos realizações."', array['o que é','sobre','empresa','quem é'], 100),
('servico','Quais serviços vocês oferecem?','Oferecemos: 1) Same Day Delivery (entrega no mesmo dia), 2) Moto Fixa (motoboy dedicado), 3) E-commerce Express, 4) Soluções Personalizadas (etiquetagem, fracionamento, etc), 5) Express Pharma (transporte farmacêutico com AFE Anvisa).', array['serviços','soluções','o que fazem','tipos de entrega'], 90),
('produto','Vocês têm AFE da Anvisa?','Sim! A Spotlog possui AFE (Autorização de Funcionamento para Transporte) da Anvisa. Isso garante que cumprimos todos os requisitos para transportar medicamentos, termolábeis e correlatos. Temos farmacêutico responsável acompanhando todo o processo.', array['anvisa','afe','medicamento','farmacia','termolabel','licença'], 100),
('produto','Vocês transportam medicamentos termolábeis?','Sim. Possuímos AFE da Anvisa e infraestrutura para transporte de termolábeis com controle de temperatura adequado, veículos validados e farmacêutico responsável.', array['termolabel','refrigerado','vacina','medicamento gelado'], 90),
('servico','Onde vocês atuam?','Atuamos em todo o estado de São Paulo e região metropolitana (Grande SP). Para outras regiões, consulte nosso comercial.', array['onde','região','cobertura','atendem','cidade'], 80),
('servico','Como funciona o Same Day Delivery?','Same Day Delivery é a entrega feita no mesmo dia da compra. Ideal pra e-commerces que querem encantar o cliente com agilidade.', array['same day','mesmo dia','express','rápido'], 80),
('faq','Como rastrear minha entrega?','Acesse nosso rastreamento público em https://octatracking.com.br/prerastreio ou clique no botão "Acompanhe seu pedido" no topo do site. Você só precisa do código da remessa.', array['rastrear','rastreamento','onde está','localizar pedido','status'], 95),
('faq','Como solicitar uma cotação?','Você pode: 1) Falar com nosso comercial pelo WhatsApp (11) 91479-1442, 2) E-mail comercial@spotlogoficial.com.br, ou 3) Preencher o formulário em /contato. Retornamos em até 1 dia útil.', array['cotação','preço','orçamento','valor','quanto custa','contratar'], 95),
('contato','Como entro em contato?','Telefone/WhatsApp: (11) 91479-1442. E-mails: contato@spotlogoficial.com.br (geral), comercial@spotlogoficial.com.br (vendas), sac@spotlogoficial.com.br (suporte). Instagram: @spotlogoficial.', array['contato','telefone','whatsapp','email','falar','atendimento'], 95),
('produto','Vocês atendem e-commerce?','Sim! Temos serviço E-commerce Express com integração via API, etiquetagem, fracionamento, rastreabilidade e Same Day Delivery. Ideal pra lojistas que querem ganhar conversão e reputação.', array['ecommerce','e-commerce','loja online','marketplace','vtex','shopify'], 90),
('faq','Quanto tempo leva uma entrega?','Depende da modalidade: Same Day (mesmo dia), Express (até 24h), Standard (1-3 dias úteis). Pra rotas dedicadas (Moto Fixa) é imediato dentro da janela contratada.', array['tempo','prazo','quanto demora','quando chega'], 85),
('politica','Como vocês tratam meus dados? (LGPD)','Levamos LGPD a sério. Coletamos só o necessário (nome, contato, dados de remessa), usamos base legal de execução de contrato/interesse legítimo, e você pode pedir exclusão a qualquer momento via sac@spotlogoficial.com.br. Veja nossa Política de Privacidade.', array['lgpd','privacidade','dados','dados pessoais','política'], 70),
('servico','Vocês têm motoboy fixo?','Sim — serviço "Moto Fixa": entregador disponível diariamente em período integral (segunda a sexta), com horários e dias adicionais a combinar conforme sua necessidade.', array['motoboy','motoboy fixo','exclusivo','dedicado'], 80),
('servico','Fazem coleta no meu CD/loja?','Sim, coletamos diretamente no seu CD, loja, distribuidor ou farmácia. Agende pelo painel ou pelo comercial.', array['coleta','retirada','buscar','pegar'], 80),
('faq','Como abrir um chamado de ocorrência?','Pelo SAC: sac@spotlogoficial.com.br ou pelo WhatsApp (11) 91479-1442. Se você é cliente Spotlog, abra direto pelo painel em /app/cliente/chamados.', array['ocorrência','reclamação','problema','dano','extravio','chamado','ticket','sac'], 85)
on conflict do nothing;
