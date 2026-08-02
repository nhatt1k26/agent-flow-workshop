import type { NodeKind } from "@/lib/workflow-types";

export const kindStyles: Record<
  NodeKind,
  { ring: string; text: string; chip: string; dot: string }
> = {
  trigger: {
    ring: "border-io/50",
    text: "text-io",
    chip: "bg-io/10 text-io border-io/30",
    dot: "bg-io",
  },
  agent: {
    ring: "border-agent/50",
    text: "text-agent",
    chip: "bg-agent/10 text-agent border-agent/30",
    dot: "bg-agent",
  },
  tool: {
    ring: "border-tool/50",
    text: "text-tool",
    chip: "bg-tool/10 text-tool border-tool/30",
    dot: "bg-tool",
  },
  condition: {
    ring: "border-logic/50",
    text: "text-logic",
    chip: "bg-logic/10 text-logic border-logic/30",
    dot: "bg-logic",
  },
  transform: {
    ring: "border-logic/50",
    text: "text-logic",
    chip: "bg-logic/10 text-logic border-logic/30",
    dot: "bg-logic",
  },
  human: {
    ring: "border-tool/50",
    text: "text-tool",
    chip: "bg-tool/10 text-tool border-tool/30",
    dot: "bg-tool",
  },
  output: {
    ring: "border-io/50",
    text: "text-io",
    chip: "bg-io/10 text-io border-io/30",
    dot: "bg-io",
  },
};

export const portColor: Record<string, string> = {
  text: "text-muted-foreground",
  json: "text-tool",
  number: "text-io",
  boolean: "text-logic",
  file: "text-agent",
  any: "text-muted-foreground",
};