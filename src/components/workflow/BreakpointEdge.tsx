import {
  BaseEdge,
  EdgeLabelRenderer,
  getBezierPath,
  type EdgeProps,
} from "@xyflow/react";
import { Pause } from "lucide-react";
import { cn } from "@/lib/utils";

export type BpEdgeData = { breakpoint?: boolean; paused?: boolean };

export function BreakpointEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style,
}: EdgeProps) {
  const [path, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
  });
  const d = (data ?? {}) as BpEdgeData;
  const bp = Boolean(d.breakpoint);
  const paused = Boolean(d.paused);

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        {...(markerEnd ? { markerEnd } : {})}
        {...(style ? { style } : {})}
      />
      {bp && (
        <EdgeLabelRenderer>
          <div
            style={{
              transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            }}
            className="nodrag nopan pointer-events-none absolute flex items-center justify-center"
          >
            <span
              className={cn(
                "grid size-5 place-items-center rounded-full border-2 border-destructive bg-background shadow-md shadow-black/40",
                paused && "animate-pulse ring-4 ring-destructive/40",
              )}
            >
              <Pause className="size-3 text-destructive" strokeWidth={2.5} />
            </span>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}
