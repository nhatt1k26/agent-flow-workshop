import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2, Pause } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/ui/badge";
import { useStore } from "@/lib/workflow-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/runs")({
  head: () => ({
    meta: [
      { title: "Lịch sử chạy · AgentFlow" },
      {
        name: "description",
        content:
          "Theo dõi từng lần thực thi workflow: trạng thái mỗi node, model đã dùng, số token và thời gian xử lý.",
      },
      { property: "og:title", content: "Lịch sử chạy · AgentFlow" },
      {
        property: "og:description",
        content: "Nhật ký thực thi chi tiết cho mọi workflow AI agent.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RunsPage,
});

function RunsPage() {
  const runs = useStore(useCallback((s) => s.runs, []));
  const [open, setOpen] = useState<string | null>(runs[0]?.id ?? null);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Lịch sử chạy</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Mỗi lần chạy lưu lại input, output và chi phí của từng node.
            </p>
          </div>
        </div>

        {runs.length === 0 && (
          <p className="mt-8 rounded-lg border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
            Chưa có lần chạy nào. Mở một{" "}
            <Link to="/" className="text-primary underline">
              workflow
            </Link>{" "}
            và bấm “Chạy workflow”.
          </p>
        )}

        <div className="mt-6 space-y-2">
          {runs.map((r) => (
            <div key={r.id} className="overflow-hidden rounded-xl border border-border bg-card">
              <button
                onClick={() => setOpen(open === r.id ? null : r.id)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left"
              >
                {r.status === "running" ? (
                  <Loader2 className="size-4 animate-spin text-primary" />
                ) : r.status === "success" ? (
                  <CheckCircle2 className="size-4 text-success" />
                ) : r.status === "paused" ? (
                  <Pause className="size-4 text-warning" />
                ) : (
                  <AlertTriangle className="size-4 text-destructive" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{r.workflowName}</p>
                  <p className="truncate text-[11px] text-muted-foreground">{r.input}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">
                  {r.steps.filter((s) => s.status === "success").length}/{r.steps.length} bước
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  {r.totalTokens} tokens
                </Badge>
                <span className="text-[11px] text-muted-foreground">
                  {new Date(r.startedAt).toLocaleString("vi-VN")}
                </span>
              </button>
              {open === r.id && (
                <div className="space-y-1 border-t border-border bg-background/40 p-3">
                  {r.steps.map((s) => (
                    <div
                      key={s.nodeId}
                      className="grid grid-cols-[1fr_auto] gap-2 rounded-md border border-border bg-card px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium">
                          {s.label}{" "}
                          <span
                            className={cn(
                              "ml-1 text-[10px] uppercase",
                              s.status === "success" && "text-success",
                              s.status === "error" && "text-destructive",
                              s.status === "skipped" && "text-muted-foreground",
                              s.status === "waiting" && "text-warning",
                            )}
                          >
                            {s.status}
                          </span>
                        </p>
                        <pre className="mt-1 line-clamp-3 whitespace-pre-wrap text-[11px] text-muted-foreground">
                          {s.output || "—"}
                        </pre>
                      </div>
                      <div className="text-right text-[10px] text-muted-foreground">
                        {s.model && <p className="font-mono">{s.model.split("/")[1]}</p>}
                        <p>{s.tokens} tok</p>
                        <p>{s.durationMs}ms</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}