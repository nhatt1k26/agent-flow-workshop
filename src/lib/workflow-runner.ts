import { store, uid } from "./workflow-store";
import type { Run, RunStep, Workflow, WorkflowNode } from "./workflow-types";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function order(wf: Workflow): WorkflowNode[] {
  const indeg = new Map(wf.nodes.map((n) => [n.id, 0]));
  wf.edges.forEach((e) => indeg.set(e.target, (indeg.get(e.target) ?? 0) + 1));
  const queue = wf.nodes.filter((n) => (indeg.get(n.id) ?? 0) === 0);
  const seen = new Set<string>();
  const out: WorkflowNode[] = [];
  while (queue.length) {
    const n = queue.shift()!;
    if (seen.has(n.id)) continue;
    seen.add(n.id);
    out.push(n);
    wf.edges
      .filter((e) => e.source === n.id)
      .forEach((e) => {
        const t = wf.nodes.find((x) => x.id === e.target);
        if (t && !seen.has(t.id)) queue.push(t);
      });
  }
  wf.nodes.forEach((n) => {
    if (!seen.has(n.id)) out.push(n);
  });
  return out;
}

function fakeOutput(node: WorkflowNode, input: string): string {
  const d = node.data;
  switch (d.kind) {
    case "trigger":
      return input || "(chưa có input)";
    case "agent":
      return `[${d.model ?? "model"}] Phản hồi của "${d.label}" dựa trên context ${d.contextMode ?? "last"}:\n• Điểm chính 1 rút ra từ đầu vào\n• Điểm chính 2\n• Đề xuất bước tiếp theo`;
    case "tool":
      return `{ "tool": "${d.toolName ?? "unknown"}", "ok": true, "items": 7 }`;
    case "condition":
      return `expression "${d.expression ?? "true"}" → ${Math.random() > 0.25 ? "true" : "false"}`;
    case "transform":
      return `{ "transformed": true, "length": ${input.length} }`;
    case "human":
      return "approved = true (mô phỏng duyệt tự động)";
    case "output":
      return input.slice(0, 400);
  }
}

export interface RunHandle {
  runId: string;
  promise: Promise<void>;
  /** Mở khoá breakpoint. step = true: chạy đúng 1 node rồi dừng tiếp. */
  resume: (step?: boolean) => void;
}

export function executeWorkflow(wf: Workflow, input: string): RunHandle {
  const runId = uid("run");
  const nodes = order(wf);
  const steps: RunStep[] = nodes.map((n) => ({
    nodeId: n.id,
    label: n.data.label,
    kind: n.data.kind,
    status: "pending" as const,
    input: "",
    output: "",
    model: n.data.model ?? "",
    agent: n.data.agentId ?? "",
    tokens: 0,
    durationMs: 0,
    startedAt: "",
  }));

  const run: Run = {
    id: runId,
    workflowId: wf.id,
    workflowName: wf.name,
    status: "running",
    startedAt: new Date().toISOString(),
    input,
    steps,
    totalTokens: 0,
  };
  store.addRun(run);

  // ===== debug pause machinery =====
  let resolvePause: (() => void) | null = null;
  let forcePauseNext = false;

  const awaitResume = () =>
    new Promise<void>((res) => {
      resolvePause = res;
    });

  const resume = (step = false) => {
    forcePauseNext = step;
    resolvePause?.();
    resolvePause = null;
  };

  const promise = (async () => {
    let carry = input;
    let total = 0;
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i]!;
      const base = steps[i]!;

      // --- debug: dừng trước node nếu dây nối vào nó có breakpoint ---
      if (i > 0) {
        const hitBp = wf.edges.some(
          (e) => e.breakpoint && e.target === node.id,
        );
        if (hitBp || forcePauseNext) {
          forcePauseNext = false;
          steps[i] = { ...base, status: "waiting" };
          store.updateRun(runId, {
            steps: [...steps],
            status: "paused",
            pausedAt: node.id,
          });
          await awaitResume();
        }
      }

      steps[i] = {
        ...steps[i]!,
        status: "running",
        input: carry.slice(0, 500),
        startedAt: new Date().toISOString(),
      };
      store.updateRun(runId, { steps: [...steps], status: "running", pausedAt: undefined });
      const dur = 350 + Math.round(Math.random() * 700);
      await sleep(dur);
      const failed = node.data.kind !== "trigger" && Math.random() < 0.04;
      const output = fakeOutput(node, carry);
      const tokens = node.data.kind === "agent" ? 200 + Math.round(Math.random() * 900) : 0;
      total += tokens;
      steps[i] = {
        ...steps[i]!,
        status: failed ? "error" : "success",
        output: failed ? "Lỗi mô phỏng: hết thời gian chờ từ nhà cung cấp." : output,
        tokens,
        durationMs: dur,
      };
      store.updateRun(runId, { steps: [...steps], totalTokens: total });
      if (failed) {
        for (let j = i + 1; j < steps.length; j++)
          steps[j] = { ...steps[j]!, status: "skipped" };
        store.updateRun(runId, {
          steps: [...steps],
          status: "error",
          finishedAt: new Date().toISOString(),
        });
        return;
      }
      carry = output;
    }
    store.updateRun(runId, {
      status: "success",
      finishedAt: new Date().toISOString(),
      totalTokens: total,
    });
  })();

  return { runId, promise, resume };
}
