-- =============================================================================
-- Spotlog Migration 002 — Módulos operacionais
-- Frota, operação, ocorrências/SAC, compliance & financeiro
-- =============================================================================

-- =========================
-- 1. VEHICLES
-- =========================
create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plate text not null,
  brand text,
  model text,
  year int,
  type text check (type in ('moto','van','utilitario','truck')),
  capacity_kg numeric,
  status text not null default 'disponivel' check (status in ('disponivel','em_uso','manutencao')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  constraint vehicles_plate_org_unique unique (organization_id, plate)
);

create index if not exists vehicles_organization_id_idx on public.vehicles(organization_id);
create index if not exists vehicles_status_idx on public.vehicles(status);

alter table public.vehicles enable row level security;
create policy "vehicles_select" on public.vehicles for select using (public.is_org_member(organization_id));
create policy "vehicles_insert" on public.vehicles for insert with check (public.is_org_member(organization_id));
create policy "vehicles_update" on public.vehicles for update using (public.is_org_member(organization_id));
create policy "vehicles_delete" on public.vehicles for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger vehicles_set_updated_at before update on public.vehicles
  for each row execute function public.set_updated_at();


-- =========================
-- 2. DRIVERS
-- =========================
create table if not exists public.drivers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  cpf text,
  cnh_numero text,
  cnh_validade date,
  phone text,
  email text,
  status text not null default 'ativo' check (status in ('ativo','inativo','suspenso')),
  photo_url text,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists drivers_organization_id_idx on public.drivers(organization_id);
create index if not exists drivers_vehicle_id_idx on public.drivers(vehicle_id);
create index if not exists drivers_status_idx on public.drivers(status);

alter table public.drivers enable row level security;
create policy "drivers_select" on public.drivers for select using (public.is_org_member(organization_id));
create policy "drivers_insert" on public.drivers for insert with check (public.is_org_member(organization_id));
create policy "drivers_update" on public.drivers for update using (public.is_org_member(organization_id));
create policy "drivers_delete" on public.drivers for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger drivers_set_updated_at before update on public.drivers
  for each row execute function public.set_updated_at();


-- =========================
-- 3. PICKUPS
-- =========================
create table if not exists public.pickups (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  code text not null,
  address_json jsonb,
  scheduled_window_start timestamptz,
  scheduled_window_end timestamptz,
  status text not null default 'solicitada' check (status in ('solicitada','agendada','em_rota','coletada','cancelada')),
  volumes int,
  weight_kg numeric,
  notes text,
  driver_id uuid references public.drivers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  constraint pickups_code_org_unique unique (organization_id, code)
);

create index if not exists pickups_organization_id_idx on public.pickups(organization_id);
create index if not exists pickups_company_id_idx on public.pickups(company_id);
create index if not exists pickups_driver_id_idx on public.pickups(driver_id);
create index if not exists pickups_status_idx on public.pickups(status);
create index if not exists pickups_code_idx on public.pickups(code);

alter table public.pickups enable row level security;
create policy "pickups_select" on public.pickups for select using (public.is_org_member(organization_id));
create policy "pickups_insert" on public.pickups for insert with check (public.is_org_member(organization_id));
create policy "pickups_update" on public.pickups for update using (public.is_org_member(organization_id));
create policy "pickups_delete" on public.pickups for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger pickups_set_updated_at before update on public.pickups
  for each row execute function public.set_updated_at();


