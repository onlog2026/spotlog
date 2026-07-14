-- ============================================================
-- Form Builder — Spotlog
-- Aplicar este arquivo no SQL Editor do Supabase (projeto lfvuwrpfdnyqfxjaicba)
-- Cria 3 tabelas (form_definitions, form_fields, form_submissions), RLS,
-- triggers e seed inicial dos 2 formularios padrao.
-- ============================================================

create table if not exists public.form_definitions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  submit_label text not null default 'Enviar',
  success_title text not null default 'Obrigado pelo contato!',
  success_message text not null default 'Recebemos sua mensagem. Nossa equipe vai responder em ate 1 dia util.',
  lead_source text not null default 'site',
  lead_source_detail text,
  redirect_url text,
  notify_emails text[] default '{}',
  active boolean not null default true,
  show_consent boolean not null default true,
  consent_text text default 'Concordo com o tratamento dos meus dados conforme a Politica de Privacidade para que a Spotlog entre em contato comigo.',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  created_by uuid references auth.users(id),
  unique(organization_id, slug)
);

create table if not exists public.form_fields (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references form_definitions(id) on delete cascade,
  field_key text not null,
  type text not null check (type in ('text','email','phone','textarea','select','radio','checkbox','number','date','url','hidden')),
  label text not null,
  placeholder text,
  help_text text,
  required boolean not null default false,
  options jsonb default '[]'::jsonb,
  validation jsonb default '{}'::jsonb,
  width text not null default 'full' check (width in ('full','half','third')),
  sort int not null default 0,
  maps_to_lead text,
  active boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(form_id, field_key)
);

create table if not exists public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references form_definitions(id) on delete cascade,
  organization_id uuid not null references organizations(id) on delete cascade,
  lead_id uuid references leads(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  source_url text,
  ip inet,
  user_agent text,
  consent_given boolean not null default false,
  submitted_at timestamptz default now()
);
create index if not exists idx_form_submissions_form on form_submissions(form_id, submitted_at desc);
create index if not exists idx_form_submissions_lead on form_submissions(lead_id);

alter table form_definitions enable row level security;
alter table form_fields enable row level security;
alter table form_submissions enable row level security;

drop policy if exists "form_definitions_public_read" on form_definitions;
create policy "form_definitions_public_read" on form_definitions for select to anon, authenticated using (active = true);

drop policy if exists "form_fields_public_read" on form_fields;
create policy "form_fields_public_read" on form_fields for select to anon, authenticated using (
  exists(select 1 from form_definitions d where d.id = form_id and d.active = true)
);

drop policy if exists "form_definitions_org_admin" on form_definitions;
create policy "form_definitions_org_admin" on form_definitions for all using (public.is_org_member(organization_id)) with check (public.is_org_member(organization_id));

drop policy if exists "form_fields_org_admin" on form_fields;
create policy "form_fields_org_admin" on form_fields for all using (
  exists(select 1 from form_definitions d where d.id = form_id and public.is_org_member(d.organization_id))
) with check (
  exists(select 1 from form_definitions d where d.id = form_id and public.is_org_member(d.organization_id))
);

drop policy if exists "form_submissions_public_insert" on form_submissions;
create policy "form_submissions_public_insert" on form_submissions for insert to anon, authenticated with check (true);

drop policy if exists "form_submissions_org_read" on form_submissions;
create policy "form_submissions_org_read" on form_submissions for select using (public.is_org_member(organization_id));

drop trigger if exists trg_form_definitions_updated on form_definitions;
create trigger trg_form_definitions_updated before update on form_definitions for each row execute function set_updated_at();

drop trigger if exists trg_form_fields_updated on form_fields;
create trigger trg_form_fields_updated before update on form_fields for each row execute function set_updated_at();

-- ============================================================
-- SEED: 2 formularios padrao
-- ATENCAO: substitua a ORG_ID abaixo pelo id da sua org (em organizations)
-- Por padrao usa o NEXT_PUBLIC_DEFAULT_ORG_ID =
-- 5acd399c-4ec5-471e-8493-794bee404163
-- ============================================================
do $$
declare
  v_org uuid := coalesce(
    (select id from organizations where id = '5acd399c-4ec5-471e-8493-794bee404163'),
    (select id from organizations order by created_at asc limit 1)
  );
  v_form_proposta uuid;
  v_form_contato uuid;
