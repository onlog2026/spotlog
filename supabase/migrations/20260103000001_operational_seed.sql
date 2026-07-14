-- =============================================================================
-- Spotlog Migration 002 — SEED operacional
-- Idempotente: usa a primeira organização existente. Se não houver org ou
-- companies suficientes, o bloco encerra sem erro.
-- =============================================================================

do $$
declare
  v_org_id uuid;
  v_company_a uuid;
  v_company_b uuid;
  v_vehicle_a uuid;
  v_vehicle_b uuid;
  v_driver_a uuid;
  v_driver_b uuid;
  v_pickup_a uuid;
  v_pickup_b uuid;
  v_route_a uuid;
  v_route_b uuid;
  v_route_c uuid;
  v_shipment_ids uuid[] := array[]::uuid[];
  v_ship_id uuid;
  v_ticket_a uuid;
  v_ticket_b uuid;
  v_ticket_c uuid;
  v_invoice_a uuid;
  v_invoice_b uuid;
  i int;
  v_statuses text[] := array['criada','coletada','triagem','em_rota','saiu_entrega','entregue','devolvida','extraviada'];
begin
  -- Encontra a primeira organização
  select id into v_org_id
  from public.organizations
  order by created_at asc
  limit 1;

  if v_org_id is null then
    raise notice 'SEED operacional: nenhuma organization encontrada — seed pulado.';
    return;
  end if;

  -- Garante 2 companies (clientes). Se não houver, cria placeholders.
  select id into v_company_a
  from public.companies
  where organization_id = v_org_id
  order by created_at asc
  limit 1;

  if v_company_a is null then
    insert into public.companies (organization_id, name, cnpj)
    values (v_org_id, 'Cliente Demo Alpha Ltda', '00000000000100')
    returning id into v_company_a;
  end if;

  select id into v_company_b
  from public.companies
  where organization_id = v_org_id and id <> v_company_a
  order by created_at asc
  limit 1;

  if v_company_b is null then
    insert into public.companies (organization_id, name, cnpj)
    values (v_org_id, 'Cliente Demo Beta S.A.', '00000000000200')
    returning id into v_company_b;
  end if;

  -- =========================
  -- VEHICLES (2)
  -- =========================
  insert into public.vehicles (organization_id, plate, brand, model, year, type, capacity_kg, status)
  values (v_org_id, 'SPT-1A01', 'Mercedes-Benz', 'Sprinter 415', 2023, 'van', 1500, 'disponivel')
  on conflict (organization_id, plate) do nothing
  returning id into v_vehicle_a;

  if v_vehicle_a is null then
    select id into v_vehicle_a from public.vehicles where organization_id = v_org_id and plate = 'SPT-1A01';
  end if;

  insert into public.vehicles (organization_id, plate, brand, model, year, type, capacity_kg, status)
  values (v_org_id, 'SPT-2B02', 'Honda', 'CG 160 Cargo', 2024, 'moto', 80, 'em_uso')
  on conflict (organization_id, plate) do nothing
  returning id into v_vehicle_b;

  if v_vehicle_b is null then
    select id into v_vehicle_b from public.vehicles where organization_id = v_org_id and plate = 'SPT-2B02';
  end if;

  -- =========================
  -- DRIVERS (2)
  -- =========================
  insert into public.drivers (organization_id, full_name, cpf, cnh_numero, cnh_validade, phone, email, status, vehicle_id)
  select v_org_id, 'Carlos Andrade Silva', '11122233344', 'CNH00112233', current_date + interval '3 years', '+5511988887777', 'carlos.silva@spotlog.demo', 'ativo', v_vehicle_a
  where not exists (
    select 1 from public.drivers where organization_id = v_org_id and cpf = '11122233344'
  )
  returning id into v_driver_a;

  if v_driver_a is null then
    select id into v_driver_a from public.drivers where organization_id = v_org_id and cpf = '11122233344';
  end if;

  insert into public.drivers (organization_id, full_name, cpf, cnh_numero, cnh_validade, phone, email, status, vehicle_id)
  select v_org_id, 'Marcia Oliveira Souza', '55566677788', 'CNH00445566', current_date + interval '2 years', '+5511977776666', 'marcia.souza@spotlog.demo', 'ativo', v_vehicle_b
  where not exists (
    select 1 from public.drivers where organization_id = v_org_id and cpf = '55566677788'
  )
  returning id into v_driver_b;

  if v_driver_b is null then
    select id into v_driver_b from public.drivers where organization_id = v_org_id and cpf = '55566677788';
  end if;

  -- =========================
  -- PICKUPS (2) — usadas por algumas shipments
  -- =========================
  insert into public.pickups (organization_id, company_id, code, address_json, scheduled_window_start, scheduled_window_end, status, volumes, weight_kg, driver_id, notes)
  select v_org_id, v_company_a, 'PK-0001',
    jsonb_build_object('street','Av. Paulista','number','1000','city','São Paulo','state','SP','zip','01310-100'),
    now() - interval '2 days', now() - interval '2 days' + interval '4 hours',
    'coletada', 5, 42.5, v_driver_a, 'Coleta porta-a-porta'
  where not exists (select 1 from public.pickups where organization_id = v_org_id and code = 'PK-0001')
  returning id into v_pickup_a;

  if v_pickup_a is null then
    select id into v_pickup_a from public.pickups where organization_id = v_org_id and code = 'PK-0001';
  end if;

  insert into public.pickups (organization_id, company_id, code, address_json, scheduled_window_start, scheduled_window_end, status, volumes, weight_kg, driver_id, notes)
  select v_org_id, v_company_b, 'PK-0002',
    jsonb_build_object('street','Rua Oscar Freire','number','2200','city','São Paulo','state','SP','zip','01426-001'),
    now() + interval '1 day', now() + interval '1 day' + interval '3 hours',
    'agendada', 12, 110.0, v_driver_b, 'Janela 09-12h'
  where not exists (select 1 from public.pickups where organization_id = v_org_id and code = 'PK-0002')
  returning id into v_pickup_b;

  if v_pickup_b is null then
    select id into v_pickup_b from public.pickups where organization_id = v_org_id and code = 'PK-0002';
  end if;

  -- =========================
  -- ROUTES (3)
  -- =========================
  insert into public.routes (organization_id, code, driver_id, vehicle_id, started_at, ended_at, total_stops, status)
  select v_org_id, 'RT-0001', v_driver_a, v_vehicle_a, now() - interval '1 day', now() - interval '20 hours', 4, 'concluida'
  where not exists (select 1 from public.routes where organization_id = v_org_id and code = 'RT-0001')
  returning id into v_route_a;
  if v_route_a is null then
    select id into v_route_a from public.routes where organization_id = v_org_id and code = 'RT-0001';
  end if;

  insert into public.routes (organization_id, code, driver_id, vehicle_id, started_at, ended_at, total_stops, status)
  select v_org_id, 'RT-0002', v_driver_b, v_vehicle_b, now() - interval '3 hours', null, 3, 'em_andamento'
  where not exists (select 1 from public.routes where organization_id = v_org_id and code = 'RT-0002')
  returning id into v_route_b;
  if v_route_b is null then
    select id into v_route_b from public.routes where organization_id = v_org_id and code = 'RT-0002';
  end if;

  insert into public.routes (organization_id, code, driver_id, vehicle_id, started_at, ended_at, total_stops, status)
  select v_org_id, 'RT-0003', v_driver_a, v_vehicle_a, null, null, 5, 'planejada'
  where not exists (select 1 from public.routes where organization_id = v_org_id and code = 'RT-0003')
  returning id into v_route_c;
  if v_route_c is null then
    select id into v_route_c from public.routes where organization_id = v_org_id and code = 'RT-0003';
  end if;

  -- =========================
  -- SHIPMENTS (8) — variando status
  -- =========================
  for i in 1..8 loop
    declare
      v_code text := 'SP-' || lpad(i::text, 4, '0');
      v_status text := v_statuses[i];
      v_company uuid := case when i % 2 = 0 then v_company_b else v_company_a end;
      v_pickup uuid := case when i in (1,2) then v_pickup_a when i in (3,4) then v_pickup_b else null end;
      v_route uuid := case when i in (1,2,3,4) then v_route_a when i in (5,6) then v_route_b else null end;
      v_driver uuid := case when i in (1,2,3,4) then v_driver_a when i in (5,6,7) then v_driver_b else null end;
      v_delivered timestamptz := case when v_status = 'entregue' then now() - interval '12 hours' else null end;
      v_new_id uuid;
    begin
      insert into public.shipments (
        organization_id, company_id, pickup_id, code, recipient_name, recipient_phone, recipient_email,
        destination_address, dimensions_json, weight_kg, declared_value, status, sla_deadline, delivered_at,
        driver_id, route_id
      )
      select
        v_org_id, v_company, v_pickup, v_code,
        'Destinatario ' || i, '+551199990' || lpad(i::text, 4, '0'), 'destinatario' || i || '@spotlog.demo',
        jsonb_build_object('street','Rua Cliente '||i,'number',(100+i)::text,'city','São Paulo','state','SP','zip','04500-000'),
        jsonb_build_object('length_cm',30+i,'width_cm',20+i,'height_cm',15+i),
        (1.5 * i)::numeric, (250.0 * i)::numeric,
        v_status, now() + interval '24 hours' * i, v_delivered,
        v_driver, v_route
      where not exists (select 1 from public.shipments where organization_id = v_org_id and code = v_code)
      returning id into v_new_id;

      if v_new_id is null then
        select id into v_new_id from public.shipments where organization_id = v_org_id and code = v_code;
      end if;

      v_shipment_ids := v_shipment_ids || v_new_id;

      -- Evento de criação
      if not exists (select 1 from public.tracking_events where shipment_id = v_new_id and event_type = 'criada') then
        insert into public.tracking_events (shipment_id, event_type, description, location_json, occurred_at)
        values (v_new_id, 'criada', 'Encomenda registrada no sistema',
                jsonb_build_object('city','São Paulo','state','SP'), now() - interval '1 day' * (8 - i));
      end if;

      -- Evento extra de status atual
      if v_status not in ('criada') and not exists (
        select 1 from public.tracking_events where shipment_id = v_new_id and event_type = v_status
      ) then
        insert into public.tracking_events (shipment_id, event_type, description, location_json, occurred_at)
        values (v_new_id, v_status, 'Status atualizado para ' || v_status,
                jsonb_build_object('city','São Paulo','state','SP'), now() - interval '6 hours');
      end if;
    end;
  end loop;

  -- =========================
  -- ROUTE_STOPS — preenche route_a com primeiras 4 shipments
  -- =========================
  for i in 1..4 loop
    if v_shipment_ids[i] is not null then
      if not exists (
        select 1 from public.route_stops where route_id = v_route_a and shipment_id = v_shipment_ids[i]
      ) then
        insert into public.route_stops (route_id, shipment_id, sequence, eta, arrived_at, status)
        values (v_route_a, v_shipment_ids[i], i, now() - interval '1 day' + interval '1 hour' * i,
                now() - interval '1 day' + interval '1 hour' * i + interval '15 minutes', 'visitada');
      end if;
    end if;
  end loop;

  -- Stops da route_b (em andamento)
  for i in 5..6 loop
    if v_shipment_ids[i] is not null then
      if not exists (
        select 1 from public.route_stops where route_id = v_route_b and shipment_id = v_shipment_ids[i]
      ) then
        insert into public.route_stops (route_id, shipment_id, sequence, eta, status)
        values (v_route_b, v_shipment_ids[i], i - 4, now() + interval '30 minutes' * (i-4), 'pendente');
      end if;
    end if;
  end loop;

  -- =========================
  -- OCCURRENCES (4)
  -- =========================
  insert into public.occurrences (organization_id, shipment_id, category, severity, description, status, opened_at)
  select v_org_id, v_shipment_ids[7], 'endereco_incorreto', 'media', 'Pacote devolvido por endereço incorreto', 'em_analise', now() - interval '4 hours'
  where v_shipment_ids[7] is not null
    and not exists (select 1 from public.occurrences where organization_id = v_org_id and shipment_id = v_shipment_ids[7] and description = 'Pacote devolvido por endereço incorreto');

  insert into public.occurrences (organization_id, shipment_id, category, severity, description, status, opened_at, resolved_at, resolution_notes)
  select v_org_id, v_shipment_ids[6], 'avaria', 'alta', 'Embalagem amassada na chegada', 'resolvida', now() - interval '2 days', now() - interval '1 day', 'Reembalagem e reentrega coordenadas'
  where v_shipment_ids[6] is not null
    and not exists (select 1 from public.occurrences where organization_id = v_org_id and shipment_id = v_shipment_ids[6] and description = 'Embalagem amassada na chegada');

  insert into public.occurrences (organization_id, shipment_id, category, severity, description, status, opened_at)
  select v_org_id, v_shipment_ids[8], 'extravio', 'critica', 'Pacote sem rastreio desde último hub', 'aberta', now() - interval '6 hours'
  where v_shipment_ids[8] is not null
    and not exists (select 1 from public.occurrences where organization_id = v_org_id and shipment_id = v_shipment_ids[8] and description = 'Pacote sem rastreio desde último hub');

  insert into public.occurrences (organization_id, shipment_id, category, severity, description, status, opened_at)
  select v_org_id, v_shipment_ids[3], 'atraso', 'baixa', 'Cliente reportou atraso de 1 dia', 'aberta', now() - interval '1 hour'
  where v_shipment_ids[3] is not null
    and not exists (select 1 from public.occurrences where organization_id = v_org_id and shipment_id = v_shipment_ids[3] and description = 'Cliente reportou atraso de 1 dia');

  -- =========================
  -- SUPPORT_TICKETS (3) com mensagens
  -- =========================
  insert into public.support_tickets (organization_id, company_id, protocol, subject, category, description, status, priority, shipment_id, opened_at, last_response_at)
  select v_org_id, v_company_a, 'TK-2026-0001', 'Atualização sobre entrega SP-0007', 'rastreamento', 'Cliente solicita previsão de entrega', 'em_analise', 'media', v_shipment_ids[7], now() - interval '5 hours', now() - interval '1 hour'
  where not exists (select 1 from public.support_tickets where protocol = 'TK-2026-0001')
  returning id into v_ticket_a;
  if v_ticket_a is null then
    select id into v_ticket_a from public.support_tickets where protocol = 'TK-2026-0001';
  end if;

  insert into public.support_tickets (organization_id, company_id, protocol, subject, category, description, status, priority, shipment_id, opened_at, last_response_at)
  select v_org_id, v_company_b, 'TK-2026-0002', 'Reclamação avaria SP-0006', 'avaria', 'Cliente final relatou caixa molhada', 'aberto', 'alta', v_shipment_ids[6], now() - interval '2 days', now() - interval '1 day'
  where not exists (select 1 from public.support_tickets where protocol = 'TK-2026-0002')
  returning id into v_ticket_b;
  if v_ticket_b is null then
    select id into v_ticket_b from public.support_tickets where protocol = 'TK-2026-0002';
  end if;

  insert into public.support_tickets (organization_id, company_id, protocol, subject, category, description, status, priority, opened_at, last_response_at, closed_at)
  select v_org_id, v_company_a, 'TK-2026-0003', 'Dúvida sobre faturamento mensal', 'financeiro', 'Cliente quer entender cobrança variável', 'resolvido', 'baixa', now() - interval '7 days', now() - interval '6 days', now() - interval '6 days'
  where not exists (select 1 from public.support_tickets where protocol = 'TK-2026-0003')
  returning id into v_ticket_c;
  if v_ticket_c is null then
    select id into v_ticket_c from public.support_tickets where protocol = 'TK-2026-0003';
  end if;

  -- Mensagens (2 por ticket)
  if not exists (select 1 from public.ticket_messages where ticket_id = v_ticket_a) then
    insert into public.ticket_messages (ticket_id, author_kind, body) values
      (v_ticket_a, 'cliente', 'Oi, qual a previsão de entrega da SP-0007?'),
      (v_ticket_a, 'operador', 'Estamos verificando junto ao motorista, retorno em até 1h.');
  end if;

  if not exists (select 1 from public.ticket_messages where ticket_id = v_ticket_b) then
    insert into public.ticket_messages (ticket_id, author_kind, body) values
      (v_ticket_b, 'cliente', 'Pacote SP-0006 chegou molhado, segue foto em anexo.'),
      (v_ticket_b, 'operador', 'Abrimos ocorrência de avaria — vamos coordenar reembolso/reenvio.');
  end if;

  if not exists (select 1 from public.ticket_messages where ticket_id = v_ticket_c) then
    insert into public.ticket_messages (ticket_id, author_kind, body) values
      (v_ticket_c, 'cliente', 'Não entendi a cobrança variável deste mês.'),
      (v_ticket_c, 'operador', 'Encaminhei detalhamento por e-mail e fechei o chamado.');
  end if;

  -- =========================
  -- REGULATORY_DOCUMENTS (2)
  -- =========================
  insert into public.regulatory_documents (organization_id, doc_type, title, doc_number, issuer, issued_at, expires_at, status, notes)
  select v_org_id, 'anvisa_aut', 'Autorização ANVISA — Transporte de medicamentos', 'AFE-2025-001234', 'ANVISA', current_date - interval '180 days', current_date + interval '545 days', 'vigente', 'Renovação anual'
  where not exists (select 1 from public.regulatory_documents where organization_id = v_org_id and doc_number = 'AFE-2025-001234');

  insert into public.regulatory_documents (organization_id, doc_type, title, doc_number, issuer, issued_at, expires_at, status, notes)
  select v_org_id, 'seguro_carga', 'Apólice de seguro de carga 2026', 'POL-2026-99887', 'Porto Seguro', current_date - interval '60 days', current_date + interval '305 days', 'vigente', 'Cobertura até R$ 500.000 por viagem'
  where not exists (select 1 from public.regulatory_documents where organization_id = v_org_id and doc_number = 'POL-2026-99887');

  -- =========================
  -- INVOICES (2) com 3 items cada
  -- =========================
  insert into public.invoices (organization_id, company_id, number, competence, due_date, amount, status, notes)
  select v_org_id, v_company_a, 'NF-2026-0001', date_trunc('month', current_date)::date, current_date + interval '10 days', 1850.00, 'pendente', 'Competência atual'
  where not exists (select 1 from public.invoices where organization_id = v_org_id and number = 'NF-2026-0001')
  returning id into v_invoice_a;
  if v_invoice_a is null then
    select id into v_invoice_a from public.invoices where organization_id = v_org_id and number = 'NF-2026-0001';
  end if;

  insert into public.invoices (organization_id, company_id, number, competence, due_date, amount, status, paid_at, notes)
  select v_org_id, v_company_b, 'NF-2026-0002', (date_trunc('month', current_date) - interval '1 month')::date, current_date - interval '5 days', 2400.00, 'paga', now() - interval '3 days', 'Mês anterior'
  where not exists (select 1 from public.invoices where organization_id = v_org_id and number = 'NF-2026-0002')
  returning id into v_invoice_b;
  if v_invoice_b is null then
    select id into v_invoice_b from public.invoices where organization_id = v_org_id and number = 'NF-2026-0002';
  end if;

  -- Items da invoice A (3)
  if not exists (select 1 from public.invoice_items where invoice_id = v_invoice_a) then
    insert into public.invoice_items (invoice_id, shipment_id, description, quantity, unit_price, total) values
      (v_invoice_a, v_shipment_ids[1], 'Frete SP-0001 — São Paulo capital', 1, 350.00, 350.00),
      (v_invoice_a, v_shipment_ids[2], 'Frete SP-0002 — São Paulo capital', 1, 600.00, 600.00),
      (v_invoice_a, null, 'Taxa de coleta avulsa', 3, 300.00, 900.00);
  end if;

  -- Items da invoice B (3)
  if not exists (select 1 from public.invoice_items where invoice_id = v_invoice_b) then
    insert into public.invoice_items (invoice_id, shipment_id, description, quantity, unit_price, total) values
      (v_invoice_b, v_shipment_ids[3], 'Frete SP-0003 — Grande SP', 1, 800.00, 800.00),
      (v_invoice_b, v_shipment_ids[4], 'Frete SP-0004 — Grande SP', 1, 800.00, 800.00),
      (v_invoice_b, null, 'Adicional de manuseio', 2, 400.00, 800.00);
  end if;

  raise notice 'SEED operacional Spotlog concluído para org %', v_org_id;
end $$;