-- =========================
-- 4. ROUTES
-- =========================
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  code text,
  driver_id uuid references public.drivers(id) on delete set null,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  started_at timestamptz,
  ended_at timestamptz,
  total_stops int default 0,
  status text not null default 'planejada' check (status in ('planejada','em_andamento','concluida','cancelada')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists routes_organization_id_idx on public.routes(organization_id);
create index if not exists routes_driver_id_idx on public.routes(driver_id);
create index if not exists routes_vehicle_id_idx on public.routes(vehicle_id);
create index if not exists routes_status_idx on public.routes(status);
create index if not exists routes_code_idx on public.routes(code);

alter table public.routes enable row level security;
create policy "routes_select" on public.routes for select using (public.is_org_member(organization_id));
create policy "routes_insert" on public.routes for insert with check (public.is_org_member(organization_id));
create policy "routes_update" on public.routes for update using (public.is_org_member(organization_id));
create policy "routes_delete" on public.routes for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger routes_set_updated_at before update on public.routes
  for each row execute function public.set_updated_at();


-- =========================
-- 5. SHIPMENTS
-- =========================
create table if not exists public.shipments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  pickup_id uuid references public.pickups(id) on delete set null,
  code text not null,
  recipient_name text,
  recipient_phone text,
  recipient_email text,
  destination_address jsonb,
  dimensions_json jsonb,
  weight_kg numeric,
  declared_value numeric,
  status text not null default 'criada' check (status in ('criada','coletada','triagem','em_rota','saiu_entrega','entregue','devolvida','extraviada')),
  sla_deadline timestamptz,
  delivered_at timestamptz,
  signature_url text,
  photo_proof_url text,
  driver_id uuid references public.drivers(id) on delete set null,
  route_id uuid references public.routes(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  constraint shipments_code_org_unique unique (organization_id, code)
);

create index if not exists shipments_organization_id_idx on public.shipments(organization_id);
create index if not exists shipments_company_id_idx on public.shipments(company_id);
create index if not exists shipments_pickup_id_idx on public.shipments(pickup_id);
create index if not exists shipments_driver_id_idx on public.shipments(driver_id);
create index if not exists shipments_route_id_idx on public.shipments(route_id);
create index if not exists shipments_status_idx on public.shipments(status);
create index if not exists shipments_code_idx on public.shipments(code);
create index if not exists shipments_sla_deadline_idx on public.shipments(sla_deadline);

alter table public.shipments enable row level security;
create policy "shipments_select" on public.shipments for select using (public.is_org_member(organization_id));
create policy "shipments_insert" on public.shipments for insert with check (public.is_org_member(organization_id));
create policy "shipments_update" on public.shipments for update using (public.is_org_member(organization_id));
create policy "shipments_delete" on public.shipments for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger shipments_set_updated_at before update on public.shipments
  for each row execute function public.set_updated_at();


-- =========================
-- 6. ROUTE_STOPS (child of routes)
-- =========================
create table if not exists public.route_stops (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  sequence int not null,
  eta timestamptz,
  arrived_at timestamptz,
  status text not null default 'pendente' check (status in ('pendente','visitada','falhou')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists route_stops_route_id_idx on public.route_stops(route_id);
create index if not exists route_stops_shipment_id_idx on public.route_stops(shipment_id);
create index if not exists route_stops_status_idx on public.route_stops(status);

alter table public.route_stops enable row level security;
create policy "route_stops_select" on public.route_stops for select using (
  exists (select 1 from public.routes r where r.id = route_stops.route_id and public.is_org_member(r.organization_id))
);
create policy "route_stops_insert" on public.route_stops for insert with check (
  exists (select 1 from public.routes r where r.id = route_stops.route_id and public.is_org_member(r.organization_id))
);
create policy "route_stops_update" on public.route_stops for update using (
  exists (select 1 from public.routes r where r.id = route_stops.route_id and public.is_org_member(r.organization_id))
);
create policy "route_stops_delete" on public.route_stops for delete using (
  exists (select 1 from public.routes r where r.id = route_stops.route_id and public.has_org_role(r.organization_id, array['owner','admin','manager']::org_role[]))
);

create trigger route_stops_set_updated_at before update on public.route_stops
  for each row execute function public.set_updated_at();


-- =========================
-- 7. TRACKING_EVENTS (child of shipments)
-- =========================
create table if not exists public.tracking_events (
  id uuid primary key default gen_random_uuid(),
  shipment_id uuid not null references public.shipments(id) on delete cascade,
  event_type text not null,
  description text,
  location_json jsonb,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index if not exists tracking_events_shipment_id_idx on public.tracking_events(shipment_id);
create index if not exists tracking_events_occurred_at_idx on public.tracking_events(occurred_at);
create index if not exists tracking_events_event_type_idx on public.tracking_events(event_type);

alter table public.tracking_events enable row level security;
create policy "tracking_events_select" on public.tracking_events for select using (
  exists (select 1 from public.shipments s where s.id = tracking_events.shipment_id and public.is_org_member(s.organization_id))
);
create policy "tracking_events_insert" on public.tracking_events for insert with check (
  exists (select 1 from public.shipments s where s.id = tracking_events.shipment_id and public.is_org_member(s.organization_id))
);
create policy "tracking_events_update" on public.tracking_events for update using (
  exists (select 1 from public.shipments s where s.id = tracking_events.shipment_id and public.is_org_member(s.organization_id))
);
create policy "tracking_events_delete" on public.tracking_events for delete using (
  exists (select 1 from public.shipments s where s.id = tracking_events.shipment_id and public.has_org_role(s.organization_id, array['owner','admin','manager']::org_role[]))
);


-- =========================
-- 8. OCCURRENCES
-- =========================
create table if not exists public.occurrences (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  category text not null check (category in ('avaria','extravio','atraso','recusa','endereco_incorreto','outro')),
  severity text not null default 'media' check (severity in ('baixa','media','alta','critica')),
  description text,
  status text not null default 'aberta' check (status in ('aberta','em_analise','resolvida','cancelada')),
  resolution_notes text,
  opened_at timestamptz not null default now(),
  resolved_at timestamptz,
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists occurrences_organization_id_idx on public.occurrences(organization_id);
create index if not exists occurrences_shipment_id_idx on public.occurrences(shipment_id);
create index if not exists occurrences_status_idx on public.occurrences(status);
create index if not exists occurrences_severity_idx on public.occurrences(severity);
create index if not exists occurrences_assigned_to_idx on public.occurrences(assigned_to);

alter table public.occurrences enable row level security;
create policy "occurrences_select" on public.occurrences for select using (public.is_org_member(organization_id));
create policy "occurrences_insert" on public.occurrences for insert with check (public.is_org_member(organization_id));
create policy "occurrences_update" on public.occurrences for update using (public.is_org_member(organization_id));
create policy "occurrences_delete" on public.occurrences for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger occurrences_set_updated_at before update on public.occurrences
  for each row execute function public.set_updated_at();


-- =========================
-- 9. SUPPORT_TICKETS
-- =========================
create table if not exists public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid references public.companies(id) on delete set null,
  protocol text not null unique,
  subject text not null,
  category text,
  description text,
  status text not null default 'aberto' check (status in ('aberto','em_analise','aguardando_cliente','resolvido','fechado')),
  priority text not null default 'media' check (priority in ('baixa','media','alta','urgente')),
  shipment_id uuid references public.shipments(id) on delete set null,
  assigned_to uuid references auth.users(id),
  opened_at timestamptz not null default now(),
  last_response_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists support_tickets_organization_id_idx on public.support_tickets(organization_id);
create index if not exists support_tickets_company_id_idx on public.support_tickets(company_id);
create index if not exists support_tickets_shipment_id_idx on public.support_tickets(shipment_id);
create index if not exists support_tickets_status_idx on public.support_tickets(status);
create index if not exists support_tickets_priority_idx on public.support_tickets(priority);
create index if not exists support_tickets_protocol_idx on public.support_tickets(protocol);
create index if not exists support_tickets_assigned_to_idx on public.support_tickets(assigned_to);

alter table public.support_tickets enable row level security;
create policy "support_tickets_select" on public.support_tickets for select using (public.is_org_member(organization_id));
create policy "support_tickets_insert" on public.support_tickets for insert with check (public.is_org_member(organization_id));
create policy "support_tickets_update" on public.support_tickets for update using (public.is_org_member(organization_id));
create policy "support_tickets_delete" on public.support_tickets for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger support_tickets_set_updated_at before update on public.support_tickets
  for each row execute function public.set_updated_at();


-- =========================
-- 10. TICKET_MESSAGES (child of support_tickets)
-- =========================
create table if not exists public.ticket_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.support_tickets(id) on delete cascade,
  author_user_id uuid references auth.users(id),
  author_kind text not null check (author_kind in ('cliente','operador','sistema')),
  body text not null,
  attachments_json jsonb,
  created_at timestamptz not null default now()
);

create index if not exists ticket_messages_ticket_id_idx on public.ticket_messages(ticket_id);
create index if not exists ticket_messages_created_at_idx on public.ticket_messages(created_at);

alter table public.ticket_messages enable row level security;
create policy "ticket_messages_select" on public.ticket_messages for select using (
  exists (select 1 from public.support_tickets t where t.id = ticket_messages.ticket_id and public.is_org_member(t.organization_id))
);
create policy "ticket_messages_insert" on public.ticket_messages for insert with check (
  exists (select 1 from public.support_tickets t where t.id = ticket_messages.ticket_id and public.is_org_member(t.organization_id))
);
create policy "ticket_messages_update" on public.ticket_messages for update using (
  exists (select 1 from public.support_tickets t where t.id = ticket_messages.ticket_id and public.is_org_member(t.organization_id))
);
create policy "ticket_messages_delete" on public.ticket_messages for delete using (
  exists (select 1 from public.support_tickets t where t.id = ticket_messages.ticket_id and public.has_org_role(t.organization_id, array['owner','admin','manager']::org_role[]))
);


-- =========================
-- 11. REGULATORY_DOCUMENTS
-- =========================
create table if not exists public.regulatory_documents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  doc_type text not null check (doc_type in ('anvisa_aut','contrato_cliente','sat_motorista','seguro_carga','outro')),
  title text not null,
  doc_number text,
  issuer text,
  issued_at date,
  expires_at date,
  file_url text,
  status text not null default 'vigente' check (status in ('vigente','vencido','em_renovacao')),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

create index if not exists regulatory_documents_organization_id_idx on public.regulatory_documents(organization_id);
create index if not exists regulatory_documents_doc_type_idx on public.regulatory_documents(doc_type);
create index if not exists regulatory_documents_status_idx on public.regulatory_documents(status);
create index if not exists regulatory_documents_expires_at_idx on public.regulatory_documents(expires_at);

alter table public.regulatory_documents enable row level security;
create policy "regulatory_documents_select" on public.regulatory_documents for select using (public.is_org_member(organization_id));
create policy "regulatory_documents_insert" on public.regulatory_documents for insert with check (public.is_org_member(organization_id));
create policy "regulatory_documents_update" on public.regulatory_documents for update using (public.is_org_member(organization_id));
create policy "regulatory_documents_delete" on public.regulatory_documents for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger regulatory_documents_set_updated_at before update on public.regulatory_documents
  for each row execute function public.set_updated_at();


-- =========================
-- 12. INVOICES
-- =========================
create table if not exists public.invoices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete restrict,
  number text not null,
  competence date,
  due_date date,
  amount numeric not null default 0,
  paid_at timestamptz,
  status text not null default 'pendente' check (status in ('pendente','paga','vencida','cancelada')),
  pdf_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  constraint invoices_number_org_unique unique (organization_id, number)
);

create index if not exists invoices_organization_id_idx on public.invoices(organization_id);
create index if not exists invoices_company_id_idx on public.invoices(company_id);
create index if not exists invoices_status_idx on public.invoices(status);
create index if not exists invoices_due_date_idx on public.invoices(due_date);

alter table public.invoices enable row level security;
create policy "invoices_select" on public.invoices for select using (public.is_org_member(organization_id));
create policy "invoices_insert" on public.invoices for insert with check (public.is_org_member(organization_id));
create policy "invoices_update" on public.invoices for update using (public.is_org_member(organization_id));
create policy "invoices_delete" on public.invoices for delete using (public.has_org_role(organization_id, array['owner','admin','manager']::org_role[]));

create trigger invoices_set_updated_at before update on public.invoices
  for each row execute function public.set_updated_at();


-- =========================
-- 13. INVOICE_ITEMS (child of invoices)
-- =========================
create table if not exists public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  shipment_id uuid references public.shipments(id) on delete set null,
  description text not null,
  quantity int not null default 1,
  unit_price numeric not null default 0,
  total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists invoice_items_invoice_id_idx on public.invoice_items(invoice_id);
create index if not exists invoice_items_shipment_id_idx on public.invoice_items(shipment_id);

alter table public.invoice_items enable row level security;
create policy "invoice_items_select" on public.invoice_items for select using (
  exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and public.is_org_member(i.organization_id))
);
create policy "invoice_items_insert" on public.invoice_items for insert with check (
  exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and public.is_org_member(i.organization_id))
);
create policy "invoice_items_update" on public.invoice_items for update using (
  exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and public.is_org_member(i.organization_id))
);
create policy "invoice_items_delete" on public.invoice_items for delete using (
  exists (select 1 from public.invoices i where i.id = invoice_items.invoice_id and public.has_org_role(i.organization_id, array['owner','admin','manager']::org_role[]))
);

create trigger invoice_items_set_updated_at before update on public.invoice_items
  for each row execute function public.set_updated_at();
