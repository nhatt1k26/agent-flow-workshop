export type NodeKind =
  | "trigger"
  | "agent"
  | "tool"
  | "condition"
  | "transform"
  | "human"
  | "output";

export type PortType = "text" | "json" | "number" | "boolean" | "file" | "any";

export interface Port {
  id: string;
  name: string;
  type: PortType;
  description?: string;
}

export type ContextMode = "none" | "last" | "full" | "custom";

export interface NodeConfig {
  label: string;
  kind: NodeKind;
  description?: string;
  /** agent nodes */
  agentId?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  promptTemplate?: string;
  /** context wiring */
  contextMode?: ContextMode;
  contextSources?: string[];
  memoryKey?: string;
  /** tool nodes */
  toolName?: string;
  toolParams?: string;
  /** condition / transform */
  expression?: string;
  /** ports */
  inputs: Port[];
  outputs: Port[];
  retries?: number;
  timeoutMs?: number;
}

export interface WorkflowNode {
  id: string;
  type: "wf";
  position: { x: number; y: number };
  data: NodeConfig;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string | null;
  targetHandle?: string | null;
  label?: string;
  animated?: boolean;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  tags: string[];
  status: "draft" | "active" | "paused";
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  createdAt: string;
  updatedAt: string;
}

export interface Agent {
  id: string;
  name: string;
  role: string;
  systemPrompt: string;
  defaultModel: string;
  tools: string[];
  temperature: number;
  createdAt: string;
}

export type StepStatus = "pending" | "running" | "success" | "error" | "skipped";

export interface RunStep {
  nodeId: string;
  label: string;
  kind: NodeKind;
  status: StepStatus;
  input: string;
  output: string;
  model: string;
  agent: string;
  tokens: number;
  durationMs: number;
  startedAt: string;
}

export interface Run {
  id: string;
  workflowId: string;
  workflowName: string;
  status: "running" | "success" | "error";
  startedAt: string;
  finishedAt?: string;
  input: string;
  steps: RunStep[];
  totalTokens: number;
}

export const MODELS = [
  { id: "google/gemini-3.6-flash", label: "Gemini 3.6 Flash", vendor: "Google", speed: "Rất nhanh" },
  { id: "google/gemini-3-pro", label: "Gemini 3 Pro", vendor: "Google", speed: "Cân bằng" },
  { id: "openai/gpt-5.2", label: "GPT-5.2", vendor: "OpenAI", speed: "Chậm, mạnh" },
  { id: "openai/gpt-5.2-mini", label: "GPT-5.2 Mini", vendor: "OpenAI", speed: "Nhanh" },
  { id: "anthropic/claude-sonnet", label: "Claude Sonnet", vendor: "Anthropic", speed: "Cân bằng" },
] as const;

export const TOOLS = [
  "web_search",
  "http_request",
  "sql_query",
  "vector_search",
  "send_email",
  "code_interpreter",
  "file_reader",
  "slack_post",
] as const;

export const NODE_META: Record<
  NodeKind,
  { label: string; token: string; icon: string; hint: string }
> = {
  trigger: { label: "Trigger", token: "io", icon: "Zap", hint: "Điểm bắt đầu workflow" },
  agent: { label: "AI Agent", token: "agent", icon: "Bot", hint: "Gọi một agent + model" },
  tool: { label: "Tool", token: "tool", icon: "Wrench", hint: "Gọi công cụ / API" },
  condition: { label: "Condition", token: "logic", icon: "GitBranch", hint: "Rẽ nhánh theo điều kiện" },
  transform: { label: "Transform", token: "logic", icon: "Code2", hint: "Biến đổi dữ liệu" },
  human: { label: "Human Review", token: "tool", icon: "UserCheck", hint: "Chờ người duyệt" },
  output: { label: "Output", token: "io", icon: "CheckCircle2", hint: "Kết quả cuối cùng" },
};