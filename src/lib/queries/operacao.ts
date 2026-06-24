import { createClient } from "@/lib/supabase/server";
import type {
  Driver,
  Invoice,
  Occurrence,
  OccurrenceSeverity,
  OccurrenceStatus,
  Route,
  RouteStop,
  Shipment,
  ShipmentStatus,
  TrackingEvent,
  Vehicle,
} from "@/lib/types/operacao";

// ---------- helpers RPC -----------
type SupaClient = Awaited<ReturnType<typeof createClient>>;

async function rpcList<T>(
  supabase: SupaClient,
  fn: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    console.error(`[rpcList] ${fn} failed`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

// ---------- Dashboard operacional ----------
export async function getOperacaoKpis(orgId: string) {
  const supabase = await createClient();

  const [shipmentsRaw, occurrencesRaw, routesRaw, driversRaw] = await Promise.all([
    rpcList<Shipment>(supabase, "op_list_shipments", { p_org: orgId, p_limit: 500 }),
    rpcList<Occurrence>(supabase, "op_list_occurrences", { p_org: orgId }),
    rpcList<Route>(supabase, "op_list_routes", { p_org: orgId }),
    rpcList<Driver>(supabase, "op_list_drivers", { p_org: orgId }),
  ]);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const shipmentsHoje = shipmentsRaw.filter(
    (s) => s.created_at && new Date(s.created_at) >= todayStart,
  ).length;
  const emRota = shipmentsRaw.filter((s) =>
    ["em_rota", "saiu_entrega"].includes(s.status as string),
  ).length;
  const entregues = shipmentsRaw.filter((s) => s.status === "entregue").length;
  const devolvidas = shipmentsRaw.filter((s) =>
    ["devolvida", "extraviada"].includes(s.status as string),
  ).length;
  const ocorrenciasAbertas = occurrencesRaw.filter((o) =>
    ["aberta", "em_analise"].includes(o.status as string),
  ).length;
  const routesEmAndamento = routesRaw.filter((r) => r.status === "em_andamento")
    .length;
  const driversAtivos = driversRaw.filter((d) => d.status === "ativo").length;

  return {
    shipmentsHoje,
    emRota,
    entregues,
    devolvidas,
    ocorrenciasAbertas,
    routesEmAndamento,
    driversAtivos,
  };
}

export async function getProximasRotas(orgId: string) {
  const supabase = await createClient();
  const routes = await rpcList<Route>(supabase, "op_list_routes", {
    p_org: orgId,
  });
  return routes
    .filter((r) => ["planejada", "em_andamento"].includes(r.status as string))
    .slice(0, 3)
    .map((r) => ({ ...r, driver: null, vehicle: null })) as Array<
    Route & {
      driver: { full_name: string } | null;
      vehicle: { plate: string; model: string | null } | null;
    }
  >;
}

export async function getUltimasOcorrencias(orgId: string) {
  const supabase = await createClient();
  const rows = await rpcList<Occurrence>(supabase, "op_list_occurrences", {
    p_org: orgId,
  });
  const severityOrder: Record<OccurrenceSeverity, number> = {
    critica: 0,
    alta: 1,
    media: 2,
    baixa: 3,
  };
  const enriched = rows
    .slice(0, 4)
    .map((o) => ({ ...o, shipment: null })) as Array<
    Occurrence & { shipment: { code: string } | null }
  >;
  return enriched.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity],
  );
}

// ---------- Remessas ----------
export type ShipmentRow = Shipment & {
  driver: { full_name: string } | null;
};

export async function listShipments(
  orgId: string,
  filters: {
    status?: ShipmentStatus | "";
    q?: string;
    limit?: number;
    offset?: number;
  } = {},
) {
  const supabase = await createClient();
  const limit = filters.limit ?? 50;
  const offset = filters.offset ?? 0;
  const rows = await rpcList<Shipment>(supabase, "op_list_shipments", {
    p_org: orgId,
    p_status: filters.status || null,
    p_limit: limit,
    p_offset: offset,
  });
  let filtered = rows;
  if (filters.q && filters.q.trim()) {
    const q = filters.q.trim().toLowerCase();
    filtered = rows.filter(
      (r) =>
        (r.code ?? "").toLowerCase().includes(q) ||
        (r.recipient_name ?? "").toLowerCase().includes(q),
    );
  }
  return {
    rows: filtered.map((r) => ({ ...r, driver: null })) as ShipmentRow[],
    total: filtered.length,
  };
}

