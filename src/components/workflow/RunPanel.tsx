import { useState } from "react";
import { Play, Square, ChevronRight, Loader2, CheckCircle2, AlertTriangle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Run, RunStep } from "@/lib/workflow-types";
import { cn } from "@/lib/utils";

interface Props {
  run: Run | undefined;
  running: boolean;
  input: string;
  onInput: (v: string) => void;
  onRun: () => void;
  onClose: () => void;
}

export function RunPanel({ run, running, input, onInput, onRun, onClose }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex h-72 shrink-0 flex-col border-t border-border bg-sidebar">
      <div className="flex items-center gap-3 border-b border-border px-4 py-2">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Bảng chạy thử
        </h3>
        {run && (
          <Badge
            variant="outline"
            className={cn(
              "text-[10px]",
              run.status === "success" && "border-success/50 text-success",
              run.status === "error" && "border-destructive/50 text-destructive",
              run.status === "running" && "border-primary/50 text-primary",
            )}
          >
            {run.status} · {run.totalTokens} tokens
          </Badge>
        )}
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" className="h-7 text-xs" onClick={onRun} disabled={running}>
            {running ? (
              <Loader2 className="mr-1 size-3 animate-spin" />
            ) : (
              <Play className="mr-1 size-3" />
            )}
            Chạy workflow
          </Button>
          <Button size="icon" variant="ghost" className="size-7" onClick={onClose}>
            <Square className="size-3.5" />
          </Button>
        </div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-2 border-r border-border p-3">
          <span className="text-[11px] text-muted-foreground">Input khởi tạo</span>
          <Textarea
            value={input}
            onChange={(e) => onInput(e.target.value)}
            className="flex-1 resize-none text-xs"
            placeholder="Nhập dữ liệu đầu vào cho trigger…"
          />
        </div>

        <div className="min-h-0 overflow-y-auto p-3">
          {!run && (
            <p className="text-xs text-muted-foreground">
              Chưa có lần chạy nào. Bấm “Chạy workflow” để mô phỏng thực thi từng node.
            </p>
          )}
          <div className="space-y-1">
            {run?.steps.map((s) => (
              <StepRow
                key={s.nodeId}
                step={s}
                open={open === s.nodeId}
                onToggle={() => setOpen(open === s.nodeId ? null : s.nodeId)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function StepRow({ step, open, onToggle }: { step: RunStep; open: boolean; onToggle: () => void }) {
  const Icon =
    step.status === "running"
      ? Loader2
      : step.status === "success"
        ? CheckCircle2
        : step.status === "error"
          ? AlertTriangle
          : Clock;
  return (
    <div className="rounded-md border border-border bg-card">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs"
      >
        <ChevronRight className={cn("size-3 transition-transform", open && "rotate-90")} />
        <Icon
          className={cn(
            "size-3.5",
            step.status === "running" && "animate-spin text-primary",
            step.status === "success" && "text-success",
            step.status === "error" && "text-destructive",
            (step.status === "pending" || step.status === "skipped") && "text-muted-foreground",
          )}
        />
        <span className="font-medium">{step.label}</span>
        <span className="text-[10px] uppercase text-muted-foreground">{step.kind}</span>
        <span className="ml-auto flex items-center gap-2 text-[10px] text-muted-foreground">
          {step.model && <span className="font-mono">{step.model.split("/")[1]}</span>}
          {step.tokens > 0 && <span>{step.tokens} tok</span>}
          {step.durationMs > 0 && <span>{step.durationMs}ms</span>}
        </span>
      </button>
      {open && (
        <div className="space-y-2 border-t border-border px-3 py-2 text-[11px]">
          <div>
            <p className="mb-0.5 text-muted-foreground">Input</p>
            <pre className="whitespace-pre-wrap rounded bg-background p-2 font-mono">
              {step.input || "—"}
            </pre>
          </div>
          <div>
            <p className="mb-0.5 text-muted-foreground">Output</p>
            <pre className="whitespace-pre-wrap rounded bg-background p-2 font-mono">
              {step.output || "—"}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}