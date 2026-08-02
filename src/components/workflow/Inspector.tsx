import { Trash2, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MODELS, TOOLS, type Agent, type NodeConfig, type Port, type PortType } from "@/lib/workflow-types";
import { uid } from "@/lib/workflow-store";

const PORT_TYPES: PortType[] = ["text", "json", "number", "boolean", "file", "any"];

interface Props {
  nodeId: string;
  data: NodeConfig;
  agents: Agent[];
  upstream: { id: string; label: string }[];
  onChange: (patch: Partial<NodeConfig>) => void;
  onDelete: () => void;
  onClose: () => void;
}

export function Inspector({ data, agents, upstream, onChange, onDelete, onClose }: Props) {
  const isAgent = data.kind === "agent";

  const setPorts = (key: "inputs" | "outputs", ports: Port[]) => onChange({ [key]: ports });

  const PortEditor = ({ side }: { side: "inputs" | "outputs" }) => (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs">{side === "inputs" ? "Input ports" : "Output ports"}</Label>
        <Button
          size="sm"
          variant="ghost"
          className="h-6 px-2 text-xs"
          onClick={() =>
            setPorts(side, [
              ...data[side],
              { id: uid("p"), name: side === "inputs" ? "input" : "output", type: "text" },
            ])
          }
        >
          <Plus className="mr-1 size-3" /> Thêm
        </Button>
      </div>
      {data[side].length === 0 && (
        <p className="text-[11px] text-muted-foreground">Chưa có cổng nào.</p>
      )}
      {data[side].map((p, i) => (
        <div key={p.id} className="flex items-center gap-1.5">
          <Input
            value={p.name}
            onChange={(e) => {
              const next = [...data[side]];
              next[i] = { ...p, name: e.target.value };
              setPorts(side, next);
            }}
            className="h-8 flex-1 text-xs"
          />
          <Select
            value={p.type}
            onValueChange={(v) => {
              const next = [...data[side]];
              next[i] = { ...p, type: v as PortType };
              setPorts(side, next);
            }}
          >
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PORT_TYPES.map((t) => (
                <SelectItem key={t} value={t} className="text-xs">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="icon"
            variant="ghost"
            className="size-8 shrink-0"
            onClick={() => setPorts(side, data[side].filter((x) => x.id !== p.id))}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );

  return (
    <aside className="flex h-full w-[340px] shrink-0 flex-col border-l border-border bg-sidebar">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold">Cấu hình node</h2>
          <p className="text-[11px] text-muted-foreground">{data.kind}</p>
        </div>
        <Button size="icon" variant="ghost" className="size-7" onClick={onClose}>
          <X className="size-4" />
        </Button>
      </div>

      <Tabs defaultValue="general" className="flex min-h-0 flex-1 flex-col">
        <TabsList className="mx-3 mt-3 grid grid-cols-3">
          <TabsTrigger value="general" className="text-xs">
            Chung
          </TabsTrigger>
          <TabsTrigger value="model" className="text-xs">
            Model
          </TabsTrigger>
          <TabsTrigger value="io" className="text-xs">
            I/O
          </TabsTrigger>
        </TabsList>

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          <TabsContent value="general" className="mt-0 space-y-4">
            <Field label="Tên node">
              <Input
                value={data.label}
                onChange={(e) => onChange({ label: e.target.value })}
                className="h-9"
              />
            </Field>
            <Field label="Mô tả">
              <Textarea
                value={data.description ?? ""}
                onChange={(e) => onChange({ description: e.target.value })}
                rows={2}
                className="text-xs"
              />
            </Field>

            {data.kind === "tool" && (
              <>
                <Field label="Công cụ">
                  <Select
                    value={data.toolName ?? ""}
                    onValueChange={(v) => onChange({ toolName: v })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn tool" />
                    </SelectTrigger>
                    <SelectContent>
                      {TOOLS.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Tham số (JSON)">
                  <Textarea
                    value={data.toolParams ?? ""}
                    onChange={(e) => onChange({ toolParams: e.target.value })}
                    rows={4}
                    className="font-mono text-[11px]"
                  />
                </Field>
              </>
            )}

            {(data.kind === "condition" || data.kind === "transform") && (
              <Field label={data.kind === "condition" ? "Điều kiện" : "Biểu thức biến đổi"}>
                <Textarea
                  value={data.expression ?? ""}
                  onChange={(e) => onChange({ expression: e.target.value })}
                  rows={3}
                  className="font-mono text-[11px]"
                  placeholder="score >= 8"
                />
              </Field>
            )}

            <div className="grid grid-cols-2 gap-3">
              <Field label="Số lần retry">
                <Input
                  type="number"
                  min={0}
                  value={data.retries ?? 0}
                  onChange={(e) => onChange({ retries: Number(e.target.value) })}
                  className="h-9"
                />
              </Field>
              <Field label="Timeout (ms)">
                <Input
                  type="number"
                  min={0}
                  step={500}
                  value={data.timeoutMs ?? 30000}
                  onChange={(e) => onChange({ timeoutMs: Number(e.target.value) })}
                  className="h-9"
                />
              </Field>
            </div>
          </TabsContent>

          <TabsContent value="model" className="mt-0 space-y-4">
            {!isAgent ? (
              <p className="text-xs text-muted-foreground">
                Chỉ node <b>AI Agent</b> mới có cấu hình model & context.
              </p>
            ) : (
              <>
                <Field label="Agent thực thi">
                  <Select
                    value={data.agentId ?? ""}
                    onValueChange={(v) => {
                      const ag = agents.find((a) => a.id === v);
                      onChange({
                        agentId: v,
                        model: ag?.defaultModel ?? data.model ?? "",
                        temperature: ag?.temperature ?? data.temperature ?? 0.7,
                      });
                    }}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn agent" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} — {a.role}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Model">
                  <Select value={data.model ?? ""} onValueChange={(v) => onChange({ model: v })}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder="Chọn model" />
                    </SelectTrigger>
                    <SelectContent>
                      {MODELS.map((m) => (
                        <SelectItem key={m.id} value={m.id}>
                          <span className="flex items-center gap-2">
                            {m.label}
                            <span className="text-[10px] text-muted-foreground">{m.speed}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label={`Temperature — ${(data.temperature ?? 0.7).toFixed(2)}`}>
                  <Slider
                    value={[data.temperature ?? 0.7]}
                    min={0}
                    max={2}
                    step={0.05}
                    onValueChange={([v]) => onChange({ temperature: v ?? 0.7 })}
                  />
                </Field>

                <Field label="Max tokens">
                  <Input
                    type="number"
                    value={data.maxTokens ?? 2048}
                    onChange={(e) => onChange({ maxTokens: Number(e.target.value) })}
                    className="h-9"
                  />
                </Field>

                <Field label="System prompt (ghi đè agent)">
                  <Textarea
                    value={data.systemPrompt ?? ""}
                    onChange={(e) => onChange({ systemPrompt: e.target.value })}
                    rows={3}
                    className="text-xs"
                    placeholder="Để trống để dùng prompt mặc định của agent"
                  />
                </Field>

                <Field label="Prompt template">
                  <Textarea
                    value={data.promptTemplate ?? ""}
                    onChange={(e) => onChange({ promptTemplate: e.target.value })}
                    rows={4}
                    className="font-mono text-[11px]"
                    placeholder="Dùng {{tên_biến}} để chèn dữ liệu từ node trước"
                  />
                </Field>

                <Field label="Chế độ context">
                  <Select
                    value={data.contextMode ?? "last"}
                    onValueChange={(v) => onChange({ contextMode: v as NodeConfig["contextMode"] })}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Không dùng context</SelectItem>
                      <SelectItem value="last">Chỉ output node trước</SelectItem>
                      <SelectItem value="full">Toàn bộ lịch sử workflow</SelectItem>
                      <SelectItem value="custom">Chọn node cụ thể</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                {data.contextMode === "custom" && (
                  <Field label="Nguồn context">
                    <div className="flex flex-wrap gap-1.5">
                      {upstream.length === 0 && (
                        <p className="text-[11px] text-muted-foreground">Không có node phía trước.</p>
                      )}
                      {upstream.map((u) => {
                        const on = (data.contextSources ?? []).includes(u.id);
                        return (
                          <Badge
                            key={u.id}
                            variant={on ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => {
                              const cur = data.contextSources ?? [];
                              onChange({
                                contextSources: on
                                  ? cur.filter((x) => x !== u.id)
                                  : [...cur, u.id],
                              });
                            }}
                          >
                            {u.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </Field>
                )}

                <Field label="Memory key (chia sẻ giữa các run)">
                  <Input
                    value={data.memoryKey ?? ""}
                    onChange={(e) => onChange({ memoryKey: e.target.value })}
                    className="h-9 font-mono text-xs"
                    placeholder="vd: user_profile"
                  />
                </Field>
              </>
            )}
          </TabsContent>

          <TabsContent value="io" className="mt-0 space-y-5">
            <PortEditor side="inputs" />
            <PortEditor side="outputs" />
          </TabsContent>
        </div>
      </Tabs>

      <div className="border-t border-border p-3">
        <Button variant="destructive" size="sm" className="w-full" onClick={onDelete}>
          <Trash2 className="mr-1.5 size-3.5" /> Xoá node
        </Button>
      </div>
    </aside>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}