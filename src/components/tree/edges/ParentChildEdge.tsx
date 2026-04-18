import { memo } from "react";
import { type EdgeProps, getBezierPath } from "@xyflow/react";
import type { ParentChildEdgeData } from "@/types/graph";

function ParentChildEdge({
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
}: EdgeProps) {
  const [edgePath] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  return (
    <g>
      <path
        d={edgePath}
        fill="none"
        stroke="#2a2a2a"
        strokeWidth={1.5}
      />
    </g>
  );
}

export default memo(ParentChildEdge);