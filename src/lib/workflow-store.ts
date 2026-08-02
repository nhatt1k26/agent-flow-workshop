import { useCallback, useSyncExternalStore } from "react";
import type { Agent, Run, Workflow, WorkflowNode } from "./workflow-types";

const KEY = "agentflow.state.v1";

interface State {
  workflows: Workflow[];
  agents: Agent[];
  runs: Run[];
}

export function uid(prefix = "n") {
  return `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
}

const now = () => new Date().toISOString();

function seedAgents(): Agent[] {
  return [
    {
      id: "ag_researcher",
      name: "Researcher",
      role: "Thu thập & tổng hợp thông tin",
      systemPrompt:
        "Bạn là chuyên gia nghiên cứu. Luôn trích dẫn nguồn và tóm tắt ngắn gọn, có cấu trúc.",
      defaultModel: "google/gemini-3.6-flash",
      tools: ["web_search", "vector_search"],
      temperature: 0.3,
      createdAt: now(),
    },
    {
      id: "ag_writer",
      name: "Copywriter",
      role: "Viết nội dung theo brand voice",
      systemPrompt: "Bạn là copywriter. Viết rõ ràng, thuyết phục, đúng giọng thương hiệu.",
      defaultModel: "openai/gpt-5.2",
      tools: [],
      temperature: 0.8,
      createdAt: now(),
    },
    {
      id: "ag_critic",
      name: "Reviewer",
      role: "Kiểm định chất lượng & tính chính xác",
      systemPrompt: "Bạn là reviewer khắt khe. Chấm điểm 0-10 và liệt kê lỗi cụ thể.",
      defaultModel: "anthropic/claude-sonnet",
      tools: ["web_search"],
      temperature: 0.1,
      createdAt: now(),
    },
  ];
}

function seedWorkflow(): Workflow {
  const n = (
    id: string,
    x: number,
    y: number,
    data: Partial<WorkflowNode["data"]> & { label: string; kind: WorkflowNode["data"]["kind"] },
  ): WorkflowNode => ({
    id,
    type: "wf",
    position: { x, y },
    data: { inputs: [], outputs: [], contextMode: "last", ...data },
  });

  return {
    id: "wf_demo",
    name: "Content Research Pipeline",
    description: "Nghiên cứu chủ đề → viết bài → review → xuất bản.",
    tags: ["content", "demo"],
    status: "active",
    createdAt: now(),
    updatedAt: now(),
    nodes: [
      n("t1", 0, 160, {
        label: "Yêu cầu người dùng",
        kind: "trigger",
        description: "Nhận chủ đề cần viết",
        outputs: [{ id: "o1", name: "topic", type: "text" }],
      }),
      n("a1", 300, 60, {
        label: "Nghiên cứu chủ đề",
        kind: "agent",
        agentId: "ag_researcher",
        model: "google/gemini-3.6-flash",
        temperature: 0.3,
        maxTokens: 2048,
        contextMode: "last",
        promptTemplate: "Nghiên cứu sâu về: {{topic}}. Trả về 5 insight kèm nguồn.",
        inputs: [{ id: "i1", name: "topic", type: "text" }],
        outputs: [{ id: "o1", name: "research", type: "json" }],
      }),
      n("tl1", 300, 300, {
        label: "Tìm kiếm web",
        kind: "tool",
        toolName: "web_search",
        toolParams: '{ "query": "{{topic}}", "limit": 10 }',
        inputs: [{ id: "i1", name: "topic", type: "text" }],
        outputs: [{ id: "o1", name: "results", type: "json" }],
      }),
      n("a2", 620, 160, {
        label: "Viết bản nháp",
        kind: "agent",
        agentId: "ag_writer",
        model: "openai/gpt-5.2",
        temperature: 0.8,
        maxTokens: 4096,
        contextMode: "full",
        promptTemplate: "Dựa trên research, viết bài blog 800 từ.",
        inputs: [
          { id: "i1", name: "research", type: "json" },
          { id: "i2", name: "results", type: "json" },
        ],
        outputs: [{ id: "o1", name: "draft", type: "text" }],
      }),
      n("a3", 920, 160, {
        label: "Review chất lượng",
        kind: "agent",
        agentId: "ag_critic",
        model: "anthropic/claude-sonnet",
        temperature: 0.1,
        contextMode: "last",
        inputs: [{ id: "i1", name: "draft", type: "text" }],
        outputs: [{ id: "o1", name: "score", type: "number" }],
      }),
      n("c1", 1200, 160, {
        label: "Đạt chuẩn?",
        kind: "condition",
        expression: "score >= 8",
        inputs: [{ id: "i1", name: "score", type: "number" }],
        outputs: [
          { id: "true", name: "true", type: "any" },
          { id: "false", name: "false", type: "any" },
        ],
      }),
      n("out1", 1480, 60, {
        label: "Xuất bản",
        kind: "output",
        inputs: [{ id: "i1", name: "article", type: "text" }],
        outputs: [],
      }),
      n("h1", 1480, 300, {
        label: "Người duyệt lại",
        kind: "human",
        description: "Chuyển cho biên tập viên",
        inputs: [{ id: "i1", name: "draft", type: "text" }],
        outputs: [{ id: "o1", name: "approved", type: "boolean" }],
      }),
    ],
    edges: [
      { id: "e1", source: "t1", target: "a1", animated: true },
      { id: "e2", source: "t1", target: "tl1", animated: true },
      { id: "e3", source: "a1", target: "a2", animated: true },
      { id: "e4", source: "tl1", target: "a2", animated: true },
      { id: "e5", source: "a2", target: "a3", animated: true },
      { id: "e6", source: "a3", target: "c1", animated: true },
      { id: "e7", source: "c1", target: "out1", sourceHandle: "true", label: "true", animated: true },
      { id: "e8", source: "c1", target: "h1", sourceHandle: "false", label: "false", animated: true },
    ],
  };
}

function initial(): State {
  return { workflows: [seedWorkflow()], agents: seedAgents(), runs: [] };
}

let state: State = initial();
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as State;
      if (parsed && Array.isArray(parsed.workflows)) state = parsed;
    } else {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    }
  } catch {
    /* ignore corrupt storage */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

function setState(next: (s: State) => State) {
  state = next(state);
  persist();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  hydrate();
  listeners.add(l);
  l();
  return () => listeners.delete(l);
}

const serverSnapshot = initial();

export function useStore<T>(selector: (s: State) => T): T {
  return useSyncExternalStore(
    subscribe,
    useCallback(() => selector(state), [selector]),
    useCallback(() => selector(serverSnapshot), [selector]),
  );
}

export const store = {
  get: () => state,
  createWorkflow(name: string, description = ""): Workflow {
    const wf: Workflow = {
      id: uid("wf"),
      name,
      description,
      tags: [],
      status: "draft",
      nodes: [
        {
          id: uid(),
          type: "wf",
          position: { x: 80, y: 160 },
          data: {
            label: "Bắt đầu",
            kind: "trigger",
            inputs: [],
            outputs: [{ id: "o1", name: "input", type: "text" }],
            contextMode: "none",
          },
        },
      ],
      edges: [],
      createdAt: now(),
      updatedAt: now(),
    };
    setState((s) => ({ ...s, workflows: [wf, ...s.workflows] }));
    return wf;
  },
  duplicateWorkflow(id: string) {
    const src = state.workflows.find((w) => w.id === id);
    if (!src) return;
    const copy: Workflow = {
      ...structuredClone(src),
      id: uid("wf"),
      name: `${src.name} (copy)`,
      status: "draft",
      createdAt: now(),
      updatedAt: now(),
    };
    setState((s) => ({ ...s, workflows: [copy, ...s.workflows] }));
  },
  updateWorkflow(id: string, patch: Partial<Workflow>) {
    setState((s) => ({
      ...s,
      workflows: s.workflows.map((w) =>
        w.id === id ? { ...w, ...patch, updatedAt: now() } : w,
      ),
    }));
  },
  deleteWorkflow(id: string) {
    setState((s) => ({ ...s, workflows: s.workflows.filter((w) => w.id !== id) }));
  },
  upsertAgent(agent: Agent) {
    setState((s) => ({
      ...s,
      agents: s.agents.some((a) => a.id === agent.id)
        ? s.agents.map((a) => (a.id === agent.id ? agent : a))
        : [agent, ...s.agents],
    }));
  },
  deleteAgent(id: string) {
    setState((s) => ({ ...s, agents: s.agents.filter((a) => a.id !== id) }));
  },
  addRun(run: Run) {
    setState((s) => ({ ...s, runs: [run, ...s.runs].slice(0, 60) }));
  },
  updateRun(id: string, patch: Partial<Run>) {
    setState((s) => ({ ...s, runs: s.runs.map((r) => (r.id === id ? { ...r, ...patch } : r)) }));
  },
  reset() {
    setState(() => initial());
  },
};