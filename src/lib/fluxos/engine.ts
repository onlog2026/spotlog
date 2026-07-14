/**
 * Motor do Robô / Flow Builder (Épico 1 — Passo 3).
 * ---------------------------------------------------------------------------
 * Lê o desenho do fluxo (flows.graph = { nodes, edges }) e caminha pelos blocos,
 * mantendo uma máquina de estados por contato em `flow_executions`.
 *
 * ENTRADA (100% inbound — o robô NUNCA inicia conversa):
 *   - O webhook da Digisac chama `handleInboundMessage(...)` quando chega msg.
 *   - Ou retoma uma execução pausada (esperando resposta), ou inicia um fluxo ATIVO
 *     cujo gatilho (palavra-chave ou catch-all) casa com a mensagem.
 *
 * Blocos suportados (os 7 do canvas):
 *   trigger · send_message · ask · condition · ai_reply · add_tag · transfer · stop
 *
 * Segurança:
 *   - Só dispara fluxo com status='active'.
 *   - 1 execução ativa por (fluxo, contato) — índice único no banco.
 *   - Teto anti-loop (MAX_STEPS) por rodada.
 *   - Best-effort: nunca lança pro chamador (o webhook sempre responde 200).
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import { sendWhatsapp } from "@/lib/integrations/whatsapp";
import { aiGenerate } from "@/lib/integrations/ai";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Admin = SupabaseClient<any, any, any>;

const MAX_STEPS = 40;

type NodeData = {
  type: string;
  text?: string;
  question?: string;
  variable?: string;
  condition?: string;
  prompt?: string;
  tag?: string;
  queue?: string;
};
type FlowNode = { id: string; data?: NodeData };
type FlowEdge = { source: string; target: string; sourceHandle?: string | null };
type Graph = { nodes: FlowNode[]; edges: FlowEdge[] };

type FlowRow = {
  id: string;
  organization_id: string;
  name: string;
  status: string;
  trigger_type: string;
  trigger_config: { keywords?: unknown; catch_all?: unknown } | null;
  graph: Graph | null;
};

type ExecState = Record<string, unknown> & {
  __await_var?: string | null;
  __last_reply?: string;
  __service_id?: string;
  __contact_name?: string;
  __conversation_id?: string;
};

type ExecRow = {
  id: string;
  organization_id: string;
  flow_id: string;
  contact_id: string | null;
  contact_ref: string | null;
  current_node_id: string | null;
  state: ExecState;
  status: string;
  step_count: number;
};

// ---------------------------------------------------------------------------
// Helpers de grafo / texto
// ---------------------------------------------------------------------------

function normalize(s: string): string {
  return (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .trim();
}

function terms(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw.map((t) => String(t)).filter(Boolean);
  return String(raw ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function findNode(graph: Graph, id: string | null): FlowNode | null {
  if (!id) return null;
  return graph.nodes.find((n) => n.id === id) ?? null;
}

/** Próximo nó a partir de `sourceId`. Para condição, respeita o handle sim/não. */
function nextNodeId(
  graph: Graph,
  sourceId: string,
  handle?: "sim" | "nao",
): string | null {
  const edges = graph.edges.filter((e) => e.source === sourceId);
  if (edges.length === 0) return null;
  if (handle) {
    const match = edges.find((e) => (e.sourceHandle ?? null) === handle);
    return match?.target ?? null;
  }
  return edges[0]?.target ?? null;
}

/** Substitui {{variavel}} pelo valor coletado no state (ou pelo nome do contato). */
function interpolate(text: string, state: ExecState): string {
  return (text || "").replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, key: string) => {
    const k = key.trim();
    const v = state[k];
    if (v != null && v !== "") return String(v);
    if (/(nome|first_name|full_name|name)/i.test(k))
      return state.__contact_name ?? "";
    return "";
  });
}

// ---------------------------------------------------------------------------
// Efeitos (enviar msg, tag, transferência) — best-effort
// ---------------------------------------------------------------------------

async function logStep(
  admin: Admin,
  executionId: string,
  nodeId: string | null,
  event: string,
  detail?: Record<string, unknown>,
) {
  try {
    await admin.from("flow_execution_logs").insert({
      execution_id: executionId,
      node_id: nodeId,
      event,
      detail: detail ?? null,
    });
  } catch {
    /* logs nunca quebram o fluxo */
  }
}

