/**
 * Queries do módulo Compliance (documentos regulatórios + faturas).
 * Usa RPCs op_* pra bypass do PostgREST schema cache (PGRST205).
 */
import { createClient } from "@/lib/supabase/server";
import type { Invoice, InvoiceStatus } from "@/lib/types/operacao";

type SupaClient = Awaited<ReturnType<typeof createClient>>;

async function rpcList<T>(
  supabase: SupaClient,
  fn: string,
  params: Record<string, unknown>,
): Promise<T[]> {
  const { data, error } = await supabase.rpc(fn, params);
  if (error) {
    console.error(`[compliance.rpcList] ${fn}`, error.message);
    return [];
  }
  return (data ?? []) as T[];
}

export type RegulatoryDocType =
  | "anvisa_aut"
  | "contrato_cliente"
  | "sat_motorista"
  | "seguro_carga"
  | "outro";

export type RegulatoryDocStatus = "vigente" | "vencido" | "em_renovacao";

export type RegulatoryDocument = {
  id: string;
  organization_id: string;
  doc_type: RegulatoryDocType;
  title: string;
  doc_number: string | null;
  issuer: string | null;
  issued_at: string | null;
  expires_at: string | null;
  file_url: string | null;
  status: RegulatoryDocStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type ComplianceKpis = {
  vigentes: number;
  vencidos: number;
  emRenovacao: number;
  proximosVencimentos30d: number;
};

export type FinanceiroKpis = {
  faturadoMes: number;
  recebidoMes: number;
  emAberto: number;
  vencido: number;
};

export type InvoiceWithCompany = Invoice & {
  companies: { id: string; name: string } | null;
};

export type InvoiceItem = {
  id: string;
  invoice_id: string;
  shipment_id: string | null;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  shipments?: { id: string; code: string } | null;
};

const DIAS_30_MS = 1000 * 60 * 60 * 24 * 30;

export async function getComplianceKpis(
  organizationId: string,
): Promise<ComplianceKpis> {
  const supabase = await createClient();
  const list = await rpcList<{
    status: RegulatoryDocStatus;
    expires_at: string | null;
  }>(supabase, "op_list_documents", { p_org: organizationId });

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const horizonte = hoje.getTime() + DIAS_30_MS;

  return {
    vigentes: list.filter((d) => d.status === "vigente").length,
    vencidos: list.filter((d) => d.status === "vencido").length,
    emRenovacao: list.filter((d) => d.status === "em_renovacao").length,
    proximosVencimentos30d: list.filter((d) => {
      if (!d.expires_at) return false;
      const t = new Date(d.expires_at).getTime();
      return t >= hoje.getTime() && t <= horizonte;
    }).length,
  };
}

export async function listRegulatoryDocuments(
  organizationId: string,
  filters: {
    docType?: RegulatoryDocType | "todos";
    status?: RegulatoryDocStatus | "todos";
  } = {},
): Promise<RegulatoryDocument[]> {
  const supabase = await createClient();
  const rows = await rpcList<RegulatoryDocument>(supabase, "op_list_documents", {
    p_org: organizationId,
  });
  let filtered = rows;
  if (filters.docType && filters.docType !== "todos") {
    filtered = filtered.filter((d) => d.doc_type === filters.docType);
  }
  if (filters.status && filters.status !== "todos") {
    filtered = filtered.filter((d) => d.status === filters.status);
  }
  return filtered.sort((a, b) => {
    const av = a.expires_at ? new Date(a.expires_at).getTime() : Infinity;
    const bv = b.expires_at ? new Date(b.expires_at).getTime() : Infinity;
    return av - bv;
  });
}

export async function getRegulatoryDocument(
  organizationId: string,
  id: string,
): Promise<RegulatoryDocument | null> {
  const supabase = await createClient();
  const rows = await rpcList<RegulatoryDocument>(supabase, "op_list_documents", {
    p_org: organizationId,
  });
  return rows.find((d) => d.id === id) ?? null;
}

export async function hasAnvisaDocs(
  organizationId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const rows = await rpcList<RegulatoryDocument>(supabase, "op_list_documents", {
    p_org: organizationId,
  });
  return rows.some((d) => d.doc_type === "anvisa_aut");
}

export async function getFinanceiroKpis(
  organizationId: string,
): Promise<FinanceiroKpis> {
  const supabase = await createClient();
  const inicioMes = new Date();
  inicioMes.setDate(1);
  inicioMes.setHours(0, 0, 0, 0);
  const inicioMesIso = inicioMes.toISOString();
  const hojeIso = new Date().toISOString().slice(0, 10);

  const list = await rpcList<{
    amount: number;
    status: InvoiceStatus;
    paid_at: string | null;
    due_date: string | null;
    created_at: string;
  }>(supabase, "op_list_invoices", { p_org: organizationId });

  const faturadoMes = list
    .filter((i) => i.created_at >= inicioMesIso)
    .reduce((acc, i) => acc + Number(i.amount ?? 0), 0);

  const recebidoMes = list
    .filter(
      (i) => i.status === "paga" && i.paid_at && i.paid_at >= inicioMesIso,
    )
    .reduce((acc, i) => acc + Number(i.amount ?? 0), 0);

  const emAberto = list
    .filter((i) => i.status === "pendente")
    .reduce((acc, i) => acc + Number(i.amount ?? 0), 0);

  const vencido = list
    .filter(
      (i) =>
        i.status === "vencida" ||
        (i.status === "pendente" && i.due_date && i.due_date < hojeIso),
    )
    .reduce((acc, i) => acc + Number(i.amount ?? 0), 0);

  return { faturadoMes, recebidoMes, emAberto, vencido };
}

export async function listInvoices(
  organizationId: string,
  filters: {
    status?: InvoiceStatus | "todas";
    desde?: string | null;
    ate?: string | null;
  } = {},
): Promise<InvoiceWithCompany[]> {
  const supabase = await createClient();
  const rows = await rpcList<Invoice>(supabase, "op_list_invoices", {
    p_org: organizationId,
    p_status:
      filters.status && filters.status !== "todas" ? filters.status : null,
  });
  let filtered = rows;
  if (filters.desde) {
    filtered = filtered.filter(
      (i) => i.due_date && i.due_date >= (filters.desde as string),
    );
  }
  if (filters.ate) {
    filtered = filtered.filter(
      (i) => i.due_date && i.due_date <= (filters.ate as string),
    );
  }
  const sorted = filtered.sort((a, b) => {
    const av = a.due_date ? new Date(a.due_date).getTime() : 0;
    const bv = b.due_date ? new Date(b.due_date).getTime() : 0;
    return bv - av;
  });
  const companiesById = await getCompaniesById(
    supabase,
    sorted.map((i) => i.company_id),
  );
  return sorted.map((i) => ({
    ...i,
    companies: companiesById.get(i.company_id) ?? null,
  })) as InvoiceWithCompany[];
}

export async function getInvoice(
  organizationId: string,
  id: string,
): Promise<InvoiceWithCompany | null> {
  const supabase = await createClient();
  const rows = await rpcList<Invoice>(supabase, "op_list_invoices", {
    p_org: organizationId,
  });
  const found = rows.find((i) => i.id === id);
  if (!found) return null;
  const companiesById = await getCompaniesById(supabase, [found.company_id]);
  return {
    ...found,
    companies: companiesById.get(found.company_id) ?? null,
  } as InvoiceWithCompany;
}

async function getCompaniesById(
  supabase: Awaited<ReturnType<typeof createClient>>,
  companyIds: string[],
): Promise<Map<string, { id: string; name: string }>> {
  const uniqueIds = Array.from(new Set(companyIds.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map();
  const { data } = await supabase
    .from("companies")
    .select("id, name")
    .in("id", uniqueIds);
  const map = new Map<string, { id: string; name: string }>();
  for (const c of (data ?? []) as { id: string; name: string }[]) {
    map.set(c.id, c);
  }
  return map;
}

export async function getInvoiceItems(
  invoiceId: string,
): Promise<InvoiceItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoice_items")
    .select(
      "id, invoice_id, shipment_id, description, quantity, unit_price, total, shipments(id,code)",
    )
    .eq("invoice_id", invoiceId)
    .order("created_at", { ascending: true });
  return (data ?? []) as unknown as InvoiceItem[];
}

export async function listCompaniesForSelect(
  organizationId: string,
): Promise<Array<{ id: string; name: string }>> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id, name")
    .eq("organization_id", organizationId)
    .order("name", { ascending: true })
    .limit(500);
  return (data ?? []) as Array<{ id: string; name: string }>;
}

export async function listShipmentsForSelect(
  organizationId: string,
  companyId?: string | null,
): Promise<Array<{ id: string; code: string }>> {
  const supabase = await createClient();
  const rows = await rpcList<{
    id: string;
    code: string;
    company_id: string | null;
  }>(supabase, "op_list_shipments", {
    p_org: organizationId,
    p_limit: 200,
  });
  const filtered = companyId
    ? rows.filter((r) => r.company_id === companyId)
    : rows;
  return filtered.map((r) => ({ id: r.id, code: r.code }));
}