export async function getShipmentDetail(orgId: string, id: string) {
  const supabase = await createClient();
  // Buscar via lista RPC, filtrar pelo id
  const rows = await rpcList<Shipment>(supabase, "op_list_shipments", {
    p_org: orgId,
    p_limit: 500,
  });
  const shipment = rows.find((r) => r.id === id);
  if (!shipment) return null;
  return {
    ...shipment,
    driver: null,
    route: null,
    pickup: null,
  } as Shipment & {
    driver: { id: string; full_name: string; phone: string | null } | null;
    route: { id: string; code: string | null; status: string } | null;
    pickup: { id: string; code: string } | null;
  };
}

export async function getShipmentTrackingEvents(shipmentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tracking_events")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("occurred_at", { ascending: true });
  return (data ?? []) as TrackingEvent[];
}

export async function getShipmentOccurrences(shipmentId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("occurrences")
    .select("*")
    .eq("shipment_id", shipmentId)
    .order("opened_at", { ascending: false });
  return (data ?? []) as Occurrence[];
}

// ---------- Rotas ----------
export async function listRoutes(
  orgId: string,
  filters: { status?: string } = {},
) {
  const supabase = await createClient();
  const rows = await rpcList<Route>(supabase, "op_list_routes", {
    p_org: orgId,
    p_status: filters.status || null,
  });
  return rows.map((r) => ({
    ...r,
    driver: null,
    vehicle: null,
  })) as Array<
    Route & {
      driver: { full_name: string } | null;
      vehicle: { plate: string; model: string | null } | null;
    }
  >;
}

export async function getRouteDetail(orgId: string, id: string) {
  const supabase = await createClient();
  const routes = await rpcList<Route>(supabase, "op_list_routes", {
    p_org: orgId,
  });
  const route = routes.find((r) => r.id === id);
  if (!route) return null;

  const { data: stops } = await supabase
    .from("route_stops")
    .select("*")
    .eq("route_id", id)
    .order("sequence", { ascending: true });

  return {
    route: {
      ...route,
      driver: null,
      vehicle: null,
    } as Route & {
      driver: { id: string; full_name: string; phone: string | null } | null;
      vehicle: {
        id: string;
        plate: string;
        model: string | null;
        type: string | null;
      } | null;
    },
    stops: (stops ?? []).map((s) => ({
      ...(s as RouteStop),
      shipment: null,
    })) as Array<
      RouteStop & {
        shipment: {
          id: string;
          code: string;
          recipient_name: string | null;
          destination_address: Record<string, unknown> | null;
        } | null;
      }
    >,
  };
}

// ---------- Motoristas / Veículos ----------
export async function listDrivers(orgId: string) {
  const supabase = await createClient();
  const rows = await rpcList<Driver>(supabase, "op_list_drivers", {
    p_org: orgId,
  });
  return rows.map((d) => ({
    ...d,
    vehicle: null,
  })) as Array<
    Driver & { vehicle: { plate: string; model: string | null } | null }
  >;
}

export async function listVehicles(orgId: string) {
  const supabase = await createClient();
  const rows = await rpcList<Vehicle>(supabase, "op_list_vehicles", {
    p_org: orgId,
  });
  const drivers = await rpcList<Driver>(supabase, "op_list_drivers", {
    p_org: orgId,
  });
  const driverByVehicle: Record<string, string> = {};
  for (const d of drivers) {
    if (d.vehicle_id) driverByVehicle[d.vehicle_id] = d.full_name;
  }
  return rows.map((v) => ({
    ...v,
    driver_name: driverByVehicle[v.id] ?? null,
  }));
}

// ---------- Ocorrências ----------
export async function listOccurrences(
  orgId: string,
  filters: { status?: OccurrenceStatus | ""; severity?: OccurrenceSeverity | "" } = {},
) {
  const supabase = await createClient();
  const rows = await rpcList<Occurrence>(supabase, "op_list_occurrences", {
    p_org: orgId,
    p_status: filters.status || null,
  });
  const filtered = filters.severity
    ? rows.filter((r) => r.severity === filters.severity)
    : rows;
  return filtered.map((o) => ({
    ...o,
    shipment: null,
  })) as Array<
    Occurrence & { shipment: { id: string; code: string } | null }
  >;
}

// ---------- Invoices summary ----------
export type InvoiceSummary = Invoice;