async function sendText(
  admin: Admin,
  exec: ExecRow,
  text: string,
): Promise<void> {
  const to = exec.contact_ref ?? "";
  if (!to || !text.trim()) return;
  const r = await sendWhatsapp({
    organization_id: exec.organization_id,
    to,
    text,
    serviceId: exec.state.__service_id,
    // Força Digisac: o Robô responde pelo mesmo canal/número que recebeu,
    // sem cair na cascata (que poderia sair por Evolution/Z-API).
    provider: "digisac",
  });
  // Espelha a resposta do robô no inbox (best-effort).
  try {
    await admin.from("messages").insert({
      organization_id: exec.organization_id,
      conversation_id: exec.state.__conversation_id ?? null,
      channel: "whatsapp",
      direction: "outbound",
      status: r.ok ? "sent" : "failed",
      to_address: to,
      body_text: text,
      contact_id: exec.contact_id,
      provider: r.provider ?? "digisac",
      provider_message_id: r.provider_message_id ?? null,
      sent_at: r.ok ? new Date().toISOString() : null,
      error: r.error ?? null,
      metadata: { source: "flow", flow_id: exec.flow_id },
    });
  } catch {
    /* ignore */
  }
  await logStep(admin, exec.id, exec.current_node_id, "sent", {
    ok: r.ok,
    error: r.error,
  });
}

async function addTag(admin: Admin, exec: ExecRow, tag: string): Promise<void> {
  const t = tag.trim();
  if (!t || !exec.contact_id) return;
  try {
    // Lê tags atuais e concatena sem duplicar (coluna text[] em contacts).
    const { data } = await admin
      .from("contacts")
      .select("tags")
      .eq("id", exec.contact_id)
      .maybeSingle();
    const cur = ((data as { tags?: string[] } | null)?.tags ?? []) as string[];
    if (cur.map(normalize).includes(normalize(t))) return;
    await admin
      .from("contacts")
      .update({ tags: [...cur, t] })
      .eq("id", exec.contact_id);
  } catch {
    /* coluna tags pode não existir — não quebra o fluxo */
  }
}

async function markTransfer(
  admin: Admin,
  exec: ExecRow,
  queue: string,
): Promise<void> {
  // Reabre/garante a conversa como não-lida pro humano assumir + registra atividade.
  try {
    if (exec.state.__conversation_id) {
      await admin
        .from("conversations")
        .update({ is_open: true, needs_human: true })
        .eq("id", exec.state.__conversation_id);
    }
  } catch {
    /* coluna needs_human pode não existir */
  }
  try {
    await admin.from("activities").insert({
      organization_id: exec.organization_id,
      type: "task",
      status: "pending",
      subject: `Atendimento humano${queue ? " — " + queue : ""}`,
      content: `Transferido pelo robô (fluxo ${exec.flow_id}).`,
      contact_id: exec.contact_id,
      due_at: new Date().toISOString(),
    });
  } catch {
    /* ignore */
  }
}

// ---------------------------------------------------------------------------
// Persistência da execução
// ---------------------------------------------------------------------------

async function persist(
  admin: Admin,
  exec: ExecRow,
  patch: Partial<{
    current_node_id: string | null;
    state: ExecState;
    status: string;
    waiting_for: string | null;
    wait_until: string | null;
    step_count: number;
    last_error: string | null;
  }>,
) {
  try {
    await admin
      .from("flow_executions")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", exec.id);
  } catch (e) {
    console.error("[fluxos] persist", e);
  }
}

// ---------------------------------------------------------------------------
// Caminhada pelos blocos
// ---------------------------------------------------------------------------

