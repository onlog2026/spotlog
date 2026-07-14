"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type FlowRow = {
  id: string;
  name: string;
  description: string | null;
  status: "draft" | "active" | "paused";
  trigger_type: string;
  updated_at: string;
};

/** Lista os fluxos da org (RLS garante o isolamento). */
export async function listFlows(): Promise<FlowRow[]> {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { data } = await supabase
    // @ts-expect-error tabela nova fora dos types gerados
    .from("flows")
    .select("id, name, description, status, trigger_type, updated_at")
    .eq("organization_id", ctx.org.id)
    .order("updated_at", { ascending: false });
  return (data ?? []) as FlowRow[];
}

/** Cria um fluxo vazio e leva pro editor. */
export async function criarFluxo(formData: FormData) {
  const ctx = await requireSession();
  const name =
    z.string().trim().min(1).max(80).catch("Novo fluxo").parse(
      String(formData.get("name") ?? "Novo fluxo"),
    );
  const supabase = await createClient();
  const { data, error } = await supabase
    // @ts-expect-error tabela nova
    .from("flows")
    .insert({
      organization_id: ctx.org.id,
      name,
      created_by: ctx.user.id,
      graph: { nodes: [], edges: [] },
    })
    .select("id")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Falha ao criar fluxo");

  revalidatePath("/app/flows");
  redirect(`/app/flows/${(data as { id: string }).id}`);
}

export async function renomearFluxo(id: string, name: string) {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    // @ts-expect-error tabela nova
    .from("flows")
    .update({ name: name.trim().slice(0, 80) || "Sem nome", updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/flows");
  revalidatePath(`/app/flows/${id}`);
}

/** Ativa/pausa um fluxo. */
export async function setFlowStatus(id: string, status: "draft" | "active" | "paused") {
  const ctx = await requireSession();
  const supabase = await createClient();
  const { error } = await supabase
    // @ts-expect-error tabela nova
    .from("flows")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/flows");
  revalidatePath(`/app/flows/${id}`);
}

export async function excluirFluxo(formData: FormData) {
  const ctx = await requireSession();
  const id = String(formData.get("id") ?? "");
  if (!id) throw new Error("id obrigatório");
  const supabase = await createClient();
  const { error } = await supabase
    // @ts-expect-error tabela nova
    .from("flows")
    .delete()
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath("/app/flows");
}

/** Define o gatilho: palavras-chave e/ou "pega tudo" (catch-all). */
export async function setFlowTrigger(
  id: string,
  keywords: string[],
  catchAll: boolean,
) {
  const ctx = await requireSession();
  if (!id) throw new Error("id obrigatório");
  const clean = keywords
    .map((k) => k.trim())
    .filter(Boolean)
    .slice(0, 30);
  const supabase = await createClient();
  const { error } = await supabase
    // @ts-expect-error tabela nova
    .from("flows")
    .update({
      trigger_type: "keyword",
      trigger_config: { keywords: clean, catch_all: catchAll },
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/flows/${id}`);
  return { ok: true };
}

/** Salva o grafo (nós + arestas) do fluxo. */
export async function saveFlowGraph(
  id: string,
  graph: { nodes: unknown[]; edges: unknown[] },
) {
  const ctx = await requireSession();
  if (!id) throw new Error("id obrigatório");
  const supabase = await createClient();
  const { error } = await supabase
    // @ts-expect-error tabela nova
    .from("flows")
    .update({ graph, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("organization_id", ctx.org.id);
  if (error) throw new Error(error.message);
  revalidatePath(`/app/flows/${id}`);
  return { ok: true };
}
