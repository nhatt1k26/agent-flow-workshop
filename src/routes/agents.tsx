import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { Plus, Bot, Trash2, Pencil } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { store, uid, useStore } from "@/lib/workflow-store";
import { MODELS, TOOLS, type Agent } from "@/lib/workflow-types";

export const Route = createFileRoute("/agents")({
  head: () => ({
    meta: [
      { title: "Thư viện Agent · AgentFlow" },
      {
        name: "description",
        content:
          "Quản lý các AI agent: vai trò, system prompt, model mặc định, nhiệt độ và bộ công cụ được phép dùng.",
      },
      { property: "og:title", content: "Thư viện Agent · AgentFlow" },
      {
        property: "og:description",
        content: "Định nghĩa agent tái sử dụng cho mọi workflow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AgentsPage,
});

const blank = (): Agent => ({
  id: uid("ag"),
  name: "",
  role: "",
  systemPrompt: "",
  defaultModel: "google/gemini-3.6-flash",
  tools: [],
  temperature: 0.7,
  createdAt: new Date().toISOString(),
});

function AgentsPage() {
  const agents = useStore(useCallback((s) => s.agents, []));
  const [draft, setDraft] = useState<Agent | null>(null);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Thư viện Agent</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Agent định nghĩa một lần, dùng lại ở mọi node trong mọi workflow.
            </p>
          </div>
          <Button onClick={() => setDraft(blank())}>
            <Plus className="mr-1.5 size-4" /> Agent mới
          </Button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((a) => (
            <div key={a.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start gap-3">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-agent/30 bg-agent/10 text-agent">
                  <Bot className="size-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-sm font-semibold">{a.name}</h2>
                  <p className="truncate text-xs text-muted-foreground">{a.role}</p>
                </div>
                <Button size="icon" variant="ghost" className="size-7" onClick={() => setDraft(a)}>
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 text-destructive"
                  onClick={() => store.deleteAgent(a.id)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
              <p className="mt-3 line-clamp-3 text-[11px] leading-relaxed text-muted-foreground">
                {a.systemPrompt}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <Badge variant="outline" className="font-mono text-[10px]">
                  {a.defaultModel.split("/")[1]}
                </Badge>
                <Badge variant="secondary" className="text-[10px]">
                  temp {a.temperature}
                </Badge>
                {a.tools.map((t) => (
                  <Badge key={t} variant="secondary" className="text-[10px]">
                    {t}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={!!draft} onOpenChange={(o) => !o && setDraft(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft && agents.some((a) => a.id === draft.id) ? "Sửa agent" : "Agent mới"}</DialogTitle>
          </DialogHeader>
          {draft && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs">Tên</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Vai trò</Label>
                <Input value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">System prompt</Label>
                <Textarea
                  rows={5}
                  className="text-xs"
                  value={draft.systemPrompt}
                  onChange={(e) => setDraft({ ...draft, systemPrompt: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Model mặc định</Label>
                <Select
                  value={draft.defaultModel}
                  onValueChange={(v) => setDraft({ ...draft, defaultModel: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MODELS.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Temperature — {draft.temperature.toFixed(2)}</Label>
                <Slider
                  value={[draft.temperature]}
                  min={0}
                  max={2}
                  step={0.05}
                  onValueChange={([v]) => setDraft({ ...draft, temperature: v ?? 0.7 })}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Công cụ được phép</Label>
                <div className="flex flex-wrap gap-1.5">
                  {TOOLS.map((t) => {
                    const on = draft.tools.includes(t);
                    return (
                      <Badge
                        key={t}
                        variant={on ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          setDraft({
                            ...draft,
                            tools: on ? draft.tools.filter((x) => x !== t) : [...draft.tools, t],
                          })
                        }
                      >
                        {t}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              disabled={!draft?.name.trim()}
              onClick={() => {
                if (draft) store.upsertAgent(draft);
                setDraft(null);
              }}
            >
              Lưu agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}