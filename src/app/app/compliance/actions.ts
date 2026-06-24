"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type {
  RegulatoryDocStatus,
  RegulatoryDocType,
} from "@/lib/queries/compliance";
import type { InvoiceStatus } from "@/lib/types/operacao";

const DOC_TYPES: RegulatoryDocType[] = [
  "anvisa_aut",
  "contrato_cliente",
  "sat_motorista",
  "seguro_carga",
  "outro",
];

const DOC_STATUS: RegulatoryDocStatus[] = ["vigente", "vencido", "em_renovacao"];

function nullable(v: FormDataEntryValue | null): string | null {
  if (v === null) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

// =============== REGULATORY DOCUMENTS ===============

export async function criarDocumentoAction(formData: FormData) {
  const { org } = await requireSession();
  const title = String(formData.get("title") ?? "").trim();
  const docType = String(formData.get("doc_type") ?? "") as RegulatoryDocType;
  if (!title || !DOC_TYPES.includes(docType)) {
    throw new Error("Dados obrigatórios faltando.");
  }

  const status =
    (String(formData.get("status") ?? "vigente") as RegulatoryDocStatus) ||
    "vigente";
  if (!DOC_STATUS.includes(status)) {
    throw new Error("Status inválido.");
  }

  const supabase = await createClient();
  const { data: newId, error } = await supabase.rpc("op_create_document", {
    p_payload: {
      organization_id: org.id,
      title,
      doc_type: docType,
      doc_number: nullable(formData.get("doc_number")) ?? "",
      issuer: nullable(formData.get("issuer")) ?? "",
      issued_at: nullable(formData.get("issued_at")) ?? "",
      expires_at: nullable(formData.get("expires_at")) ?? "",
      file_url: nullable(formData.get("file_url")) ?? "",
      status,
      notes: nullable(formData.get("notes")) ?? "",
    },
  });
  if (error) throw new Error(error.message);

  revalidatePath("/app/compliance/documentos");
  revalidatePath("/app/compliance");
  if (newId) redirect(`/app/compliance/documentos/${newId}`);
  redirect("/app/compliance/documentos");
}

export async function atualizarDocumentoAction(formData: FormData) {
  const { org } = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Documento inválido.");

  const docType = String(formData.get("doc_type") ?? "") as RegulatoryDocType;
  const status = String(formData.get("status") ?? "") as RegulatoryDocStatus;
  if (!DOC_TYPES.includes(docType) || !DOC_STATUS.includes(status)) {
    throw new Error("Tipo ou status inválido.");
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("regulatory_documents")
    .update({
      title: String(formData.get("title") ?? "").trim(),
      doc_type: docType,
      doc_number: nullable(formData.get("doc_number")),
      issuer: nullable(formData.get("issuer")),
      issued_at: nullable(formData.get("issued_at")),
      expires_at: nullable(formData.get("expires_at")),
      file_url: nullable(formData.get("file_url")),
      status,
      notes: nullable(formData.get("notes")),
    })
    .eq("id", id)
    .eq("organization_id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/app/compliance/documentos/${id}`);
  revalidatePath("/app/compliance/documentos");
  revalidatePath("/app/compliance");
}

export async function excluirDocumentoAction(formData: FormData) {
  const { org } = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Documento inválido.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("regulatory_documents")
    .delete()
    .eq("id", id)
    .eq("organization_id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath("/app/compliance/documentos");
  revalidatePath("/app/compliance");
  redirect("/app/compliance/documentos");
}

// =============== INVOICES ===============

type ItemInput = {
  description: string;
  quantity: number;
  unit_price: number;
  shipment_id: string | null;
};

function parseItems(formData: FormData): ItemInput[] {
  const descs = formData.getAll("item_description");
  const qtys = formData.getAll("item_quantity");
  const prices = formData.getAll("item_unit_price");
  const shipments = formData.getAll("item_shipment_id");
  const result: ItemInput[] = [];
  const len = Math.max(descs.length, qtys.length, prices.length);
  for (let i = 0; i < len; i++) {
    const description = String(descs[i] ?? "").trim();
    if (!description) continue;
    const quantity = Math.max(1, Number(qtys[i] ?? 1) || 1);
    const unit_price = Math.max(0, Number(prices[i] ?? 0) || 0);
    const shipmentRaw = String(shipments[i] ?? "").trim();
    result.push({
      description,
      quantity,
      unit_price,
      shipment_id: shipmentRaw && shipmentRaw !== "none" ? shipmentRaw : null,
    });
  }
  return result;
}

export async function criarFaturaAction(formData: FormData) {
  const { org } = await requireSession();
  const company_id = String(formData.get("company_id") ?? "").trim();
  const number = String(formData.get("number") ?? "").trim();
  if (!company_id || !number) {
    throw new Error("Empresa e número são obrigatórios.");
  }

  const items = parseItems(formData);
  if (items.length === 0) {
    throw new Error("Adicione pelo menos um item.");
  }
  const amount = items.reduce(
    (acc, it) => acc + it.quantity * it.unit_price,
    0,
  );

  const supabase = await createClient();
  const { data: invoiceId, error: invErr } = await supabase.rpc(
    "op_create_invoice",
    {
      p_payload: {
        organization_id: org.id,
        company_id,
        number,
        competence: nullable(formData.get("competence")) ?? "",
        due_date: nullable(formData.get("due_date")) ?? "",
        amount: String(amount),
        status: "pendente",
        notes: nullable(formData.get("notes")) ?? "",
      },
    },
  );
  if (invErr) throw new Error(invErr.message);

  const rows = items.map((it) => ({
    invoice_id: invoiceId as string,
    shipment_id: it.shipment_id,
    description: it.description,
    quantity: it.quantity,
    unit_price: it.unit_price,
    total: it.quantity * it.unit_price,
  }));
  const { error: itemsErr } = await supabase
    .from("invoice_items")
    .insert(rows);
  if (itemsErr) throw new Error(itemsErr.message);

  revalidatePath("/app/compliance/financeiro");
  revalidatePath("/app/compliance");
  redirect(`/app/compliance/financeiro/${invoiceId}`);
}

export async function marcarFaturaPagaAction(formData: FormData) {
  const { org } = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Fatura inválida.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({
      status: "paga" satisfies InvoiceStatus,
      paid_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/app/compliance/financeiro/${id}`);
  revalidatePath("/app/compliance/financeiro");
  revalidatePath("/app/compliance");
}

export async function cancelarFaturaAction(formData: FormData) {
  const { org } = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("Fatura inválida.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("invoices")
    .update({ status: "cancelada" satisfies InvoiceStatus })
    .eq("id", id)
    .eq("organization_id", org.id);
  if (error) throw new Error(error.message);

  revalidatePath(`/app/compliance/financeiro/${id}`);
  revalidatePath("/app/compliance/financeiro");
  revalidatePath("/app/compliance");
}
