-- Detalhe completo do ticket por id (com company)
create or replace function public.tk_get_full_ticket(p_ticket_id uuid, p_org uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_ticket jsonb; v_msgs jsonb; v_company jsonb;
begin
  select to_jsonb(t.*) into v_ticket from support_tickets t where t.id = p_ticket_id and t.organization_id = p_org;
  if v_ticket is null then return null; end if;
  select coalesce(jsonb_agg(to_jsonb(m.*) order by m.created_at), '[]'::jsonb) into v_msgs
  from ticket_messages m where m.ticket_id = p_ticket_id;
  select to_jsonb(c.*) into v_company from companies c where c.id = nullif(v_ticket->>'company_id','')::uuid;
  return jsonb_build_object('ticket', v_ticket, 'messages', v_msgs, 'company', v_company);
end; $$;
grant execute on function public.tk_get_full_ticket(uuid, uuid) to authenticated;

-- Detalhe completo do ticket por PROTOCOL (cliente acessa por /chamados/[protocol])
create or replace function public.tk_get_full_ticket_by_protocol(p_protocol text, p_org uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_ticket jsonb; v_msgs jsonb; v_company jsonb; v_tid uuid;
begin
  select to_jsonb(t.*), t.id into v_ticket, v_tid
  from support_tickets t
  where t.protocol = p_protocol and t.organization_id = p_org;
  if v_ticket is null then return null; end if;
  select coalesce(jsonb_agg(to_jsonb(m.*) order by m.created_at), '[]'::jsonb) into v_msgs
  from ticket_messages m where m.ticket_id = v_tid;
  select to_jsonb(c.*) into v_company from companies c where c.id = nullif(v_ticket->>'company_id','')::uuid;
  return jsonb_build_object('ticket', v_ticket, 'messages', v_msgs, 'company', v_company);
end; $$;
grant execute on function public.tk_get_full_ticket_by_protocol(text, uuid) to authenticated;

-- Tickets de uma org (opcional filtrar por company)
create or replace function public.tk_list_my_tickets(p_org uuid, p_company uuid default null)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(t.*) order by t.opened_at desc), '[]'::jsonb)
  from support_tickets t
  where t.organization_id = p_org
    and (p_company is null or t.company_id = p_company);
$$;
grant execute on function public.tk_list_my_tickets(uuid, uuid) to authenticated;

-- Atualizar status / priority / department / assigned_to / subject
create or replace function public.tk_update_ticket(p_id uuid, p_org uuid, p_patch jsonb)
returns void language plpgsql security definer set search_path=public as $$
begin
  update support_tickets set
    status = coalesce(p_patch->>'status', status),
    priority = coalesce(p_patch->>'priority', priority),
    department = coalesce(p_patch->>'department', department),
    assigned_to = coalesce(nullif(p_patch->>'assigned_to','')::uuid, assigned_to),
    subject = coalesce(p_patch->>'subject', subject),
    closed_at = case
      when (p_patch->>'status') in ('resolvido','fechado') then now()
      when (p_patch->>'status') is not null then null
      else closed_at
    end,
    last_response_at = now(),
    updated_at = now()
  where id = p_id and organization_id = p_org;
end; $$;
grant execute on function public.tk_update_ticket(uuid, uuid, jsonb) to authenticated;

-- Não-lidas por user (usa tabela notification_seen existente, coluna 'module')
create or replace function public.tk_unread_count(p_org uuid, p_user uuid, p_scope text default 'tickets')
returns int language sql security definer set search_path=public as $$
  select count(*)::int from support_tickets t
  where t.organization_id = p_org
    and t.status in ('aberto','em_analise','aguardando_cliente')
    and coalesce(t.last_response_at, t.opened_at) > coalesce(
      (select last_seen_at from notification_seen ns
        where ns.user_id = p_user and ns.module = p_scope),
      'epoch'::timestamptz
    );
$$;
grant execute on function public.tk_unread_count(uuid, uuid, text) to authenticated;

-- Marca scope como visto (usa schema existente: module)
create or replace function public.tk_mark_seen(p_user uuid, p_scope text)
returns void language plpgsql security definer set search_path=public as $$
begin
  insert into notification_seen (user_id, module, last_seen_at)
  values (p_user, p_scope, now())
  on conflict (user_id, module) do update set last_seen_at = excluded.last_seen_at;
end; $$;
grant execute on function public.tk_mark_seen(uuid, text) to authenticated;

notify pgrst, 'reload schema';
