-- RPCs pra acessar tabelas novas sem depender do schema cache do PostgREST
-- (PGRST205 workaround para shipments, drivers, vehicles, occurrences,
--  support_tickets, regulatory_documents, invoices, pickups)

-- Shipments
create or replace function public.op_create_shipment(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into shipments (
    organization_id, company_id, pickup_id, code, recipient_name, recipient_phone,
    recipient_email, destination_address, dimensions_json, weight_kg, declared_value,
    status, sla_deadline, driver_id, route_id, created_by
  ) values (
    (p_payload->>'organization_id')::uuid,
    nullif(p_payload->>'company_id','')::uuid,
    nullif(p_payload->>'pickup_id','')::uuid,
    coalesce(p_payload->>'code', 'SP-' || lpad((floor(random()*9000)+1000)::text, 4, '0')),
    p_payload->>'recipient_name',
    p_payload->>'recipient_phone',
    p_payload->>'recipient_email',
    coalesce(p_payload->'destination_address', '{}'::jsonb),
    coalesce(p_payload->'dimensions_json', '{}'::jsonb),
    nullif(p_payload->>'weight_kg','')::numeric,
    nullif(p_payload->>'declared_value','')::numeric,
    coalesce(p_payload->>'status', 'criada'),
    nullif(p_payload->>'sla_deadline','')::timestamptz,
    nullif(p_payload->>'driver_id','')::uuid,
    nullif(p_payload->>'route_id','')::uuid,
    auth.uid()
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.op_create_shipment(jsonb) to authenticated;

create or replace function public.op_create_driver(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into drivers (organization_id, full_name, cpf, cnh_numero, cnh_validade, phone, email, status, photo_url, vehicle_id)
  values (
    (p_payload->>'organization_id')::uuid,
    p_payload->>'full_name',
    p_payload->>'cpf',
    p_payload->>'cnh_numero',
    nullif(p_payload->>'cnh_validade','')::date,
    p_payload->>'phone',
    p_payload->>'email',
    coalesce(p_payload->>'status', 'ativo'),
    p_payload->>'photo_url',
    nullif(p_payload->>'vehicle_id','')::uuid
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.op_create_driver(jsonb) to authenticated;

create or replace function public.op_create_vehicle(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into vehicles (organization_id, plate, brand, model, year, type, capacity_kg, status)
  values (
    (p_payload->>'organization_id')::uuid,
    upper(p_payload->>'plate'),
    p_payload->>'brand',
    p_payload->>'model',
    nullif(p_payload->>'year','')::int,
    p_payload->>'type',
    nullif(p_payload->>'capacity_kg','')::numeric,
    coalesce(p_payload->>'status','disponivel')
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.op_create_vehicle(jsonb) to authenticated;

create or replace function public.op_create_pickup(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into pickups (organization_id, company_id, code, address_json, scheduled_window_start, scheduled_window_end, status, volumes, weight_kg, notes, driver_id, created_by)
  values (
    (p_payload->>'organization_id')::uuid,
    nullif(p_payload->>'company_id','')::uuid,
    coalesce(p_payload->>'code', 'PK-' || lpad((floor(random()*9000)+1000)::text, 4, '0')),
    coalesce(p_payload->'address_json','{}'::jsonb),
    nullif(p_payload->>'scheduled_window_start','')::timestamptz,
    nullif(p_payload->>'scheduled_window_end','')::timestamptz,
    coalesce(p_payload->>'status','solicitada'),
    nullif(p_payload->>'volumes','')::int,
    nullif(p_payload->>'weight_kg','')::numeric,
    p_payload->>'notes',
    nullif(p_payload->>'driver_id','')::uuid,
    auth.uid()
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.op_create_pickup(jsonb) to authenticated;

create or replace function public.op_create_occurrence(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into occurrences (organization_id, shipment_id, category, severity, description, status, assigned_to)
  values (
    (p_payload->>'organization_id')::uuid,
    nullif(p_payload->>'shipment_id','')::uuid,
    coalesce(p_payload->>'category','outro'),
    coalesce(p_payload->>'severity','media'),
    p_payload->>'description',
    coalesce(p_payload->>'status','aberta'),
    nullif(p_payload->>'assigned_to','')::uuid
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.op_create_occurrence(jsonb) to authenticated;

create or replace function public.op_create_ticket(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into support_tickets (organization_id, company_id, protocol, subject, category, description, status, priority, department, shipment_id, assigned_to)
  values (
    (p_payload->>'organization_id')::uuid,
    nullif(p_payload->>'company_id','')::uuid,
    coalesce(p_payload->>'protocol', 'TK-' || lpad((floor(random()*90000)+10000)::text, 5, '0')),
    p_payload->>'subject',
    p_payload->>'category',
    p_payload->>'description',
    coalesce(p_payload->>'status','aberto'),
    coalesce(p_payload->>'priority','media'),
    coalesce(p_payload->>'department','sac'),
    nullif(p_payload->>'shipment_id','')::uuid,
    nullif(p_payload->>'assigned_to','')::uuid
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.op_create_ticket(jsonb) to authenticated;

create or replace function public.op_add_ticket_message(p_ticket_id uuid, p_body text, p_kind text)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into ticket_messages (ticket_id, author_user_id, author_kind, body)
  values (p_ticket_id, auth.uid(), coalesce(p_kind,'operador'), p_body)
  returning id into v_id;
  update support_tickets set last_response_at = now() where id = p_ticket_id;
  return v_id;
end; $$;
grant execute on function public.op_add_ticket_message(uuid, text, text) to authenticated;

create or replace function public.op_list_shipments(p_org uuid, p_status text default null, p_limit int default 50, p_offset int default 0)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(s.*) order by s.created_at desc), '[]'::jsonb)
  from (
    select * from shipments
    where organization_id = p_org
      and (p_status is null or status = p_status)
    order by created_at desc
    limit p_limit offset p_offset
  ) s;
$$;
grant execute on function public.op_list_shipments(uuid, text, int, int) to authenticated;

create or replace function public.op_list_drivers(p_org uuid)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(d.*) order by d.created_at desc), '[]'::jsonb)
  from drivers d where d.organization_id = p_org;
$$;
grant execute on function public.op_list_drivers(uuid) to authenticated;

create or replace function public.op_list_vehicles(p_org uuid)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(v.*) order by v.created_at desc), '[]'::jsonb)
  from vehicles v where v.organization_id = p_org;
$$;
grant execute on function public.op_list_vehicles(uuid) to authenticated;

create or replace function public.op_list_routes(p_org uuid, p_status text default null)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(r.*) order by r.created_at desc), '[]'::jsonb)
  from routes r where r.organization_id = p_org and (p_status is null or r.status = p_status);
$$;
grant execute on function public.op_list_routes(uuid, text) to authenticated;

create or replace function public.op_list_occurrences(p_org uuid, p_status text default null)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(o.*) order by o.opened_at desc), '[]'::jsonb)
  from occurrences o where o.organization_id = p_org and (p_status is null or o.status = p_status);
$$;
grant execute on function public.op_list_occurrences(uuid, text) to authenticated;

create or replace function public.op_list_tickets(p_org uuid, p_dept text default null, p_status text default null)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(t.*) order by t.opened_at desc), '[]'::jsonb)
  from support_tickets t
  where t.organization_id = p_org
    and (p_dept is null or t.department = p_dept)
    and (p_status is null or t.status = p_status);
