import { Bot, CheckCircle2, Code2, GitBranch, UserCheck, Wrench, Zap } from "lucide-react";
import type { NodeKind } from "@/lib/workflow-types";
import { NODE_META } from "@/lib/workflow-types";
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

const kinds = Object.keys(NODE_META) as NodeKind[];

export function NodePalette({ onAdd }: { onAdd: (kind: NodeKind) => void }) {
  return (
    <div className="flex h-full w-60 shrink-0 flex-col border-r border-border bg-sidebar">
      <div className="border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold">Thư viện node</h2>
        <p className="text-[11px] text-muted-foreground">Kéo vào canvas hoặc bấm để thêm</p>
      </div>
      <div className="flex-1 space-y-2 overflow-y-auto p-3">
        {kinds.map((kind) => {
          const meta = NODE_META[kind];
          const Icon = icons[kind];
          const s = kindStyles[kind];
          return (
            <button
              key={kind}
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData("application/agentflow-node", kind);
                e.dataTransfer.effectAllowed = "move";
              }}
              onClick={() => onAdd(kind)}
              className={cn(
                "flex w-full cursor-grab items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 text-left transition-colors hover:border-primary/50 hover:bg-accent active:cursor-grabbing",
              )}
            >
              <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md border", s.chip)}>
                <Icon className="size-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-xs font-medium">{meta.label}</span>
                <span className="block text-[11px] leading-snug text-muted-foreground">
                  {meta.hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}