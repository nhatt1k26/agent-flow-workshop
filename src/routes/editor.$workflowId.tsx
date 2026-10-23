import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  ReactFlow,
  ReactFlowProvider,
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  useReactFlow,
  type Connection,
  type Edge,
  type EdgeChange,
  type Node,
  type NodeChange,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowLeft, PanelBottom, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { MouseEvent as ReactMouseEvent } from "react";
import { AppShell } from "@/components/AppShell";
import { NodePalette } from "@/components/workflow/NodePalette";
import { Inspector } from "@/components/workflow/Inspector";
import { RunPanel } from "@/components/workflow/RunPanel";
import { WorkflowNodeCard } from "@/components/workflow/WorkflowNodeCard";
import { BreakpointEdge } from "@/components/workflow/BreakpointEdge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { store, uid, useStore } from "@/lib/workflow-store";
import { executeWorkflow, type RunHandle } from "@/lib/workflow-runner";
import { NODE_META, type NodeConfig, type NodeKind } from "@/lib/workflow-types";

export const Route = createFileRoute("/editor/$workflowId")({
  head: () => ({
    meta: [
      { title: "Trình chỉnh sửa workflow · AgentFlow" },
      {
        name: "description",
        content:
          "Kéo thả node, gán agent, chọn model, cấu hình context và input/output cho workflow AI.",
      },
      { property: "og:title", content: "Trình chỉnh sửa workflow · AgentFlow" },
      {
        property: "og:description",
        content: "Thiết kế workflow AI agent bằng canvas kéo thả trực quan.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => (
    <ReactFlowProvider>
      <EditorPage />
    </ReactFlowProvider>
  ),
});

const nodeTypes = { wf: WorkflowNodeCard };
const edgeTypes = { bp: BreakpointEdge };

function defaultConfig(kind: NodeKind): NodeConfig {
  const base: NodeConfig = {
    label: NODE_META[kind].label,
    kind,
    inputs: kind === "trigger" ? [] : [{ id: uid("p"), name: "input", type: "any" }],
    outputs: kind === "output" ? [] : [{ id: uid("p"), name: "output", type: "any" }],
    contextMode: "last",
  };
  if (kind === "agent") return { ...base, model: "google/gemini-3.6-flash", temperature: 0.7, maxTokens: 2048 };
  if (kind === "condition")
    return {
      ...base,
      expression: "value == true",
      outputs: [
        { id: "true", name: "true", type: "any" },
        { id: "false", name: "false", type: "any" },
      ],
    };
  if (kind === "tool") return { ...base, toolName: "web_search", toolParams: "{}" };
  return base;
}

function EditorPage() {
  const { workflowId } = useParams({ from: "/editor/$workflowId" });
  const workflow = useStore(
    useCallback((s) => s.workflows.find((w) => w.id === workflowId), [workflowId]),
  );
  const agents = useStore(useCallback((s) => s.agents, []));
  const runs = useStore(useCallback((s) => s.runs, []));

  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [dirty, setDirty] = useState(false);
  const [showRun, setShowRun] = useState(true);
  const [runInput, setRunInput] = useState("Xu hướng AI agent năm 2026");
  const [runId, setRunId] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const loaded = useRef(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const handleRef = useRef<RunHandle | null>(null);
  const { screenToFlowPosition } = useReactFlow();

  useEffect(() => {
    if (!workflow || loaded.current) return;
    loaded.current = true;
    setNodes(workflow.nodes as unknown as Node[]);
    setEdges(workflow.edges as unknown as Edge[]);
    setName(workflow.name);
  }, [workflow]);

  const activeRun = runs.find((r) => r.id === runId);

  const displayNodes = useMemo(
    () =>
      nodes.map((n) => {
        const step = activeRun?.steps.find((s) => s.nodeId === n.id);
        const cfg = n.data as unknown as NodeConfig;
        const agentName = agents.find((a) => a.id === cfg.agentId)?.name;
        return {
          ...n,
          data: {
            ...n.data,
            runStatus: step?.status,
            agentName,
            paused: activeRun?.pausedAt === n.id,
          },
        };
      }),
    [nodes, activeRun, agents],
  );

  const displayEdges = useMemo(
    () =>
      edges.map((e) => ({
        ...e,
        type: "bp" as const,
        data: {
          breakpoint: e.breakpoint,
          paused: !!activeRun?.pausedAt && e.target === activeRun.pausedAt,
        },
      })),
    [edges, activeRun],
  );

  const onNodesChange = useCallback((c: NodeChange[]) => {
    setNodes((nds) => applyNodeChanges(c, nds));
    if (c.some((x) => x.type !== "select" && x.type !== "dimensions")) setDirty(true);
  }, []);
  const onEdgesChange = useCallback((c: EdgeChange[]) => {
    setEdges((eds) => applyEdgeChanges(c, eds));
    setDirty(true);
  }, []);
  const onConnect = useCallback((c: Connection) => {
    setEdges((eds) => addEdge({ ...c, id: uid("e"), animated: true }, eds));
    setDirty(true);
  }, []);
  const onEdgeDoubleClick = useCallback((_e: ReactMouseEvent, edge: Edge) => {
    setEdges((eds) =>
      eds.map((x) => (x.id === edge.id ? { ...x, breakpoint: !x.breakpoint } : x)),
    );
    setDirty(true);
  }, []);

  const addNode = useCallback(
    (kind: NodeKind, pos?: { x: number; y: number }) => {
      const id = uid();
      setNodes((nds) => [
        ...nds,
        {
          id,
          type: "wf",
          position: pos ?? { x: 220 + Math.random() * 260, y: 120 + Math.random() * 220 },
          data: defaultConfig(kind) as unknown as Record<string, unknown>,
        },
      ]);
      setSelected(id);
      setDirty(true);
    },
    [],
  );

  const patchNode = useCallback((id: string, patch: Partial<NodeConfig>) => {
    setNodes((nds) =>
      nds.map((n) => (n.id === id ? { ...n, data: { ...n.data, ...patch } } : n)),
    );
    setDirty(true);
  }, []);

  const save = useCallback(() => {
    if (!workflow) return;
    const cleanNodes = nodes.map((n) => {
      const { runStatus: _r, agentName: _a, ...data } = n.data as Record<string, unknown>;
      return { id: n.id, type: "wf" as const, position: n.position, data: data as unknown as NodeConfig };
    });
    store.updateWorkflow(workflow.id, {
      name,
      nodes: cleanNodes,
      edges: edges as unknown as typeof workflow.edges,
    });
    setDirty(false);
    toast.success("Đã lưu workflow");
  }, [workflow, nodes, edges, name]);

  const run = useCallback(() => {
    if (!workflow) return;
    setShowRun(true);
    setRunning(true);
    const snapshot = {
      ...workflow,
      nodes: nodes.map((n) => ({
        id: n.id,
        type: "wf" as const,
        position: n.position,
        data: n.data as unknown as NodeConfig,
      })),
      edges: edges as unknown as typeof workflow.edges,
    };
    const handle = executeWorkflow(snapshot, runInput);
    handleRef.current = handle;
    setRunId(handle.runId);
    handle.promise.finally(() => setRunning(false));
  }, [workflow, nodes, edges, runInput]);

  const selectedNode = nodes.find((n) => n.id === selected);

  const upstream = useMemo(() => {
    if (!selected) return [];
    const ids = new Set<string>();
    const walk = (id: string) => {
      edges
        .filter((e) => e.target === id)
        .forEach((e) => {
          if (!ids.has(e.source)) {
            ids.add(e.source);
            walk(e.source);
          }
        });
    };
    walk(selected);
    return [...ids].map((id) => ({
      id,
      label: (nodes.find((n) => n.id === id)?.data as NodeConfig | undefined)?.label ?? id,
    }));
  }, [selected, edges, nodes]);

  if (!workflow) {
    return (
      <AppShell>
        <div className="p-10 text-center text-sm text-muted-foreground">
          Không tìm thấy workflow.{" "}
          <Link to="/" className="text-primary underline">
            Quay lại danh sách
          </Link>
        </div>
      </AppShell>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-sidebar px-4">
        <Button asChild size="icon" variant="ghost" className="size-8">
          <Link to="/">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <Input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setDirty(true);
          }}
          className="h-8 w-72 border-transparent bg-transparent text-sm font-semibold focus-visible:border-border"
        />
        <Badge variant="outline" className="text-[10px]">
          {nodes.length} node · {edges.length} liên kết
        </Badge>
        {dirty && (
          <span className="text-[11px] text-warning">● chưa lưu</span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs"
            onClick={() => setShowRun((v) => !v)}
          >
            <PanelBottom className="mr-1.5 size-3.5" />
            Bảng chạy
          </Button>
          <Button size="sm" className="h-8 text-xs" onClick={save}>
            <Save className="mr-1.5 size-3.5" /> Lưu
          </Button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1">
        <NodePalette onAdd={(k) => addNode(k)} />

        <div className="flex min-w-0 flex-1 flex-col">
          <div
            ref={wrapper}
            className="min-h-0 flex-1"
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
            }}
            onDrop={(e) => {
              e.preventDefault();
              const kind = e.dataTransfer.getData("application/agentflow-node") as NodeKind;
              if (!kind) return;
              addNode(kind, screenToFlowPosition({ x: e.clientX, y: e.clientY }));
            }}
          >
            <ReactFlow
              nodes={displayNodes}
              edges={displayEdges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onEdgeDoubleClick={onEdgeDoubleClick}
              onNodeClick={(_, n) => setSelected(n.id)}
              onPaneClick={() => setSelected(null)}
              fitView
              fitViewOptions={{ padding: 0.25, maxZoom: 1 }}
              proOptions={{ hideAttribution: true }}
              defaultEdgeOptions={{ animated: true, type: "bp" }}
            >
              <Background variant={BackgroundVariant.Dots} gap={22} size={1.5} color="var(--grid)" />
              <Controls showInteractive={false} />
              <MiniMap
                pannable
                zoomable
                bgColor="oklch(0.19 0.019 256)"
                maskColor="oklch(0.13 0.018 255 / 0.75)"
                nodeColor="oklch(0.35 0.03 256)"
                nodeStrokeWidth={0}
              />
            </ReactFlow>
          </div>

          {showRun && (
            <RunPanel
              run={activeRun}
              running={running}
              input={runInput}
              onInput={setRunInput}
              onRun={run}
              onResume={(step) => handleRef.current?.resume(step)}
              onClose={() => setShowRun(false)}
            />
          )}
        </div>

        {selectedNode ? (
          <Inspector
            nodeId={selectedNode.id}
            data={selectedNode.data as unknown as NodeConfig}
            agents={agents}
            upstream={upstream}
            onChange={(p) => patchNode(selectedNode.id, p)}
            onDelete={() => {
              setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
              setEdges((eds) =>
                eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id),
              );
              setSelected(null);
              setDirty(true);
            }}
            onClose={() => setSelected(null)}
          />
        ) : (
          <aside className="flex w-[340px] shrink-0 flex-col items-center justify-center gap-2 border-l border-border bg-sidebar p-8 text-center">
            <Sparkles className="size-6 text-muted-foreground" />
            <p className="text-sm font-medium">Chọn một node</p>
            <p className="text-xs text-muted-foreground">
              Bấm vào node trên canvas để cấu hình agent, model, context và các cổng input/output.
            </p>
          </aside>
        )}
      </div>
    </div>
  );
}