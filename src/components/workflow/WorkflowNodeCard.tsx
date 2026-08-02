import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Bot,
  CheckCircle2,
  Code2,
  GitBranch,
  UserCheck,
  Wrench,
  Zap,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import type { NodeConfig, NodeKind, StepStatus } from "@/lib/workflow-types";
import { kindStyles } from "./node-visuals";
import { cn } from "@/lib/utils";

const icons: Record<NodeKind, typeof Bot> = {
  trigger: Zap,
  agent: Bot,
  tool: Wrench,
  condition: GitBranch,
  transform: Code2,
  human: UserCheck,
  output: CheckCircle2,
};

export type WfNodeData = NodeConfig & { runStatus?: StepStatus; agentName?: string };

export function WorkflowNodeCard({ data, selected }: NodeProps) {
  const d = data as unknown as WfNodeData;
  const s = kindStyles[d.kind];
  const Icon = icons[d.kind];
  const running = d.runStatus === "running";

  return (
    <div
      className={cn(
        "w-[230px] rounded-xl border bg-card/95 backdrop-blur transition-all",
        s.ring,
        selected ? "glow-primary" : "shadow-lg shadow-black/30",
        running && "animate-pulse",
        d.runStatus === "success" && "border-success/60",
        d.runStatus === "error" && "border-destructive/70",
      )}
    >
      {d.kind !== "trigger" && (
        <Handle type="target" position={Position.Left} id="in" />
      )}

      <div className="flex items-center gap-2 border-b border-border/60 px-3 py-2">
        <span className={cn("grid size-7 place-items-center rounded-md border", s.chip)}>
          <Icon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-semibold leading-tight">{d.label}</p>
          <p className={cn("text-[10px] uppercase tracking-wider", s.text)}>{d.kind}</p>
        </div>
        {running && <Loader2 className="size-3.5 animate-spin text-primary" />}
        {d.runStatus === "success" && <CheckCircle2 className="size-3.5 text-success" />}
        {d.runStatus === "error" && <AlertTriangle className="size-3.5 text-destructive" />}
      </div>

      <div className="space-y-1.5 px-3 py-2">
        {d.kind === "agent" && (
          <>
            <Row label="Agent" value={d.agentName ?? "chưa chọn"} />
            <Row label="Model" value={d.model?.split("/")[1] ?? "—"} mono />
            <Row label="Context" value={d.contextMode ?? "last"} />
          </>
        )}
        {d.kind === "tool" && <Row label="Tool" value={d.toolName ?? "—"} mono />}
        {(d.kind === "condition" || d.kind === "transform") && (
          <Row label="Expr" value={d.expression ?? "—"} mono />
        )}
        {d.description && (
          <p className="line-clamp-2 text-[11px] text-muted-foreground">{d.description}</p>
        )}

        {(d.inputs.length > 0 || d.outputs.length > 0) && (
          <div className="flex gap-2 pt-1 text-[10px]">
            <div className="flex-1 space-y-0.5">
              {d.inputs.map((p) => (
                <div key={p.id} className="truncate text-muted-foreground">
                  ◂ {p.name}
                  <span className="opacity-50">:{p.type}</span>
                </div>
              ))}
            </div>
            <div className="flex-1 space-y-0.5 text-right">
              {d.outputs.map((p) => (
                <div key={p.id} className="truncate text-muted-foreground">
                  {p.name}
                  <span className="opacity-50">:{p.type}</span> ▸
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {d.kind === "condition" ? (
        <>
          <Handle type="source" position={Position.Right} id="true" style={{ top: "38%" }} />
          <Handle type="source" position={Position.Right} id="false" style={{ top: "72%" }} />
        </>
      ) : (
        d.kind !== "output" && <Handle type="source" position={Position.Right} id="out" />
      )}
    </div>
  );
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 text-[11px]">
      <span className="text-muted-foreground">{label}</span>
      <span className={cn("truncate", mono && "font-mono text-[10px]")}>{value}</span>
    </div>
  );
}