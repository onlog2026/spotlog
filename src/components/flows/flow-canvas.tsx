"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  Handle,
  Position,
  type Node,
  type Edge,
  type Connection,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { toast } from "sonner";
import { Loader2, Save } from "lucide-react";
import { saveFlowGraph } from "@/lib/flows/actions";

type BlockData = {
  type: string;
  label: string;
  text?: string;
  question?: string;
  variable?: string;
  condition?: string;
  tag?: string;
  prompt?: string;
  queue?: string;
};

// Paleta de blocos (subconjunto do Digisac — dá pra expandir).
const BLOCKS: {
  type: string;
  label: string;
  icon: string;
  color: string;
}[] = [
  { type: "send_message", label: "Enviar mensagem", icon: "💬", color: "#3b82f6" },
  { type: "ask", label: "Perguntar e esperar", icon: "❓", color: "#8b5cf6" },
  { type: "condition", label: "Condição (se/senão)", icon: "🔀", color: "#f59e0b" },
  { type: "ai_reply", label: "Resposta com IA", icon: "✨", color: "#10b981" },
  { type: "add_tag", label: "Adicionar tag", icon: "🏷️", color: "#ec4899" },
  { type: "transfer", label: "Transferir p/ humano", icon: "🙋", color: "#06b6d4" },
  { type: "stop", label: "Encerrar fluxo", icon: "⛔", color: "#ef4444" },
];
const META = (t: string) =>
  BLOCKS.find((b) => b.type === t) ?? { label: t, icon: "●", color: "#64748b" };

function summarize(d: BlockData): string {
  switch (d.type) {
    case "send_message":
      return d.text || "(escreva a mensagem)";
    case "ask":
      return d.question || "(pergunta) → " + (d.variable || "variável");
    case "condition":
      return d.condition || "(condição)";
    case "ai_reply":
      return d.prompt || "(instrução pra IA)";
    case "add_tag":
      return d.tag || "(tag)";
    case "transfer":
      return d.queue || "atendimento";
    default:
      return "";
  }
}

function BlockNode({ data, selected }: NodeProps) {
  const d = data as BlockData;
  const meta = META(d.type);
  const isTrigger = d.type === "trigger";
  const isCondition = d.type === "condition";
  return (
    <div
      style={{
        minWidth: 190,
        maxWidth: 230,
        borderRadius: 12,
        border: `2px solid ${selected ? "#fff" : meta.color}`,
        background: "#0b1220",
        color: "#e2e8f0",
        boxShadow: "0 4px 14px rgba(0,0,0,.4)",
        fontSize: 12,
      }}
    >
      {!isTrigger && (
        <Handle type="target" position={Position.Top} style={{ background: meta.color }} />
      )}
      <div
        style={{
          padding: "7px 10px",
          borderBottom: "1px solid rgba(255,255,255,.08)",
          fontWeight: 700,
          color: meta.color,
        }}
      >
        {isTrigger ? "▶️ Início" : `${meta.icon} ${meta.label}`}
      </div>
      {!isTrigger && (
        <div style={{ padding: "8px 10px", color: "#94a3b8", lineHeight: 1.4 }}>
          {summarize(d)}
        </div>
      )}
      {isCondition ? (
        <>
          <Handle type="source" id="sim" position={Position.Bottom} style={{ left: "28%", background: "#22c55e" }} />
          <Handle type="source" id="nao" position={Position.Bottom} style={{ left: "72%", background: "#ef4444" }} />
        </>
      ) : d.type !== "stop" ? (
        <Handle type="source" position={Position.Bottom} style={{ background: meta.color }} />
      ) : null}
    </div>
  );
}

const nodeTypes = { block: BlockNode };

