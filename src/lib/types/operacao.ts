/**
 * Tipos do módulo operacional (frota, remessas, rotas, ocorrências, SAC, financeiro).
 * Espelha o schema das migrations 002_operational_*.
 */

export type ShipmentStatus =
  | "criada"
  | "coletada"
  | "triagem"
  | "em_rota"
  | "saiu_entrega"
  | "entregue"
  | "devolvida"
  | "extraviada";

export type RouteStatus =
  | "planejada"
  | "em_andamento"
  | "concluida"
  | "cancelada";

export type RouteStopStatus = "pendente" | "visitada" | "falhou";

export type VehicleStatus = "disponivel" | "em_uso" | "manutencao";
export type VehicleType = "moto" | "van" | "utilitario" | "truck";

export type DriverStatus = "ativo" | "inativo" | "suspenso";

export type OccurrenceCategory =
  | "avaria"
  | "extravio"
  | "atraso"
  | "recusa"
  | "endereco_incorreto"
  | "outro";

export type OccurrenceSeverity = "baixa" | "media" | "alta" | "critica";

export type OccurrenceStatus =
  | "aberta"
  | "em_analise"
  | "resolvida"
  | "cancelada";

export type TicketStatus =
  | "aberto"
  | "em_analise"
  | "aguardando_cliente"
  | "resolvido"
  | "fechado";

export type TicketPriority = "baixa" | "media" | "alta" | "urgente";

export type InvoiceStatus = "pendente" | "paga" | "vencida" | "cancelada";

export type PickupStatus =
  | "solicitada"
  | "agendada"
  | "em_rota"
  | "coletada"
  | "cancelada";

export type AddressJson = {
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  district?: string;
  city?: string;
  state?: string;
  uf?: string;
  reference?: string;
} | null;

export type Vehicle = {
  id: string;
  organization_id: string;
  plate: string;
  brand: string | null;
  model: string | null;
  year: number | null;
  type: VehicleType | null;
  capacity_kg: number | null;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
};

export type Driver = {
  id: string;
  organization_id: string;
  full_name: string;
  cpf: string | null;
  cnh_numero: string | null;
  cnh_validade: string | null;
  phone: string | null;
  email: string | null;
  status: DriverStatus;
  photo_url: string | null;
  vehicle_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Shipment = {
  id: string;
  organization_id: string;
  company_id: string;
  pickup_id: string | null;
  code: string;
  recipient_name: string | null;
  recipient_phone: string | null;
  recipient_email: string | null;
  destination_address: AddressJson;
  dimensions_json: Record<string, unknown> | null;
  weight_kg: number | null;
  declared_value: number | null;
  status: ShipmentStatus;
  sla_deadline: string | null;
  delivered_at: string | null;
  signature_url: string | null;
  photo_proof_url: string | null;
  driver_id: string | null;
  route_id: string | null;
  created_at: string;
  updated_at: string;
};

export type Route = {
  id: string;
  organization_id: string;
  code: string | null;
  driver_id: string | null;
  vehicle_id: string | null;
  started_at: string | null;
  ended_at: string | null;
  total_stops: number | null;
  status: RouteStatus;
  created_at: string;
  updated_at: string;
};

export type RouteStop = {
  id: string;
  route_id: string;
  shipment_id: string;
  sequence: number;
  eta: string | null;
  arrived_at: string | null;
  status: RouteStopStatus;
};

export type TrackingEvent = {
  id: string;
  shipment_id: string;
  event_type: string;
  description: string | null;
  location_json: Record<string, unknown> | null;
  occurred_at: string;
  created_by: string | null;
  created_at: string;
};

export type Occurrence = {
  id: string;
  organization_id: string;
  shipment_id: string | null;
  category: OccurrenceCategory;
  severity: OccurrenceSeverity;
  description: string | null;
  status: OccurrenceStatus;
  resolution_notes: string | null;
  opened_at: string;
  resolved_at: string | null;
  assigned_to: string | null;
  created_at: string;
};

export type SupportTicket = {
  id: string;
  organization_id: string;
  company_id: string | null;
  protocol: string;
  subject: string;
  category: string | null;
  description: string | null;
  status: TicketStatus;
  priority: TicketPriority;
  shipment_id: string | null;
  assigned_to: string | null;
  opened_at: string;
  last_response_at: string | null;
  closed_at: string | null;
  created_at: string;
};

export type TicketMessage = {
  id: string;
  ticket_id: string;
  author_user_id: string | null;
  author_kind: "cliente" | "operador" | "sistema";
  body: string;
  attachments_json: Record<string, unknown> | null;
  created_at: string;
};

export type Invoice = {
  id: string;
  organization_id: string;
  company_id: string;
  number: string;
  competence: string | null;
  due_date: string | null;
  amount: number;
  paid_at: string | null;
  status: InvoiceStatus;
  pdf_url: string | null;
  notes: string | null;
  created_at: string;
};
