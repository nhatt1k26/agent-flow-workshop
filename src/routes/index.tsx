import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import {
  Plus,
  Copy,
  Trash2,
  Workflow as WorkflowIcon,
  Bot,
  Activity,
  Coins,
  Search,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { store, useStore } from "@/lib/workflow-store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "AgentFlow · Tạo & quản lý workflow AI agent" },
      {
        name: "description",
        content:
          "Xây dựng workflow AI agent bằng canvas kéo thả: gán agent, chọn model, cấu hình context và input/output cho từng node.",
      },
      { property: "og:title", content: "AgentFlow · Workflow cho AI agent" },
      {
        property: "og:description",
        content: "Editor kéo thả, thư viện agent, chạy thử và lịch sử thực thi trong một nơi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  const workflows = useStore(useCallback((s) => s.workflows, []));
  const agents = useStore(useCallback((s) => s.agents, []));
  const runs = useStore(useCallback((s) => s.runs, []));
  const navigate = useNavigate();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");

  const filtered = workflows.filter((w) =>
    (w.name + w.description + w.tags.join(" ")).toLowerCase().includes(q.toLowerCase()),
  );
  const tokens = runs.reduce((a, r) => a + r.totalTokens, 0);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Workflows</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Thiết kế, cấu hình và chạy thử các quy trình nhiều AI agent.
            </p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-1.5 size-4" /> Workflow mới
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Tạo workflow mới</DialogTitle>
                <DialogDescription>
                  Workflow sẽ khởi tạo với một node Trigger sẵn có.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">Tên</Label>
                  <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Support Triage Bot" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Mô tả</Label>
                  <Textarea value={desc} onChange={(e) => setDesc(e.target.value)} rows={3} />
                </div>
              </div>
              <DialogFooter>
                <Button
                  disabled={!name.trim()}
                  onClick={() => {
                    const wf = store.createWorkflow(name.trim(), desc.trim());
                    setOpen(false);
                    setName("");
                    setDesc("");
                    navigate({ to: "/editor/$workflowId", params: { workflowId: wf.id } });
                  }}
                >
                  Tạo & mở editor
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-4">
          <Stat icon={WorkflowIcon} label="Workflow" value={workflows.length} />
          <Stat icon={Bot} label="Agent" value={agents.length} />
          <Stat icon={Activity} label="Lần chạy" value={runs.length} />
          <Stat icon={Coins} label="Tokens đã dùng" value={tokens} />
        </div>

        <div className="relative mt-8 max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm workflow…"
            className="pl-9"
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((w) => {
            const last = runs.find((r) => r.workflowId === w.id);
            return (
              <div
                key={w.id}
                className="group flex flex-col rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-start justify-between gap-2">
                  <Link
                    to="/editor/$workflowId"
                    params={{ workflowId: w.id }}
                    className="min-w-0 flex-1"
                  >
                    <h2 className="truncate text-sm font-semibold">{w.name}</h2>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {w.description || "Chưa có mô tả"}
                    </p>
                  </Link>
                  <Badge
                    variant="outline"
                    className={cn(
                      "shrink-0 text-[10px]",
                      w.status === "active" && "border-success/50 text-success",
                      w.status === "paused" && "border-warning/50 text-warning",
                    )}
                  >
                    {w.status}
                  </Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-1">
                  {w.tags.map((t) => (
                    <Badge key={t} variant="secondary" className="text-[10px]">
                      {t}
                    </Badge>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span>{w.nodes.length} node</span>
                  <span>{w.edges.length} liên kết</span>
                  {last && <span>chạy gần nhất: {last.status}</span>}
                </div>

                <div className="mt-4 flex gap-2 border-t border-border pt-3">
                  <Button asChild size="sm" className="h-7 flex-1 text-xs">
                    <Link to="/editor/$workflowId" params={{ workflowId: w.id }}>
                      Mở editor
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    onClick={() => store.duplicateWorkflow(w.id)}
                    aria-label="Nhân bản"
                  >
                    <Copy className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-destructive"
                    onClick={() => store.deleteWorkflow(w.id)}
                    aria-label="Xoá"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
          {filtered.length === 0 && (
            <p className="col-span-full rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              Chưa có workflow nào khớp.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
      <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-4" />
      </span>
      <div>
        <p className="text-lg font-semibold leading-none">{value.toLocaleString()}</p>
        <p className="mt-1 text-[11px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