function Editor({
  flowId,
  initialNodes,
  initialEdges,
}: {
  flowId: string;
  initialNodes: Node[];
  initialEdges: Edge[];
}) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selId, setSelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback(
    (c: Connection) => setEdges((eds) => addEdge({ ...c, animated: true }, eds)),
    [setEdges],
  );

  const addBlock = useCallback(
    (type: string) => {
      const id = `${type}_${Math.round(Math.random() * 1e6)}`;
      const meta = META(type);
      const node: Node = {
        id,
        type: "block",
        position: { x: 120 + Math.random() * 220, y: 120 + Math.random() * 220 },
        data: { type, label: meta.label } as BlockData,
      };
      setNodes((nds) => nds.concat(node));
      setSelId(id);
    },
    [setNodes],
  );

  const selected = useMemo(
    () => nodes.find((n) => n.id === selId) ?? null,
    [nodes, selId],
  );

  const patch = useCallback(
    (field: keyof BlockData, value: string) => {
      setNodes((nds) =>
        nds.map((n) =>
          n.id === selId ? { ...n, data: { ...n.data, [field]: value } } : n,
        ),
      );
    },
    [selId, setNodes],
  );

  const removeSelected = useCallback(() => {
    if (!selId) return;
    setNodes((nds) => nds.filter((n) => n.id !== selId));
    setEdges((eds) => eds.filter((e) => e.source !== selId && e.target !== selId));
    setSelId(null);
  }, [selId, setNodes, setEdges]);

  async function save() {
    setSaving(true);
    try {
      await saveFlowGraph(flowId, { nodes, edges });
      toast.success("Fluxo salvo");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao salvar");
    } finally {
      setSaving(false);
    }
  }

  const d = (selected?.data ?? {}) as BlockData;

  return (
    <div className="flex h-[70vh] rounded-xl border border-white/10 overflow-hidden">
      {/* Paleta */}
      <div className="w-52 shrink-0 bg-[#0b1220] border-r border-white/10 p-3 space-y-2 overflow-y-auto">
        <div className="text-[11px] uppercase tracking-wider text-white/50 font-semibold mb-1">
          Blocos
        </div>
        {BLOCKS.map((b) => (
          <button
            key={b.type}
            type="button"
            onClick={() => addBlock(b.type)}
            className="w-full text-left text-xs rounded-md px-2 py-2 border border-white/10 hover:bg-white/5 flex items-center gap-2"
            style={{ borderLeft: `3px solid ${b.color}` }}
          >
            <span>{b.icon}</span> {b.label}
          </button>
        ))}
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="w-full mt-3 rounded-md bg-[#BA0102] hover:bg-[#a10002] text-white text-xs font-semibold px-3 py-2 flex items-center justify-center gap-2"
        >
          {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
          Salvar fluxo
        </button>
      </div>

      {/* Canvas */}
      <div className="flex-1 bg-[#060b18]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={(_, n) => setSelId(n.id)}
          onPaneClick={() => setSelId(null)}
          nodeTypes={nodeTypes}
          fitView
          proOptions={{ hideAttribution: true }}
        >
          <Background color="#1e293b" gap={18} />
          <Controls />
          <MiniMap pannable zoomable style={{ background: "#0b1220" }} />
        </ReactFlow>
      </div>

      {/* Painel de edição */}
      {selected && (
        <div className="w-64 shrink-0 bg-[#0b1220] border-l border-white/10 p-3 space-y-3 overflow-y-auto text-sm">
          <div className="flex items-center justify-between">
            <div className="font-semibold" style={{ color: META(d.type).color }}>
              {META(d.type).icon} {META(d.type).label}
            </div>
            {d.type !== "trigger" && (
              <button
                type="button"
                onClick={removeSelected}
                className="text-[11px] text-red-400 hover:text-red-300"
              >
                remover
              </button>
            )}
          </div>

          {d.type === "send_message" && (
            <Field label="Mensagem">
              <textarea
                rows={4}
                value={d.text ?? ""}
                onChange={(e) => patch("text", e.target.value)}
                placeholder="Olá! Como posso ajudar?"
                className={inputCls}
              />
            </Field>
          )}
          {d.type === "ask" && (
            <>
              <Field label="Pergunta">
                <textarea
                  rows={3}
                  value={d.question ?? ""}
                  onChange={(e) => patch("question", e.target.value)}
                  placeholder="Qual seu nome?"
                  className={inputCls}
                />
              </Field>
              <Field label="Guardar resposta em">
                <input
                  value={d.variable ?? ""}
                  onChange={(e) => patch("variable", e.target.value)}
                  placeholder="nome"
                  className={inputCls}
                />
              </Field>
            </>
          )}
          {d.type === "condition" && (
            <Field label="Se a resposta contém">
              <input
                value={d.condition ?? ""}
                onChange={(e) => patch("condition", e.target.value)}
                placeholder="sim, quero, orçamento"
                className={inputCls}
              />
            </Field>
          )}
          {d.type === "ai_reply" && (
            <Field label="Instrução pra IA">
              <textarea
                rows={4}
                value={d.prompt ?? ""}
                onChange={(e) => patch("prompt", e.target.value)}
                placeholder="Responda a dúvida do cliente sobre logística, tom cordial."
                className={inputCls}
              />
            </Field>
          )}
          {d.type === "add_tag" && (
            <Field label="Tag">
              <input
                value={d.tag ?? ""}
                onChange={(e) => patch("tag", e.target.value)}
                placeholder="interessado"
                className={inputCls}
              />
            </Field>
          )}
          {d.type === "transfer" && (
            <Field label="Fila / setor">
              <input
                value={d.queue ?? ""}
                onChange={(e) => patch("queue", e.target.value)}
                placeholder="comercial"
                className={inputCls}
              />
            </Field>
          )}
          {d.type === "trigger" && (
            <p className="text-xs text-white/50">
              É o ponto de entrada do fluxo. Ligue-o ao primeiro bloco.
            </p>
          )}
          {d.type === "stop" && (
            <p className="text-xs text-white/50">Encerra o atendimento automático.</p>
          )}
        </div>
      )}
    </div>
  );
}

const inputCls =
  "w-full rounded-md bg-white/5 border border-white/10 px-2 py-1.5 text-sm";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] text-white/50">{label}</label>
      {children}
    </div>
  );
}

export function FlowCanvas({
  flowId,
  graph,
}: {
  flowId: string;
  graph: { nodes?: unknown[]; edges?: unknown[] } | null;
}) {
  // Garante um bloco de Início se o fluxo estiver vazio.
  const initialNodes: Node[] =
    graph?.nodes && graph.nodes.length > 0
      ? (graph.nodes as Node[])
      : [
          {
            id: "trigger",
            type: "block",
            position: { x: 250, y: 40 },
            data: { type: "trigger", label: "Início" },
          },
        ];
  const initialEdges: Edge[] = (graph?.edges as Edge[]) ?? [];

  return (
    <ReactFlowProvider>
      <Editor flowId={flowId} initialNodes={initialNodes} initialEdges={initialEdges} />
    </ReactFlowProvider>
  );
}