async function walk(
  admin: Admin,
  exec: ExecRow,
  graph: Graph,
  startNodeId: string | null,
): Promise<void> {
  let nodeId: string | null = startNodeId;
  let steps = exec.step_count;

  while (nodeId && steps < MAX_STEPS) {
    steps++;
    const node = findNode(graph, nodeId);
    if (!node) break; // aresta solta → encerra
    exec.current_node_id = nodeId;
    const d = node.data ?? { type: "unknown" };
    await logStep(admin, exec.id, nodeId, "entered", { type: d.type });

    switch (d.type) {
      case "trigger": {
        nodeId = nextNodeId(graph, nodeId);
        continue;
      }
      case "send_message": {
        await sendText(admin, exec, interpolate(d.text ?? "", exec.state));
        nodeId = nextNodeId(graph, nodeId);
        continue;
      }
      case "ai_reply": {
        let out = "";
        try {
          out = await aiGenerate({
            organization_id: exec.organization_id,
            max_tokens: 400,
            temperature: 0.6,
            messages: [
              {
                role: "system",
                content:
                  (d.prompt ??
                    "Você é um atendente de WhatsApp cordial e objetivo. Responda em 1-3 frases, sem markdown.") +
                  "\n\nResponda em português do Brasil, tom informal e gentil. Não invente dados.",
              },
              {
                role: "user",
                content: `Cliente (${exec.state.__contact_name ?? "sem nome"}) disse: "${
                  exec.state.__last_reply ?? ""
                }". Responda.`,
              },
            ],
          });
        } catch (e) {
          await logStep(admin, exec.id, nodeId, "error", {
            where: "ai_reply",
            error: e instanceof Error ? e.message : String(e),
          });
        }
        if (out) await sendText(admin, exec, out);
        nodeId = nextNodeId(graph, nodeId);
        continue;
      }
      case "add_tag": {
        await addTag(admin, exec, d.tag ?? "");
        nodeId = nextNodeId(graph, nodeId);
        continue;
      }
      case "condition": {
        const reply = normalize(exec.state.__last_reply ?? "");
        const hit = terms(d.condition).some((t) => reply.includes(normalize(t)));
        await logStep(admin, exec.id, nodeId, "condition", { hit, reply });
        nodeId = nextNodeId(graph, nodeId, hit ? "sim" : "nao");
        continue;
      }
      case "ask": {
        // Envia a pergunta e PAUSA esperando a resposta do cliente.
        await sendText(admin, exec, interpolate(d.question ?? "", exec.state));
        exec.state.__await_var = d.variable?.trim() || null;
        await persist(admin, exec, {
          current_node_id: nodeId,
          state: exec.state,
          status: "waiting",
          waiting_for: "reply",
          step_count: steps,
        });
        await logStep(admin, exec.id, nodeId, "waited", { for: "reply" });
        return;
      }
      case "transfer": {
        await markTransfer(admin, exec, d.queue ?? "");
        await persist(admin, exec, {
          current_node_id: nodeId,
          state: exec.state,
          status: "done",
          waiting_for: null,
          step_count: steps,
        });
        await logStep(admin, exec.id, nodeId, "done", { reason: "transfer" });
        return;
      }
      case "stop": {
        await persist(admin, exec, {
          current_node_id: nodeId,
          state: exec.state,
          status: "done",
          waiting_for: null,
          step_count: steps,
        });
        await logStep(admin, exec.id, nodeId, "done", { reason: "stop" });
        return;
      }
      default: {
        nodeId = nextNodeId(graph, nodeId);
        continue;
      }
    }
  }

  // Saiu do laço: sem próximo nó ou bateu o teto anti-loop.
  const looped = steps >= MAX_STEPS;
  await persist(admin, exec, {
    current_node_id: nodeId,
    state: exec.state,
    status: looped ? "stopped" : "done",
    waiting_for: null,
    step_count: steps,
    last_error: looped ? "Limite de passos atingido (possível loop)." : null,
  });
  await logStep(admin, exec.id, nodeId, looped ? "error" : "done", {
    looped,
  });
}

// ---------------------------------------------------------------------------
// Seleção de fluxo por gatilho
// ---------------------------------------------------------------------------

function pickFlow(flows: FlowRow[], text: string): FlowRow | null {
  const t = normalize(text);
  // 1) fluxos por palavra-chave que casam com a mensagem
  for (const f of flows) {
    if (f.trigger_type !== "keyword") continue;
    const kws = terms(f.trigger_config?.keywords);
    if (kws.some((k) => t.includes(normalize(k)))) return f;
  }
  // 2) catch-all: trigger não-keyword OU marcado catch_all (mais recente primeiro)
  const catchAll = flows.find(
    (f) => f.trigger_type !== "keyword" || f.trigger_config?.catch_all === true,
  );
  return catchAll ?? null;
}

// ---------------------------------------------------------------------------
// Entrada pública
// ---------------------------------------------------------------------------

export type InboundArgs = {
  admin: Admin;
  organizationId: string;
  contactId: string | null;
  contactRef: string; // telefone (só dígitos)
  conversationId?: string | null;
  serviceId?: string; // serviço Digisac que recebeu — responde pelo mesmo número
  contactName?: string;
  text: string;
};

/**
 * Ponto de entrada chamado pelo webhook a cada mensagem inbound.
 * Retorna o que aconteceu (pra log), nunca lança.
 */