begin
  if v_org is null then
    raise notice 'Nenhuma organizacao encontrada — pulando seed';
    return;
  end if;

  insert into form_definitions (organization_id, slug, title, description, submit_label, lead_source, lead_source_detail, success_title, success_message)
  values (v_org, 'solicitar-proposta', 'Pronto para otimizar sua logistica?',
    'Conta pra gente seu segmento, volume e regiao. Em ate 1 dia util um especialista da Spotlog desenha uma proposta sob medida.',
    'Solicitar proposta agora', 'site', 'solicitar-proposta',
    'Obrigado pelo contato!', 'Recebemos sua solicitacao. Nosso time comercial vai responder em ate 1 dia util pelo e-mail ou WhatsApp.')
  on conflict (organization_id, slug) do update set updated_at = now()
  returning id into v_form_proposta;

  if v_form_proposta is null then
    select id into v_form_proposta from form_definitions where organization_id = v_org and slug = 'solicitar-proposta';
  end if;

  insert into form_fields (form_id, field_key, type, label, placeholder, required, width, sort, maps_to_lead) values
    (v_form_proposta, 'full_name', 'text', 'Nome completo', 'Como devemos te chamar?', true, 'half', 1, 'full_name'),
    (v_form_proposta, 'company_name', 'text', 'Empresa', 'Nome da sua empresa', true, 'half', 2, 'company_name'),
    (v_form_proposta, 'email', 'email', 'E-mail corporativo', 'voce@empresa.com.br', true, 'half', 3, 'email'),
    (v_form_proposta, 'whatsapp', 'phone', 'WhatsApp', '(11) 99999-9999', true, 'half', 4, 'whatsapp')
  on conflict (form_id, field_key) do nothing;

  insert into form_fields (form_id, field_key, type, label, required, width, sort, options, maps_to_lead) values
    (v_form_proposta, 'segment', 'select', 'Segmento', false, 'half', 5,
      '[{"value":"ecommerce","label":"E-commerce"},{"value":"farma","label":"Farmacia"},{"value":"manipulacao","label":"Farmacia de manipulacao"},{"value":"correlatos","label":"Correlatos / Dermocosmeticos"},{"value":"b2b","label":"B2B / Industria"},{"value":"outro","label":"Outro"}]'::jsonb,
      null),
    (v_form_proposta, 'volume', 'select', 'Volume mensal de entregas', false, 'half', 6,
      '[{"value":"ate_50","label":"Ate 50/mes"},{"value":"50_200","label":"50 a 200/mes"},{"value":"200_500","label":"200 a 500/mes"},{"value":"500_1000","label":"500 a 1.000/mes"},{"value":"1000_5000","label":"1.000 a 5.000/mes"},{"value":"mais_5000","label":"Mais de 5.000/mes"}]'::jsonb,
      null),
    (v_form_proposta, 'regiao', 'text', 'Regiao de atuacao', false, 'half', 7, '[]'::jsonb, null),
    (v_form_proposta, 'tipo_operacao', 'select', 'Tipo de operacao', false, 'half', 8,
      '[{"value":"expressa","label":"Expressa / Same-day"},{"value":"dedicada","label":"Rota dedicada"},{"value":"reversa","label":"Logistica reversa"},{"value":"farma","label":"Farma com AFE"},{"value":"misto","label":"Misto"}]'::jsonb,
      null),
    (v_form_proposta, 'message', 'textarea', 'Como podemos ajudar?', true, 'full', 9, '[]'::jsonb, 'message')
  on conflict (form_id, field_key) do nothing;

  update form_fields set placeholder = 'Ex: Sao Paulo capital, Grande SP, Campinas' where form_id = v_form_proposta and field_key = 'regiao';
  update form_fields set placeholder = 'Conte um pouco do desafio da sua operacao' where form_id = v_form_proposta and field_key = 'message';

  insert into form_definitions (organization_id, slug, title, description, submit_label, lead_source, lead_source_detail)
  values (v_org, 'contato-geral', 'Fale com a Spotlog',
    'Manda sua duvida ou pedido. Nossa equipe responde rapidinho.',
    'Enviar mensagem', 'site', 'contato')
  on conflict (organization_id, slug) do update set updated_at = now()
  returning id into v_form_contato;

  if v_form_contato is null then
    select id into v_form_contato from form_definitions where organization_id = v_org and slug = 'contato-geral';
  end if;

  insert into form_fields (form_id, field_key, type, label, placeholder, required, width, sort, maps_to_lead) values
    (v_form_contato, 'full_name', 'text', 'Nome', 'Seu nome', true, 'half', 1, 'full_name'),
    (v_form_contato, 'email', 'email', 'E-mail', 'voce@email.com', true, 'half', 2, 'email'),
    (v_form_contato, 'whatsapp', 'phone', 'WhatsApp (opcional)', '(11) 99999-9999', false, 'half', 3, 'whatsapp'),
    (v_form_contato, 'company_name', 'text', 'Empresa (opcional)', '', false, 'half', 4, 'company_name'),
    (v_form_contato, 'subject', 'select', 'Assunto', null, false, 'full', 5, null),
    (v_form_contato, 'message', 'textarea', 'Mensagem', null, true, 'full', 6, 'message')
  on conflict (form_id, field_key) do nothing;

  update form_fields set options = '[{"value":"comercial","label":"Comercial / proposta"},{"value":"farma","label":"Transporte farmaceutico"},{"value":"sac","label":"SAC / suporte"},{"value":"parceria","label":"Parceria"},{"value":"outro","label":"Outro"}]'::jsonb
    where form_id = v_form_contato and field_key = 'subject';
end $$;

-- Verificacao final (rode no SQL Editor pra confirmar)
-- select 'definitions' as kind, count(*)::text as n from form_definitions
-- union all
-- select 'fields', count(*)::text from form_fields;