$$;
grant execute on function public.op_list_tickets(uuid, text, text) to authenticated;

create or replace function public.op_get_ticket(p_ticket_id uuid, p_org uuid)
returns jsonb language plpgsql security definer set search_path=public as $$
declare v_ticket jsonb; v_msgs jsonb;
begin
  select to_jsonb(t.*) into v_ticket from support_tickets t where t.id = p_ticket_id and t.organization_id = p_org;
  if v_ticket is null then return null; end if;
  select coalesce(jsonb_agg(to_jsonb(m.*) order by m.created_at), '[]'::jsonb) into v_msgs
  from ticket_messages m where m.ticket_id = p_ticket_id;
  return jsonb_build_object('ticket', v_ticket, 'messages', v_msgs);
end; $$;
grant execute on function public.op_get_ticket(uuid, uuid) to authenticated;

create or replace function public.op_list_documents(p_org uuid)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(d.*) order by d.created_at desc), '[]'::jsonb)
  from regulatory_documents d where d.organization_id = p_org;
$$;
grant execute on function public.op_list_documents(uuid) to authenticated;

create or replace function public.op_list_invoices(p_org uuid, p_status text default null)
returns jsonb language sql security definer set search_path=public as $$
  select coalesce(jsonb_agg(to_jsonb(i.*) order by i.created_at desc), '[]'::jsonb)
  from invoices i where i.organization_id = p_org and (p_status is null or i.status = p_status);
$$;
grant execute on function public.op_list_invoices(uuid, text) to authenticated;

create or replace function public.op_create_invoice(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into invoices (organization_id, company_id, number, competence, due_date, amount, status, pdf_url, notes)
  values (
    (p_payload->>'organization_id')::uuid,
    nullif(p_payload->>'company_id','')::uuid,
    p_payload->>'number',
    nullif(p_payload->>'competence','')::date,
    nullif(p_payload->>'due_date','')::date,
    nullif(p_payload->>'amount','')::numeric,
    coalesce(p_payload->>'status','pendente'),
    p_payload->>'pdf_url',
    p_payload->>'notes'
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.op_create_invoice(jsonb) to authenticated;

create or replace function public.op_create_document(p_payload jsonb)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_id uuid;
begin
  insert into regulatory_documents (organization_id, doc_type, title, doc_number, issuer, issued_at, expires_at, file_url, status, notes)
  values (
    (p_payload->>'organization_id')::uuid,
    p_payload->>'doc_type',
    p_payload->>'title',
    p_payload->>'doc_number',
    p_payload->>'issuer',
    nullif(p_payload->>'issued_at','')::date,
    nullif(p_payload->>'expires_at','')::date,
    p_payload->>'file_url',
    coalesce(p_payload->>'status','vigente'),
    p_payload->>'notes'
  ) returning id into v_id;
  return v_id;
end; $$;
grant execute on function public.op_create_document(jsonb) to authenticated;

notify pgrst, 'reload schema';