export async function handleInboundMessage(
  args: InboundArgs,
): Promise<{ action: "resumed" | "started" | "none"; flowId?: string }> {
  const { admin, organizationId, contactRef, text } = args;
  try {
    // 1) Existe execução PAUSADA esperando resposta desse contato? → retoma.
    const { data: waitingRows } = await admin
      .from("flow_executions")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("contact_ref", contactRef)
      .eq("status", "waiting")
      .eq("waiting_for", "reply")
      .order("updated_at", { ascending: false })
      .limit(1);
    const waiting = (waitingRows ?? [])[0] as ExecRow | undefined;

    if (waiting) {
      const state: ExecState = { ...(waiting.state ?? {}) };
      state.__last_reply = text;
      if (args.serviceId) state.__service_id = args.serviceId;
      if (args.conversationId) state.__conversation_id = args.conversationId;
      if (state.__await_var) {
        state[state.__await_var] = text;
        state.__await_var = null;
      }
      // Zera o teto anti-loop a cada resposta do cliente: o limite vale por
      // "rajada" síncrona (evitar loop no grafo), não pela conversa inteira.
      const exec: ExecRow = { ...waiting, state, status: "active", step_count: 0 };
      const { data: flowRow } = await admin
        .from("flows")
        .select("id, organization_id, name, status, trigger_type, trigger_config, graph")
        .eq("id", exec.flow_id)
        .maybeSingle();
      const flow = flowRow as FlowRow | null;
      const graph = flow?.graph;
      if (!graph || !Array.isArray(graph.nodes)) {
        await persist(admin, exec, { status: "error", last_error: "grafo inválido" });
        return { action: "none" };
      }
      // Continua a partir do nó SEGUINTE ao "ask" (que era o current_node_id).
      const resumeFrom = exec.current_node_id
        ? nextNodeId(graph, exec.current_node_id)
        : null;
      await persist(admin, exec, { state, status: "active" });
      await walk(admin, exec, graph, resumeFrom);
      return { action: "resumed", flowId: exec.flow_id };
    }

    // 2) Nenhuma pausada → tenta iniciar um fluxo ATIVO cujo gatilho casa.
    const { data: flowRows } = await admin
      .from("flows")
      .select("id, organization_id, name, status, trigger_type, trigger_config, graph")
      .eq("organization_id", organizationId)
      .eq("status", "active")
      .order("updated_at", { ascending: false });
    const flows = (flowRows ?? []) as FlowRow[];
    if (flows.length === 0) return { action: "none" };

    const flow = pickFlow(flows, text);
    if (!flow || !flow.graph || !Array.isArray(flow.graph.nodes)) {
      return { action: "none" };
    }

    // Ponto de entrada = nó "trigger" (ou o primeiro nó, se não houver).
    const triggerNode =
      flow.graph.nodes.find((n) => n.data?.type === "trigger") ??
      flow.graph.nodes[0];
    if (!triggerNode) return { action: "none" };

    const state: ExecState = {
      __last_reply: text,
      __service_id: args.serviceId,
      __contact_name: args.contactName,
      __conversation_id: args.conversationId ?? undefined,
    };

    const { data: created, error } = await admin
      .from("flow_executions")
      .insert({
        organization_id: organizationId,
        flow_id: flow.id,
        contact_id: args.contactId,
        contact_ref: contactRef,
        current_node_id: triggerNode.id,
        state,
        status: "active",
        step_count: 0,
      })
      .select("*")
      .single();

    if (error || !created) {
      // Índice único: já há execução ativa/pausada pra esse contato+fluxo — ok, ignora.
      return { action: "none" };
    }

    const exec = created as ExecRow;
    await walk(admin, exec, flow.graph, triggerNode.id);
    return { action: "started", flowId: flow.id };
  } catch (e) {
    console.error("[fluxos] handleInboundMessage", e);
    return { action: "none" };
  }
}

/**
 * Retoma execuções pausadas por TEMPO (delays) cujo wait_until já passou.
 * Chamado pelo cron `/api/fluxos/tick`. (Nenhum bloco emite time-wait ainda —
 * fica pronto pros blocos de "esperar X horas" do roadmap.)
 */
export async function tickTimeWaits(admin: Admin): Promise<number> {
  const now = new Date().toISOString();
  const { data: rows } = await admin
    .from("flow_executions")
    .select("*")
    .eq("status", "waiting")
    .eq("waiting_for", "time")
    .lte("wait_until", now)
    .limit(100);
  const list = (rows ?? []) as ExecRow[];
  let processed = 0;
  for (const exec of list) {
    try {
      const { data: flowRow } = await admin
        .from("flows")
        .select("id, organization_id, name, status, trigger_type, trigger_config, graph")
        .eq("id", exec.flow_id)
        .maybeSingle();
      const flow = flowRow as FlowRow | null;
      if (!flow?.graph || !Array.isArray(flow.graph.nodes)) continue;
      const resumeFrom = exec.current_node_id
        ? nextNodeId(flow.graph, exec.current_node_id)
        : null;
      await persist(admin, exec, { status: "active", waiting_for: null });
      await walk(admin, { ...exec, status: "active" }, flow.graph, resumeFrom);
      processed++;
    } catch (e) {
      console.error("[fluxos] tick", e);
    }
  }
  return processed;
}
